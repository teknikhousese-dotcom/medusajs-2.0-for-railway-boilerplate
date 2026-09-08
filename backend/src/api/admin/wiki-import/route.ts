import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// Wiki -> Medusa bulk import (customers + native orders).
// Fed in batches by an operator: POST { mode, rows }. Idempotent & resumable.
// customers: skip existing email. orders: skip existing metadata.wiki_order_id.

let REGION_ID: string | null = null
let CHANNEL_ID: string | null = null

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
    if (!REGION_ID || !CHANNEL_ID) return res.status(400).json({ error: "region/channel not found" })

    const ids = rows.map((o) => o.wiki_order_id).filter(Boolean)
    const dups = ids.length
      ? await orderModule.listOrders({ metadata: { wiki_order_id: ids } }, { select: ["id"], take: ids.length }).catch(() => [])
      : []
    const dupCount = dups.length
    let created = 0, failed = 0
    const errors: string[] = []
    for (const o of rows) {
      if (dupCount) {
        const ex = await orderModule.listOrders({ metadata: { wiki_order_id: o.wiki_order_id } }, { select: ["id"], take: 1 }).catch(() => [])
        if (ex.length) continue
      }
      const items = (o.items || []).map((it: any) => ({
        title: it.title || it.sku || "Vara",
        quantity: it.quantity || 1,
        unit_price: it.unit_price_excl_vat ?? 0,
        metadata: { sku: it.sku, vat_rate: it.vat_rate },
      }))
      if (!items.length) continue
      let customer_id: string | undefined
      if (o.email) {
        const [c] = await customerModule.listCustomers({ email: o.email }, { select: ["id"], take: 1 })
        customer_id = c?.id
      }
      try {
        const order = await orderModule.createOrders({
          region_id: REGION_ID,
          sales_channel_id: CHANNEL_ID,
          currency_code: (o.currency_code || "sek").toLowerCase(),
          email: o.email || undefined,
          customer_id,
          shipping_address: o.shipping_address,
          billing_address: o.billing_address,
          items,
          shipping_methods: o.shipping_method?.name
            ? [{ name: o.shipping_method.name, amount: o.shipping_method.amount_excl_vat ?? 0 }]
            : [],
          metadata: { ...o.metadata, wiki_order_id: o.wiki_order_id, wiki_order_time: o.created_at, wiki_migrated: true, counts_in_stats: true },
        })
        await orderModule.updateOrders(order.id, { created_at: new Date(o.created_at) }).catch(() => {})
        await orderModule.updateOrders(order.id, { status: "completed" }).catch(() => {})
        created++
      } catch (e: any) { failed++; if (errors.length < 5) errors.push(String(o.wiki_order_id) + ": " + e.message) }
    }
    return res.json({ mode, received: rows.length, created, failed, errors })
  }

  return res.status(400).json({ error: "unknown mode" })
}
