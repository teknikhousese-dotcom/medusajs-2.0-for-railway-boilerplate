import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// Wiki Kunddatabas segmentering (customers.php "Gör ett urval").
// Filters REAL Medusa customers by name / email / phone / postnummer / ort /
// land / köpt produkt — mirroring the Wiki customer search. Kept dependency-free
// (module services + in-memory filtering) so it works on the current store size.

const TAKE = 5000

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const q: any = req.query || {}
    const name = String(q.name || "").toLowerCase().trim()
    const email = String(q.email || "").toLowerCase().trim()
    const phone = String(q.phone || "").replace(/\s+/g, "").trim()
    const zip = String(q.zip || "").toLowerCase().trim()
    const city = String(q.city || "").toLowerCase().trim()
    const country = String(q.country || "").toLowerCase().trim()
    const product = String(q.product || "").toLowerCase().trim()
    const artNo = String(q.artNo || "").toLowerCase().trim()
    const limit = Math.min(200, parseInt(String(q.limit || "50")) || 50)
    const offset = parseInt(String(q.offset || "0")) || 0

    const customerSvc: any = req.scope.resolve(Modules.CUSTOMER)
    const orderSvc: any = req.scope.resolve(Modules.ORDER)

    const customers: any[] = await customerSvc.listCustomers({}, { relations: ["addresses"], take: TAKE })

    // product / article filter → set of customer_ids that ordered a matching item
    let prodIds: Set<string> | null = null
    if (product || artNo) {
      prodIds = new Set<string>()
      const orders: any[] = await orderSvc.listOrders({}, { relations: ["items"], take: TAKE })
      for (const o of orders) {
        if (!o.customer_id) continue
        const items = o.items || []
        const hit = items.some((it: any) => {
          const t = String(it.title || it.product_title || "").toLowerCase()
          const sku = String(it.variant_sku || it.sku || "").toLowerCase()
          return (product && t.includes(product)) || (artNo && sku.includes(artNo))
        })
        if (hit) prodIds.add(o.customer_id)
      }
    }

    const match = (c: any) => {
      const full = [c.first_name, c.last_name].filter(Boolean).join(" ").toLowerCase()
      if (name && !full.includes(name)) return false
      if (email && !String(c.email || "").toLowerCase().includes(email)) return false
      const addrs = c.addresses || []
      if (phone) {
        const p = (String(c.phone || "") + " " + addrs.map((a: any) => a.phone || "").join(" ")).replace(/\s+/g, "")
        if (!p.includes(phone)) return false
      }
      if (zip && !addrs.some((a: any) => String(a.postal_code || "").toLowerCase().includes(zip))) return false
      if (city && !addrs.some((a: any) => String(a.city || "").toLowerCase().includes(city))) return false
      if (country && !addrs.some((a: any) => String(a.country_code || "").toLowerCase() === country)) return false
      if (prodIds && !prodIds.has(c.id)) return false
      return true
    }

    const filtered = customers.filter(match)
    const count = filtered.length
    const pageRows = filtered.slice(offset, offset + limit)

    const data: any[] = []
    for (const c of pageRows) {
      const addr = (c.addresses && c.addresses[0]) || {}
      let orders = 0
      try { const r = await orderSvc.listAndCountOrders({ customer_id: c.id }, { take: 1 }); orders = (r && r[1]) || 0 } catch {}
      const nm = [c.first_name, c.last_name].filter(Boolean).join(" ") || String(c.email || "").split("@")[0]
      data.push({ id: c.id, name: nm, email: c.email || "", phone: c.phone || addr.phone || "", city: addr.city || "", orders })
    }
    res.json({ customers: data, count })
  } catch (e: any) { res.status(500).json({ error: String((e && e.message) || e) }) }
}
