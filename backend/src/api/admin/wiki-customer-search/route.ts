import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Wiki Kunddatabas segmentering (customers.php "Gör ett urval").
// Runs every filter in SQL across ALL customers (no in-memory cap) and returns
// a real total + one page of rows. Filters: name, email, phone, zip, city,
// country, product (köpt produkt), artNo, categories (köpt i varugrupp, inkl.
// undergrupper), dateStart/dateEnd (orderdatum), payMethod, onlyNewsletter.

function s(v: any) { return String(v == null ? "" : v).trim() }
function like(v: string) { return "%" + v.replace(/[\\%_]/g, (m) => "\\" + m) + "%" }

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const q: any = req.query || {}
    const name = s(q.name)
    const email = s(q.email)
    const phone = s(q.phone).replace(/[\s-]+/g, "")
    const zip = s(q.zip || q.zipCode).replace(/\s+/g, "")
    const city = s(q.city)
    const country = s(q.country).toLowerCase()
    const product = s(q.product)
    const artNo = s(q.artNo)
    const dateStart = s(q.dateStart)
    const dateEnd = s(q.dateEnd)
    const payMethod = s(q.payMethod).toUpperCase()
    const onlyNewsletter = ["1", "true", "on", "yes"].includes(s(q.onlyNewsletter).toLowerCase())
    const catRaw: any = q.categories ?? q["categories[]"] ?? ""
    const categories: string[] = (Array.isArray(catRaw) ? catRaw : String(catRaw).split(",")).map((x: any) => s(x)).filter(Boolean)
    const limit = Math.max(1, Math.min(500, parseInt(s(q.limit) || "50") || 50))
    const offset = Math.max(0, parseInt(s(q.offset) || "0") || 0)

    const knex: any = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    const where: string[] = ["c.deleted_at IS NULL"]
    const b: any[] = []

    if (name) {
      where.push(`((COALESCE(c.first_name,'') || ' ' || COALESCE(c.last_name,'')) ILIKE ? OR c.company_name ILIKE ? OR EXISTS (SELECT 1 FROM customer_address na WHERE na.customer_id = c.id AND na.deleted_at IS NULL AND ((COALESCE(na.first_name,'') || ' ' || COALESCE(na.last_name,'')) ILIKE ? OR na.company ILIKE ?)))`)
      b.push(like(name), like(name), like(name), like(name))
    }
    if (email) { where.push(`c.email ILIKE ?`); b.push(like(email)) }
    if (phone) {
      where.push(`(regexp_replace(COALESCE(c.phone,'') || ' ' || COALESCE(c.metadata->>'wiki_cellphone','') || ' ' || COALESCE(c.metadata->>'wiki_telephone',''), '[\\s-]', '', 'g') LIKE ? OR EXISTS (SELECT 1 FROM customer_address pa WHERE pa.customer_id = c.id AND pa.deleted_at IS NULL AND regexp_replace(COALESCE(pa.phone,''), '[\\s-]', '', 'g') LIKE ?))`)
      b.push(like(phone), like(phone))
    }
    if (zip) {
      where.push(`EXISTS (SELECT 1 FROM customer_address za WHERE za.customer_id = c.id AND za.deleted_at IS NULL AND replace(COALESCE(za.postal_code,''), ' ', '') ILIKE ?)`)
      b.push(zip.replace(/[\\%_]/g, (m) => "\\" + m) + "%")
    }
    if (city) {
      where.push(`EXISTS (SELECT 1 FROM customer_address ca WHERE ca.customer_id = c.id AND ca.deleted_at IS NULL AND ca.city ILIKE ?)`)
      b.push(like(city))
    }
    if (country) {
      const cc = country === "uk" ? "gb" : country
      where.push(`EXISTS (SELECT 1 FROM customer_address la WHERE la.customer_id = c.id AND la.deleted_at IS NULL AND lower(la.country_code) = ?)`)
      b.push(cc)
    }
    if (onlyNewsletter) where.push(`(c.metadata->>'wiki_newsletter') = 'true'`)

    // Order based filters – all conditions must hit the same order.
    const oc: string[] = []
    const ob: any[] = []
    let needItems = false
    if (product) { needItems = true; oc.push(`(li.title ILIKE ? OR li.product_title ILIKE ?)`); ob.push(like(product), like(product)) }
    // Imported Wiki order lines have no product_id/variant_sku; the article number is in li.metadata.sku.
    if (artNo) { needItems = true; oc.push(`lower(COALESCE(NULLIF(li.variant_sku, ''), li.metadata->>'sku', '')) = lower(?)`); ob.push(artNo) }
    if (categories.length) {
      needItems = true
      const catProducts = `SELECT pcp.product_id FROM product_category_product pcp JOIN product_category pc ON pc.id = pcp.product_category_id JOIN product_category root ON root.id = ANY(?) WHERE pc.deleted_at IS NULL AND (pc.id = root.id OR pc.mpath LIKE root.mpath || '%')`
      oc.push(`(li.product_id IN (${catProducts}) OR COALESCE(NULLIF(li.variant_sku, ''), li.metadata->>'sku') IN (SELECT v.sku FROM product_variant v WHERE v.deleted_at IS NULL AND v.sku IS NOT NULL AND v.product_id IN (${catProducts})))`)
      ob.push(categories, categories)
    }
    if (dateStart) { oc.push(`o.created_at >= ?::date`); ob.push(dateStart) }
    if (dateEnd) { oc.push(`o.created_at < (?::date + interval '1 day')`); ob.push(dateEnd) }
    if (payMethod) { oc.push(`upper(COALESCE(o.metadata->>'payment_method','')) = ?`); ob.push(payMethod) }
    if (oc.length) {
      const join = needItems ? ` JOIN order_item oi ON oi.order_id = o.id AND oi.deleted_at IS NULL JOIN order_line_item li ON li.id = oi.item_id AND li.deleted_at IS NULL` : ""
      where.push(`EXISTS (SELECT 1 FROM "order" o${join} WHERE o.customer_id = c.id AND o.deleted_at IS NULL AND ${oc.join(" AND ")})`)
      b.push(...ob)
    }

    const w = where.join(" AND ")
    const cnt = await knex.raw(`SELECT count(*)::int AS n FROM customer c WHERE ${w}`, b)
    const count = Number((cnt.rows && cnt.rows[0] && cnt.rows[0].n) || 0)

    const rowsRes = await knex.raw(
      `SELECT c.id, c.first_name, c.last_name, c.email, c.phone,
        (SELECT a.city FROM customer_address a WHERE a.customer_id = c.id AND a.deleted_at IS NULL ORDER BY a.is_default_billing DESC, a.created_at ASC LIMIT 1) AS city,
        (SELECT a.phone FROM customer_address a WHERE a.customer_id = c.id AND a.deleted_at IS NULL AND COALESCE(a.phone,'') <> '' LIMIT 1) AS addr_phone,
        (SELECT count(*)::int FROM "order" o WHERE o.customer_id = c.id AND o.deleted_at IS NULL) AS orders
       FROM customer c WHERE ${w}
       ORDER BY c.created_at DESC, c.id DESC LIMIT ? OFFSET ?`,
      [...b, limit, offset]
    )
    const data = (rowsRes.rows || []).map((c: any) => {
      const nm = [c.first_name, c.last_name].filter(Boolean).join(" ") || String(c.email || "").split("@")[0]
      return { id: c.id, name: nm, email: c.email || "", phone: c.phone || c.addr_phone || "", city: c.city || "", orders: Number(c.orders || 0) }
    })
    res.json({ customers: data, count, limit, offset })
  } catch (e: any) {
    console.error("[wiki-customer-search]", e)
    res.status(500).json({ error: "Något gick fel. Försök igen.", detail: String((e && e.message) || e).slice(0, 300) })
  }
}
