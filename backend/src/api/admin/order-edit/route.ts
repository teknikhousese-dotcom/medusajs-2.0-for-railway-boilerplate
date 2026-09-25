import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

const r2 = (n: number) => Math.round(n * 100) / 100

function addrOut(a: any) {
  if (!a) return {}
  const m = a.metadata || {}
  return {
    company: a.company || "",
    org_nr: m.org_nr || "",
    first_name: a.first_name || "",
    last_name: a.last_name || "",
    address_1: a.address_1 || "",
    address_2: a.address_2 || "",
    address_3: m.address_3 || "",
    postal_code: a.postal_code || "",
    city: a.city || "",
    province: a.province || "",
    country_code: (a.country_code || "se").toUpperCase(),
  }
}

function addrIn(a: any, phone: string) {
  a = a || {}
  return {
    company: a.company || null,
    first_name: a.first_name || null,
    last_name: a.last_name || null,
    address_1: a.address_1 || null,
    address_2: a.address_2 || null,
    postal_code: a.postal_code || null,
    city: a.city || null,
    province: a.province || null,
    country_code: (a.country_code || "se").toLowerCase(),
    phone: phone || null,
    metadata: { org_nr: a.org_nr || null, address_3: a.address_3 || null },
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const order_id = String((req.query as any).order_id || "")
  if (!order_id) return res.status(400).json({ ok: false, message: "order_id kravs." })
  try {
    const om: any = req.scope.resolve(Modules.ORDER)
    const o: any = await om.retrieveOrder(order_id, { relations: ["items", "billing_address", "shipping_address", "shipping_methods"] })
    const m = o.metadata || {}
    const editLines = Array.isArray(m.edit_lines) ? m.edit_lines : null
    const lines = editLines || (o.items || []).map((it: any) => {
      const moms = Number(it.metadata?.vat_rate) || 25
      const net = Number(it.unit_price) || 0
      return { artnr: it.metadata?.sku || "", namn: it.title || "", attribut: it.subtitle || "", typ: "vara", moms, pris_inkl: r2(net * (1 + moms / 100)), antal: Number(it.quantity) || 0, krediterad: 0 }
    })
    const shipName = (o.shipping_methods || [])[0]?.name || m.fraktmetod || "Standard"
    const captured = m.kustom_captured === true || ["captured", "partially_captured", "paid"].includes(o.payment_status)
    return res.json({
      ok: true,
      email: o.email || "",
      telefon: o.billing_address?.phone || "",
      mobil: m.cell_phone || "",
      weight: m.order_weight_g || 0,
      fraktmetod: shipName,
      captured,
      billing: addrOut(o.billing_address),
      shipping: addrOut(o.shipping_address),
      lines,
    })
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: "Kunde inte lasa ordern." })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b: any = req.body || {}
  const order_id = String(b.order_id || "")
  if (!order_id) return res.status(400).json({ ok: false, message: "order_id kravs." })
  try {
    const om: any = req.scope.resolve(Modules.ORDER)
    const o: any = await om.retrieveOrder(order_id, { select: ["id", "metadata"] })
    const lines = (Array.isArray(b.lines) ? b.lines : []).filter((l: any) => Number(l.antal) > 0)
    let inkl = 0, moms = 0
    lines.forEach((l: any) => {
      const q = Number(l.antal) || 0
      const p = Number(l.pris_inkl) || 0
      const rate = Number(l.moms) || 25
      const rowInkl = p * q
      inkl += rowInkl
      moms += rowInkl - rowInkl / (1 + rate / 100)
    })
    const meta = Object.assign({}, o.metadata || {}, {
      cell_phone: b.mobil || o.metadata?.cell_phone || null,
      order_weight_g: Number(b.weight) || 0,
      fraktmetod: b.fraktmetod || "Standard",
      internal_comment: b.kommentar != null ? b.kommentar : o.metadata?.internal_comment,
      edit_lines: lines,
      edit_totals: { inkl: r2(inkl), moms: r2(moms), exkl: r2(inkl - moms) },
      edited_at: new Date().toISOString(),
    })
    const upd: any = { id: order_id, metadata: meta }
    if (b.epost) upd.email = String(b.epost)
    await om.updateOrders([upd])
    let addrSaved = true
    try {
      await om.updateOrders([{ id: order_id, billing_address: addrIn(b.billing, b.telefon), shipping_address: addrIn(b.shipping, b.telefon) }])
    } catch (e) { addrSaved = false }
    return res.json({ ok: true, addrSaved })
  } catch (e: any) {
    return res.status(502).json({ ok: false, message: "Kunde inte spara andringarna." })
  }
}
