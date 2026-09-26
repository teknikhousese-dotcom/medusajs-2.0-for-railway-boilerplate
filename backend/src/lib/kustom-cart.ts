import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  completeCartWorkflow,
  createPaymentSessionsWorkflow,
  updateCartWorkflow,
} from "@medusajs/medusa/core-flows"
import { readOrder } from "./kustom"

/*
 * Klarna-first checkout (Kustom Checkout, KCO v3).
 *
 * With Klarna the shopper never fills in our address form: Kustom collects
 * email, phone, shipping and billing address inside its iframe. Once the KCO
 * order is checkout_complete we copy those details onto the Medusa cart here,
 * server-side, before the cart is completed, so the Medusa order carries the
 * customer's email, addresses and phone exactly like a Swish order does.
 *
 * Safety:
 *  - the Kustom order must be checkout_complete and its merchant_reference1
 *    must be this cart id (set by /kustom/order), otherwise nothing happens;
 *  - if the cart already has an order, nothing is changed (idempotent);
 *  - completion goes through Medusa's completeCartWorkflow, which locks on the
 *    cart id and returns the existing order when the cart was already
 *    completed, so the order is created exactly once.
 */

export type KustomAddress = {
  first_name: string
  last_name: string
  company: string
  address_1: string
  address_2: string
  postal_code: string
  city: string
  country_code: string
  phone: string
}

const s = (v: any) => (v == null ? "" : String(v)).trim()

export function mapKustomAddress(a: any): KustomAddress | null {
  if (!a || typeof a !== "object") return null
  const out: KustomAddress = {
    first_name: s(a.given_name),
    last_name: s(a.family_name),
    company: s(a.organization_name),
    address_1: s(a.street_address),
    address_2: s(a.street_address2),
    postal_code: s(a.postal_code),
    city: s(a.city),
    country_code: (s(a.country) || "se").toLowerCase(),
    phone: s(a.phone),
  }
  if (!out.address_1 && !out.first_name && !out.last_name) return null
  return out
}

export function customerFromKustomOrder(ko: any): {
  email: string
  shipping_address: KustomAddress | null
  billing_address: KustomAddress | null
} {
  const billing = mapKustomAddress(ko?.billing_address)
  const shipping = mapKustomAddress(ko?.shipping_address) || billing
  const email =
    s(ko?.shipping_address?.email) || s(ko?.billing_address?.email) || ""
  return {
    email,
    shipping_address: shipping,
    billing_address: billing || shipping,
  }
}

export type ApplyResult = {
  ok: boolean
  reason?: string
  order_id?: string | null
  already_completed?: boolean
  updated?: boolean
}

async function findOrderIdForCart(query: any, cartId: string): Promise<string | null> {
  try {
    const { data } = await query.graph({
      entity: "order_cart",
      fields: ["order_id", "cart_id"],
      filters: { cart_id: cartId },
    })
    return (data && data[0] && data[0].order_id) || null
  } catch {
    return null
  }
}

export async function applyKustomOrderToCart(
  scope: any,
  cartId: string,
  kustomOrderId: string,
  opts: { complete?: boolean } = {}
): Promise<ApplyResult> {
  if (!cartId || !kustomOrderId || !/^[A-Za-z0-9-]+$/.test(kustomOrderId)) {
    return { ok: false, reason: "bad_input" }
  }
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const existing = await findOrderIdForCart(query, cartId)
  if (existing) {
    return { ok: true, order_id: existing, already_completed: true }
  }

  const r = await readOrder(kustomOrderId)
  const ko: any = r.json || {}
  if (!r.ok) return { ok: false, reason: "kustom_read_" + r.status }
  if (s(ko.merchant_reference1) !== cartId) {
    return { ok: false, reason: "cart_mismatch" }
  }
  const st = s(ko.status).toLowerCase()
  if (st !== "checkout_complete" && !ko.completed_at) {
    return { ok: false, reason: "not_complete" }
  }

  const { data: carts } = await query.graph({
    entity: "cart",
    filters: { id: cartId },
    fields: [
      "id",
      "email",
      "completed_at",
      "total",
      "shipping_address.address_1",
      "payment_collection.id",
      "payment_collection.payment_sessions.id",
      "payment_collection.payment_sessions.provider_id",
      "payment_collection.payment_sessions.data",
    ],
  })
  const cart: any = carts?.[0]
  if (!cart) return { ok: false, reason: "cart_not_found" }
  if (cart.completed_at) {
    const oid = await findOrderIdForCart(query, cartId)
    return { ok: true, order_id: oid, already_completed: true }
  }

  const c = customerFromKustomOrder(ko)
  const upd: any = { id: cartId }
  if (c.email) upd.email = c.email
  if (c.shipping_address) upd.shipping_address = c.shipping_address
  if (c.billing_address) upd.billing_address = c.billing_address

  let updated = false
  if (Object.keys(upd).length > 1) {
    await updateCartWorkflow(scope).run({ input: upd })
    updated = true
  }

  /*
   * Medusa drops the payment sessions if an update changes the cart total.
   * Prices are VAT-inclusive and the country stays Sweden, so the total should
   * not move, but make sure the Kustom session (carrying kustom_order_id) is
   * still there, otherwise completion could not authorize the payment.
   */
  const { data: after } = await query.graph({
    entity: "cart",
    filters: { id: cartId },
    fields: [
      "id",
      "total",
      "payment_collection.id",
      "payment_collection.payment_sessions.id",
      "payment_collection.payment_sessions.provider_id",
      "payment_collection.payment_sessions.data",
    ],
  })
  const pc: any = after?.[0]?.payment_collection
  const sessions: any[] = pc?.payment_sessions || []
  const hasSession = sessions.some(
    (ps: any) =>
      s(ps?.provider_id) === "pp_kustom_kustom" &&
      s(ps?.data?.kustom_order_id) === kustomOrderId
  )
  if (pc?.id && !hasSession) {
    await createPaymentSessionsWorkflow(scope).run({
      input: {
        payment_collection_id: pc.id,
        provider_id: "pp_kustom_kustom",
        data: { kustom_order_id: kustomOrderId },
      } as any,
    })
    console.log("[kustom] payment session re-created", cartId, kustomOrderId)
  }

  try {
    const total = Math.round(Number(after?.[0]?.total ?? cart.total ?? 0) * 100)
    if (ko.order_amount != null && total && Number(ko.order_amount) !== total) {
      console.warn("[kustom] amount differs", cartId, kustomOrderId, ko.order_amount, total)
    }
  } catch {
    /* ignore */
  }

  if (!opts.complete) return { ok: true, updated }

  const { result } = await completeCartWorkflow(scope).run({
    input: { id: cartId },
  })
  const orderId = (result as any)?.id || (await findOrderIdForCart(query, cartId))
  console.log("[kustom] cart completed server-side", cartId, kustomOrderId, orderId)
  return { ok: true, updated, order_id: orderId }
}
