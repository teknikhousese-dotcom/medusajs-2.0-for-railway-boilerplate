import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// Wiki "Köp X betala för Y" (xfory.php) mirror. Each rule becomes a real Medusa
// buyget promotion: buy X of the chosen products, the (X - Y) cheapest are free.
// The Wiki-facing fields (regelnamn, X, Y, valda produkter) are kept in metadata
// so the list renders exactly like Wiki without reverse-parsing the rule graph.

function svc(scope: any) { return scope.resolve(Modules.PROMOTION) }
function query(scope: any) { return scope.resolve(ContainerRegistrationKeys.QUERY) }

function rndCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let s = "XFY"
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // Product search helper for the "Välj produkter" picker
  if (req.query.products) {
    try {
      const q = String(req.query.q || "").trim()
      const { data } = await query(req.scope).graph({
        entity: "product",
        fields: ["id", "title"],
        filters: q ? { title: { $ilike: `%${q}%` } } : {},
        pagination: { take: 30 },
      })
      return res.json({ products: (data || []).map((p: any) => ({ id: p.id, title: p.title })) })
    } catch (e: any) { return res.status(500).json({ error: String((e && e.message) || e) }) }
  }
  try {
    const s = svc(req.scope)
    const proms = await s.listPromotions({ type: "buyget" }, { take: 1000 })
    const rules = (proms || []).map((p: any) => {
      const m = p.metadata || {}
      return {
        id: p.id, code: p.code, namn: m.namn || p.code,
        x: m.x != null ? m.x : "", y: m.y != null ? m.y : "",
        products: m.product_titles || "Alla valda", product_ids: m.product_ids || "",
        created_at: p.created_at, status: p.status,
      }
    })
    res.json({ rules })
  } catch (e: any) { res.status(500).json({ error: String((e && e.message) || e) }) }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b: any = req.body || {}
  const s = svc(req.scope)
  try {
    if (b.kind === "new") {
      const namn = (b.namn || "").trim()
      const x = Math.round(Number(b.x) || 0)
      const y = Math.round(Number(b.y) || 0)
      const ids: string[] = Array.isArray(b.product_ids) ? b.product_ids.filter(Boolean) : []
      if (!namn) return res.status(400).json({ error: "Regelnamn krävs." })
      if (!(x > y && y >= 0)) return res.status(400).json({ error: "X måste vara större än Y." })
      if (!ids.length) return res.status(400).json({ error: "Välj minst en produkt." })
      const free = x - y
      const titles: string = (b.product_titles || "").toString()
      const created = await s.createPromotions([{
        code: (b.code || "").trim().toUpperCase() || rndCode(),
        type: "buyget", is_automatic: true, status: "active",
        application_method: {
          type: "percentage", target_type: "items", allocation: "each",
          value: 100, apply_to_quantity: free, max_quantity: free, buy_rules_min_quantity: x,
          target_rules: [{ attribute: "product_id", operator: "in", values: ids }],
          buy_rules: [{ attribute: "product_id", operator: "in", values: ids }],
        },
        metadata: { wiki_kind: "xfory", namn, x: String(x), y: String(y), product_ids: ids.join(","), product_titles: titles },
      }])
      return res.json({ ok: true, id: created && created[0] && created[0].id })
    }
    if (b.kind === "update") {
      if (!b.id) return res.status(400).json({ error: "id krävs." })
      const cur = await s.retrievePromotion(b.id).catch(() => null)
      const meta = Object.assign({}, (cur && cur.metadata) || {})
      if (b.namn != null) meta.namn = b.namn
      if (b.x != null) meta.x = String(b.x)
      if (b.y != null) meta.y = String(b.y)
      await s.updatePromotions([{ id: b.id, metadata: meta }])
      return res.json({ ok: true, id: b.id })
    }
    if (b.kind === "delete") {
      if (!b.id) return res.status(400).json({ error: "id krävs." })
      await s.deletePromotions([b.id])
      return res.json({ ok: true })
    }
    return res.status(400).json({ error: "okänd åtgärd" })
  } catch (e: any) {
    return res.status(500).json({ error: String((e && e.message) || e) })
  }
}
