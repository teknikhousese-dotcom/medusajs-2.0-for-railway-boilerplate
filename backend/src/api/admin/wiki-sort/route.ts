import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// Wiki drag-sort persistence (products.php?action=sorting + categories.php?sort=1).
// POST { type:"products", ids:[...] }  -> writes metadata.sort_order = index on each product
// POST { type:"categories", ids:[...] } -> writes rank = index on each product category
// Order is the array order; index 0 = first.

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b: any = req.body || {}
  const type = String(b.type || "")
  const ids: string[] = Array.isArray(b.ids) ? b.ids : []
  try {
    const svc: any = req.scope.resolve(Modules.PRODUCT)
    if (type === "categories") {
      let ok = 0
      for (let i = 0; i < ids.length; i++) {
        try { await svc.updateProductCategories(ids[i], { rank: i }); ok++ } catch {}
      }
      return res.json({ ok: true, updated: ok })
    }
    if (type === "products") {
      let ok = 0
      for (let i = 0; i < ids.length; i++) {
        try {
          const p = await svc.retrieveProduct(ids[i]).catch(() => null)
          const meta = Object.assign({}, (p && p.metadata) || {}, { sort_order: i })
          await svc.updateProducts(ids[i], { metadata: meta })
          ok++
        } catch {}
      }
      return res.json({ ok: true, updated: ok })
    }
    return res.status(400).json({ error: "okänd typ" })
  } catch (e: any) { res.status(500).json({ error: String((e && e.message) || e) }) }
}
