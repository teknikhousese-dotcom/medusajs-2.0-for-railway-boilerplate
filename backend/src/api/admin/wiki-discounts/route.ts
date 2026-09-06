import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// Wiki "Rabattkoder" (discounts.php) mirror. Creates/lists/edits/deletes real
// Medusa promotions in three Wiki flavours:
//   percent   -> percentage off the whole order
//   amount    -> fixed SEK off the order (or gift card / single-customer variants)
//   freeship  -> free shipping (100% off shipping methods)
// Wiki-only fields (engångskod, start-/sluttid, belopp-typ) live in promotion.metadata.

function svc(scope: any) { return scope.resolve(Modules.PROMOTION) }

function classify(p: any): string {
  const am = p.application_method || {}
  const meta = p.metadata || {}
  if (p.type === "buyget") return "xfory"
  if (meta.wiki_kind) return String(meta.wiki_kind)
  if (am.target_type === "shipping_methods") return "freeship"
  if (am.type === "fixed") return "amount"
  return "percent"
}

function rndCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let s = ""
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const s = svc(req.scope)
    const proms = await s.listPromotions({}, { relations: ["application_method"], take: 2000 })
    const rows = (proms || []).map((p: any) => {
      const am = p.application_method || {}
      return {
        id: p.id, code: p.code, status: p.status, type: p.type,
        value: am.value != null ? am.value : "", am_type: am.type || "",
        target_type: am.target_type || "", currency_code: am.currency_code || "",
        created_at: p.created_at, metadata: p.metadata || {}, kind: classify(p),
      }
    }).filter((p: any) => p.kind !== "xfory")
    res.json({ discounts: rows })
  } catch (e: any) { res.status(500).json({ error: String((e && e.message) || e) }) }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b: any = req.body || {}
  const s = svc(req.scope)
  try {
    if (b.kind === "new_percent") {
      const code = (b.code || "").trim().toUpperCase() || rndCode()
      const value = Math.round(Number(b.percentage) || 0)
      if (!value) return res.status(400).json({ error: "Ange en procentsats." })
      const created = await s.createPromotions([{
        code, type: "standard", is_automatic: false, status: "active",
        application_method: { type: "percentage", target_type: "order", value, allocation: "across" },
        metadata: { wiki_kind: "percent", isonetime: b.isonetime ? "1" : "", start: b.start || "", end: b.end || "" },
      }])
      return res.json({ ok: true, id: created && created[0] && created[0].id })
    }
    if (b.kind === "new_amount") {
      const code = (b.code || "").trim().toUpperCase() || rndCode()
      const value = Math.round(Number(b.amountSEK) || 0)
      if (!value) return res.status(400).json({ error: "Ange ett belopp i kr." })
      const created = await s.createPromotions([{
        code, type: "standard", is_automatic: false, status: "active",
        application_method: { type: "fixed", target_type: "order", currency_code: "sek", value, allocation: "across" },
        metadata: { wiki_kind: "amount", amount_type: b.type || "flera", start: b.start || "", end: b.end || "" },
      }])
      return res.json({ ok: true, id: created && created[0] && created[0].id })
    }
    if (b.kind === "new_freeship") {
      const code = (b.code || "").trim().toUpperCase() || rndCode()
      const created = await s.createPromotions([{
        code, type: "standard", is_automatic: false, status: "active",
        application_method: { type: "percentage", target_type: "shipping_methods", value: 100, allocation: "across" },
        metadata: { wiki_kind: "freeship", isonetime: b.isonetime ? "1" : "", start: b.start || "", end: b.end || "" },
      }])
      return res.json({ ok: true, id: created && created[0] && created[0].id })
    }
    if (b.kind === "update") {
      if (!b.id) return res.status(400).json({ error: "id krävs." })
      // Merge metadata (start/end/onetime/amount_type)
      const cur = await s.retrievePromotion(b.id, { relations: ["application_method"] }).catch(() => null)
      const meta = Object.assign({}, (cur && cur.metadata) || {})
      if (b.isonetime != null) meta.isonetime = b.isonetime ? "1" : ""
      if (b.start != null) meta.start = b.start
      if (b.end != null) meta.end = b.end
      if (b.amount_type != null) meta.amount_type = b.amount_type
      await s.updatePromotions([{ id: b.id, metadata: meta }])
      // Update the value on the application method if provided
      if (b.value != null && cur && cur.application_method && cur.application_method.id) {
        const v = Math.round(Number(b.value) || 0)
        try { await s.updateApplicationMethods([{ id: cur.application_method.id, value: v }]) }
        catch (e) { await s.updatePromotions([{ id: b.id, application_method: { id: cur.application_method.id, value: v } }]) }
      }
      if (b.status != null) { try { await s.updatePromotions([{ id: b.id, status: b.status }]) } catch (e) {} }
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
