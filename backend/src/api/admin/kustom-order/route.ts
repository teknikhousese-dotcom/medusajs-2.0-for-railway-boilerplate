import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { getManagement, capture, cancel, extendAuth, refund } from "../../../lib/kustom"

/*
 * Klarna/Kustom-panel i orderdetaljen.
 * Native ordrar: metadata.kustom_order_id / klarna_order_id.
 * Wiki-importerade ordrar: metadata.wiki_klarna_order_id (+ referens, butik-id, giltig tills) skrapat från Wiki.
 * Wiki-ordrar kan bara hanteras här om vår Kustom-koppling faktiskt når Klarna-ordern (reachable).
 * Alla anrop mot Kustom kontrolleras (r.ok) innan metadata uppdateras.
 */

async function load(scope: any, order_id: string) {
  const om: any = scope.resolve(Modules.ORDER)
  const o: any = await om.retrieveOrder(order_id, { select: ["id", "metadata", "payment_status", "total", "currency_code"] })
  const m: any = o?.metadata || {}
  const native = m.kustom_order_id || m.klarna_order_id || null
  const wikiKid = m.wiki_klarna_order_id || null
  return { om, o, m, kid: native || wikiKid, isWiki: !native && !!wikiKid }
}

async function mgmtOf(kid: string): Promise<{ ok: boolean; json: any; status: number }> {
  try {
    const r: any = await getManagement(kid)
    return { ok: !!(r && r.ok), json: r && r.ok ? r.json : null, status: (r && r.status) || 0 }
  } catch (e) {
    return { ok: false, json: null, status: 0 }
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const order_id = String((req.query as any).order_id || "")
  if (!order_id) return res.status(400).json({ ok: false, message: "order_id kravs." })
  try {
    const { o, m, kid, isWiki } = await load(req.scope, order_id)
    if (!kid) return res.json({ ok: true, kustom: false })
    const mg = await mgmtOf(kid)
    const j: any = mg.json || {}
    return res.json({
      ok: true,
      kustom: true,
      wiki: isWiki,
      reachable: mg.ok,
      kustom_order_id: kid,
      payment_status: o?.payment_status || null,
      captured: m.kustom_captured === true || (isWiki && m.wiki_activated === true),
      cancelled: m.kustom_cancelled === true,
      status: j.status || null,
      reference: j.klarna_reference || j.kustom_reference || (isWiki ? m.wiki_klarna_reference : null) || j.merchant_reference1 || null,
      expiry: j.expires_at || j.expiry || (isWiki ? m.wiki_klarna_valid_until : null) || null,
      order_amount: j.order_amount != null ? j.order_amount : null,
      remaining_authorized_amount: j.remaining_authorized_amount != null ? j.remaining_authorized_amount : null,
      butik_id: (isWiki ? m.wiki_klarna_butik_id : null) || process.env.KUSTOM_USERNAME || null,
    })
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: "Kunde inte lasa Klarna-ordern." })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body: any = req.body || {}
  const order_id = String(body.order_id || "")
  const action = String(body.action || "")
  if (!order_id || !action) return res.status(400).json({ ok: false, message: "order_id och action kravs." })
  try {
    const { om, o, m, kid, isWiki } = await load(req.scope, order_id)
    if (!kid) return res.status(400).json({ ok: false, message: "Ingen Klarna-order kopplad till denna order." })
    let wikiRemaining = 0
    if (isWiki) {
      if (m.wiki_activated === true && action !== "refund") return res.status(400).json({ ok: false, message: "Ordern ar redan aktiverad i Wiki." })
      const mg = await mgmtOf(kid)
      if (!mg.ok) return res.status(400).json({ ok: false, message: "Klarna-ordern fran Wiki kan inte nas via var Kustom-koppling. Aktivera i Klarna/Kustom portalen." })
      wikiRemaining = Number((mg.json && mg.json.remaining_authorized_amount) || 0)
    }
    if (action === "capture") {
      const amount = isWiki ? wikiRemaining : Math.round(Number(o?.total || 0) * 100)
      if (!(amount > 0)) return res.status(400).json({ ok: false, message: "Inget belopp att aktivera." })
      const r: any = await capture(kid, amount)
      if (!r || !r.ok) return res.status(502).json({ ok: false, message: "Klarna nekade aktiveringen (" + ((r && r.status) || "fel") + ")." })
      const meta = Object.assign({}, m, { kustom_captured: true, kustom_captured_at: new Date().toISOString() })
      await om.updateOrders([{ id: order_id, metadata: meta }])
      return res.json({ ok: true, action, status: "CAPTURED" })
    }
    if (action === "cancel") {
      const r: any = await cancel(kid)
      if (!r || !r.ok) return res.status(502).json({ ok: false, message: "Klarna nekade avbrytningen (" + ((r && r.status) || "fel") + ")." })
      const meta = Object.assign({}, m, { kustom_cancelled: true, kustom_cancelled_at: new Date().toISOString() })
      await om.updateOrders([{ id: order_id, metadata: meta }])
      return res.json({ ok: true, action, status: "CANCELLED" })
    }
    if (action === "refund") {
      const amount = Math.round(Number(body.amount || 0) * 100)
      if (amount <= 0) return res.status(400).json({ ok: false, message: "Ange ett belopp storre an 0." })
      const r: any = await refund(kid, amount)
      if (!r || !r.ok) return res.status(502).json({ ok: false, message: "Klarna nekade krediteringen (" + ((r && r.status) || "fel") + ")." })
      const prev = Number(m.kustom_refunded || 0)
      const meta = Object.assign({}, m, { kustom_refunded: prev + Number(body.amount || 0), kustom_refunded_at: new Date().toISOString() })
      await om.updateOrders([{ id: order_id, metadata: meta }])
      return res.json({ ok: true, action, credited: Number(body.amount || 0) })
    }
    if (action === "extend") {
      const r: any = await extendAuth(kid)
      if (!r || !r.ok) return res.status(502).json({ ok: false, message: "Klarna nekade forlangningen (" + ((r && r.status) || "fel") + ")." })
      return res.json({ ok: true, action })
    }
    return res.status(400).json({ ok: false, message: "Okand atgard." })
  } catch (e: any) {
    return res.status(502).json({ ok: false, message: "Klarna-atgarden misslyckades. Forsok igen." })
  }
}
