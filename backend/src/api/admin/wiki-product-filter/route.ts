import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Hantera produkter – server-side urval som Medusas produkt-API inte klarar
// (metadata-filter). Returnerar produkt-id:n för en sida + totalt antal.
// Filter: q (namn/artnr), category_id, status, leverantor, urval
// (kampanj | dolda | nya). ?suppliers=1 → lista över leverantörer med antal.

function s(v: any) { return String(v == null ? "" : v).trim() }
function like(v: string) { return "%" + v.replace(/[\\%_]/g, (m) => "\\" + m) + "%" }

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const q: any = req.query || {}
    const knex: any = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    if (s(q.suppliers)) {
      const r = await knex.raw(`SELECT NULLIF(trim(p.metadata->>'leverantor'), '') AS name, count(*)::int AS n FROM product p WHERE p.deleted_at IS NULL GROUP BY 1 ORDER BY 1 NULLS LAST`)
      return res.json({ suppliers: (r.rows || []).filter((x: any) => x.name).map((x: any) => ({ name: x.name, count: x.n })) })
    }

    const text = s(q.q)
    const catId = s(q.category_id)
    const status = s(q.status)
    const lev = s(q.leverantor)
    const urval = s(q.urval)
    const limit = Math.max(1, Math.min(500, parseInt(s(q.limit) || "50") || 50))
    const offset = Math.max(0, parseInt(s(q.offset) || "0") || 0)

    const where: string[] = ["p.deleted_at IS NULL"]
    const b: any[] = []
    if (text) {
      where.push(`(p.title ILIKE ? OR EXISTS (SELECT 1 FROM product_variant v WHERE v.product_id = p.id AND v.deleted_at IS NULL AND (v.sku ILIKE ? OR v.barcode ILIKE ?)))`)
      b.push(like(text), like(text), like(text))
    }
    if (catId) { where.push(`EXISTS (SELECT 1 FROM product_category_product pcp WHERE pcp.product_id = p.id AND pcp.product_category_id = ?)`); b.push(catId) }
    if (status) { where.push(`p.status = ?`); b.push(status) }
    if (lev === "__none__") where.push(`COALESCE(trim(p.metadata->>'leverantor'), '') = ''`)
    else if (lev) { where.push(`trim(p.metadata->>'leverantor') = ?`); b.push(lev) }
    let order = `p.title ASC, p.id ASC`
    if (urval === "kampanj") {
      // Aktiva kampanjer: kampanj ikryssad och dagens datum inom start/slut (tomt = obegränsat).
      where.push(`(p.metadata->>'kampanj') = 'true' AND COALESCE(NULLIF(p.metadata->>'kampanj_start', ''), '0000-00-00') <= to_char(now(), 'YYYY-MM-DD') AND COALESCE(NULLIF(p.metadata->>'kampanj_slut', ''), '9999-99-99') >= to_char(now(), 'YYYY-MM-DD')`)
    }
    else if (urval === "dolda") where.push(`(p.status <> 'published' OR COALESCE(p.metadata->>'visning', 'show') IN ('hide_shop', 'hide_full'))`)
    else if (urval === "nya") {
      where.push(`p.id IN (SELECT n.id FROM product n WHERE n.deleted_at IS NULL ORDER BY CASE WHEN (n.metadata->>'wiki_id') ~ '^[0-9]+$' THEN (n.metadata->>'wiki_id')::int ELSE 2147483647 END DESC, n.created_at DESC LIMIT 200)`)
      order = `CASE WHEN (p.metadata->>'wiki_id') ~ '^[0-9]+$' THEN (p.metadata->>'wiki_id')::int ELSE 2147483647 END DESC, p.created_at DESC`
    }

    const w = where.join(" AND ")
    const cnt = await knex.raw(`SELECT count(*)::int AS n FROM product p WHERE ${w}`, b)
    const count = Number((cnt.rows && cnt.rows[0] && cnt.rows[0].n) || 0)
    const r = await knex.raw(`SELECT p.id FROM product p WHERE ${w} ORDER BY ${order} LIMIT ? OFFSET ?`, [...b, limit, offset])
    res.json({ ids: (r.rows || []).map((x: any) => x.id), count, limit, offset })
  } catch (e: any) {
    console.error("[wiki-product-filter]", e)
    res.status(500).json({ error: "Något gick fel. Försök igen.", detail: String((e && e.message) || e).slice(0, 300) })
  }
}
