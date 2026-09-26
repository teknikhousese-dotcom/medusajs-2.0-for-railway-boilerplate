import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// Wiki -> Medusa bulk import (customers + native orders).
// Fed in batches by an operator: POST { mode, rows }. Idempotent & resumable.
// customers: skip existing email.
// orders: create-only, skip existing metadata.wiki_order_id. Writes the Wiki status fields
//   (orderflik, read, status_dot, internal_comment, kund_meddelad, ...) into metadata.
//   Freight-only orders (no product lines, only a shipping line) are imported with items [].
// orders_update: update-only, matched on metadata.wiki_order_id. Merges ONLY the Wiki status
//   keys into metadata (never items, totals, customer, addresses or order status).
// No workflow is used and no event is emitted, so no subscriber (order.placed email) can fire.

let REGION_ID: string | null = null
let CHANNEL_ID: string | null = null

const FLIK_BY_NUM: Record<string, string> = { "0": "nya", "1": "makulerade", "-1": "arkiverade" }
const DOTS = ["", "gul", "gron", "rod"]

function flikOf(o: any): string | undefined {
  const v = o.orderflik ?? o.flik ?? o.metadata?.orderflik
  if (v === undefined || v === null || v === "") return undefined
  const s = String(v).toLowerCase()
  if (FLIK_BY_NUM[s]) return FLIK_BY_NUM[s]
  if (s.startsWith("makul")) return "makulerade"
  if (s.startsWith("arkiv")) return "arkiverade"
  if (s === "nya") return "nya"
  return s
}

function dotOf(v: any): string | undefined {
  if (v === undefined || v === null) return undefined
  const s = String(v).toLowerCase()
  if (s === "1") return "gul"
  if (s === "2") return "gron"
  if (s === "3") return "rod"
  if (s === "grön" || s === "green") return "gron"
  if (s === "röd" || s === "red") return "rod"
  if (s === "yellow") return "gul"
  return DOTS.includes(s) ? s : undefined
}

function pick(o: any, key: string, alt?: string): any {
  if (o[key] !== undefined) return o[key]
  if (alt && o[alt] !== undefined) return o[alt]
  if (o.metadata && o.metadata[key] !== undefined) return o.metadata[key]
  return undefined
}

// Wiki status fields -> metadata patch. Only keys present in the row are returned.
function wikiStatusMeta(o: any, opts: { keepEmptyComment?: boolean } = {}): Record<string, any> {
  const m: Record<string, any> = {}
  const flik = flikOf(o)
  if (flik) m.orderflik = flik
  const read = pick(o, "read")
  if (read !== undefined) m.read = read === true || read === "true" || read === 1
  const dot = dotOf(pick(o, "status_dot", "dot"))
  if (dot !== undefined) m.status_dot = dot
  const cm = pick(o, "internal_comment")
  if (cm !== undefined && cm !== null) {
    const s = String(cm)
    if (s.trim() !== "" || opts.keepEmptyComment) m.internal_comment = s
  }
  const km = pick(o, "kund_meddelad")
  if (km !== undefined) m.kund_meddelad = km || null
  const sms = pick(o, "sms_meddelad")
  if (sms !== undefined) m.sms_meddelad = sms || null
  const fu = pick(o, "followup_sent")
  if (fu !== undefined) m.followup_sent = fu === true || fu === "true"
  const act = pick(o, "activated", "wiki_activated")
  if (act !== undefined) m.wiki_activated = act === null ? null : act === true
  const paid = pick(o, "paid", "wiki_paid")
  if (paid !== undefined) m.wiki_paid = paid === null ? null : paid === true
  const shipped = pick(o, "shipped", "wiki_shipped")
  if (shipped !== undefined) m.wiki_shipped = shipped === null ? null : shipped === true
  const st = pick(o, "wiki_status")
  if (st !== undefined) m.wiki_status = st
  const idc = pick(o, "wiki_id_color")
  if (idc !== undefined) m.wiki_id_color = idc || null
  const via = pick(o, "ordered_via")
  if (via !== undefined && via !== null && via !== "") m.ordered_via = via
  const mr = pick(o, "wiki_makulerad_row")
  if (mr !== undefined) m.wiki_makulerad_row = mr === true
  const ret = pick(o, "wiki_has_return")
  if (ret !== undefined) m.wiki_has_return = ret === true
  if (Object.keys(m).length) m.wiki_status_synced_at = new Date().toISOString()
  return m
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body: any = req.body || {}
  const mode = body.mode || "customers"
  const rows: any[] = Array.isArray(body.rows) ? body.rows : []
  const customerModule: any = req.scope.resolve(Modules.CUSTOMER)

  if (mode === "customers") {
    const emails = rows.map((c) => c.email).filter(Boolean)
    const existing = emails.length
      ? await customerModule.listCustomers({ email: emails }, { select: ["id", "email"], take: emails.length })
      : []
    const have = new Set(existing.map((c: any) => (c.email || "").toLowerCase()))
    const toCreate = rows.filter((c) => c.email && !have.has(c.email.toLowerCase()))
    let created = 0
    let error: string | null = null
    if (toCreate.length) {
      try {
        const made = await customerModule.createCustomers(
          toCreate.map((c) => ({
            email: c.email,
            first_name: c.first_name || undefined,
            last_name: c.last_name || undefined,
            phone: c.phone || undefined,
            company_name: c.company || undefined,
            metadata: { source: "wiki", wiki_migrated: true },
          }))
        )
        const addrs: any[] = []
        made.forEach((cust: any, i: number) => {
          const c = toCreate[i]
          if (c.address_1) addrs.push({
            customer_id: cust.id,
            first_name: c.first_name || undefined,
            last_name: c.last_name || undefined,
            company: c.company || undefined,
            address_1: c.address_1,
            address_2: c.address_2 || undefined,
            postal_code: c.postal_code || undefined,
            city: c.city || undefined,
            country_code: (c.country_code || "se").toLowerCase(),
            phone: c.phone || undefined,
            is_default_shipping: true,
            is_default_billing: true,
          })
        })
        if (addrs.length) await customerModule.createCustomerAddresses(addrs)
        created = made.length
      } catch (e: any) { error = e.message }
    }
    return res.json({ mode, received: rows.length, created, skipped: rows.length - toCreate.length, error })
  }

  if (mode === "orders") {
    const orderModule: any = req.scope.resolve(Modules.ORDER)
    const regionModule: any = req.scope.resolve(Modules.REGION)
    const channelModule: any = req.scope.resolve(Modules.SALES_CHANNEL)
    if (!REGION_ID) {
      const [r] = await regionModule.listRegions({ name: process.env.REGION_NAME || "Sverige" }, { take: 1 })
      REGION_ID = r?.id || null
    }
    if (!CHANNEL_ID) {
      const [c] = await channelModule.listSalesChannels({ name: process.env.CHANNEL_NAME || "Teknikhouse.se" }, { take: 1 })
      CHANNEL_ID = c?.id || null
    }
    if (!REGION_ID || !CHANNEL_ID) return res.status(400).json({ error: "Region eller försäljningskanal saknas." })

    const created: any[] = []
    const skipped: any[] = []
    const failed: any[] = []
    for (const o of rows) {
      const wid = o.wiki_order_id === undefined || o.wiki_order_id === null ? "" : String(o.wiki_order_id)
      if (!wid) { skipped.push({ wiki_order_id: null, reason: "missing wiki_order_id" }); continue }
      const ex = await orderModule.listOrders({ metadata: { wiki_order_id: wid } }, { select: ["id"], take: 1 }).catch(() => [])
      if (ex.length) { skipped.push({ wiki_order_id: wid, reason: "exists", id: ex[0].id }); continue }
      const items = (o.items || []).map((it: any) => ({
        title: it.title || it.sku || "Vara",
        quantity: it.quantity || 1,
        unit_price: it.unit_price_excl_vat ?? 0,
        metadata: { sku: it.sku, vat_rate: it.vat_rate },
      }))
      const hasShipping = !!o.shipping_method?.name
      if (!items.length && !hasShipping) { skipped.push({ wiki_order_id: wid, reason: "no items and no shipping line" }); continue }
      let customer_id: string | undefined
      if (o.email) {
        const [c] = await customerModule.listCustomers({ email: o.email }, { select: ["id"], take: 1 })
        customer_id = c?.id
      }
      try {
        const status = wikiStatusMeta(o)
        if (!status.orderflik) status.orderflik = "nya"
        if (status.read === undefined) status.read = true
        const order = await orderModule.createOrders({
          region_id: REGION_ID,
          sales_channel_id: CHANNEL_ID,
          currency_code: (o.currency_code || "sek").toLowerCase(),
          email: o.email || undefined,
          customer_id,
          shipping_address: o.shipping_address,
          billing_address: o.billing_address,
          items,
          shipping_methods: hasShipping
            ? [{ name: o.shipping_method.name, amount: o.shipping_method.amount_excl_vat ?? 0 }]
            : [],
          metadata: {
            ...(o.metadata || {}),
            wiki_order_id: wid,
            wiki_order_time: o.created_at,
            wiki_migrated: true,
            wiki_imported: true,
            counts_in_stats: o.metadata?.counts_in_stats ?? true,
            freight_only: items.length ? undefined : true,
            ...status,
          },
        })
        await orderModule.updateOrders(order.id, { created_at: new Date(o.created_at) }).catch(() => {})
        await orderModule.updateOrders(order.id, { status: "completed" }).catch(() => {})
        created.push({ wiki_order_id: wid, id: order.id, display_id: order.display_id, freight_only: !items.length })
      } catch (e: any) { failed.push({ wiki_order_id: wid, error: e.message }) }
    }
    return res.json({ mode, received: rows.length, created: created.length, skipped_count: skipped.length, failed_count: failed.length, created_orders: created, skipped, failed })
  }

  if (mode === "orders_update") {
    const pg: any = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const patches: any[] = []
    const skipped: any[] = []
    const seen = new Set<string>()
    for (const o of rows) {
      const wid = o.wiki_order_id === undefined || o.wiki_order_id === null ? "" : String(o.wiki_order_id)
      if (!wid) { skipped.push({ wiki_order_id: null, reason: "missing wiki_order_id" }); continue }
      if (seen.has(wid)) { skipped.push({ wiki_order_id: wid, reason: "duplicate in batch" }); continue }
      seen.add(wid)
      const patch = wikiStatusMeta(o, { keepEmptyComment: body.clear_empty_comments === true })
      if (!Object.keys(patch).length) { skipped.push({ wiki_order_id: wid, reason: "no status fields" }); continue }
      patches.push({ wid, patch })
    }
    let updatedIds: string[] = []
    if (patches.length) {
      const r = await pg.raw(
        `UPDATE "order" o SET metadata = COALESCE(o.metadata, '{}'::jsonb) || v.patch, updated_at = now()
         FROM (SELECT x->>'wid' AS wid, x->'patch' AS patch FROM jsonb_array_elements(?::jsonb) x) v
         WHERE o.deleted_at IS NULL AND o.metadata->>'wiki_order_id' = v.wid
         RETURNING o.metadata->>'wiki_order_id' AS wid`,
        [JSON.stringify(patches)]
      )
      updatedIds = (r.rows || []).map((x: any) => x.wid)
    }
    const upd = new Set(updatedIds)
    for (const p of patches) if (!upd.has(p.wid)) skipped.push({ wiki_order_id: p.wid, reason: "not found" })
    return res.json({ mode, received: rows.length, updated: updatedIds.length, skipped_count: skipped.length, skipped })
  }

  return res.status(400).json({ error: "Okänt läge." })
}
