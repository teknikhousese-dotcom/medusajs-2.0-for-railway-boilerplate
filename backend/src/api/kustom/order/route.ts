import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createOrder,
  buildLinesFromCart,
  merchantUrls,
  kustomBase,
} from "../../../lib/kustom"

/*
 * KCO v3 "options": the Klarna/Kustom iframe styled like teknikhouse.se
 * (brand red #F50000, dark text, rounded corners) and B2B enabled so the
 * shopper can pick Privat or Foretag inside Klarna.
 */
const BRAND_OPTIONS: Record<string, any> = {
  color_button: "#F50000",
  color_button_text: "#FFFFFF",
  color_checkbox: "#F50000",
  color_checkbox_checkmark: "#FFFFFF",
  color_header: "#14161C",
  color_link: "#F50000",
  radius_border: "12px",
}

const B2B_OPTIONS: Record<string, any> = {
  allowed_customer_types: ["person", "organization"],
}

async function postKcoOrder(body: Record<string, any>) {
  const u = (process.env.KUSTOM_USERNAME || "").trim()
  const p = (process.env.KUSTOM_PASSWORD || "").trim()
  const res = await fetch(kustomBase() + "/checkout/v3/orders", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(u + ":" + p).toString("base64"),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json: any = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return { status: res.status, ok: res.ok, json, text }
}

// Publikt: kassan anropar detta för att skapa en Kustom Checkout-order och
// få tillbaka html_snippet (iframe) för "Klarna/Kort"-fliken.
export const AUTHENTICATE = false

function cors(res: MedusaResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
}

export async function OPTIONS(_req: MedusaRequest, res: MedusaResponse) {
  cors(res)
  res.status(200).end()
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  cors(res)
  const body = (req.body || {}) as any
  const cart_id: string = body.cart_id
  if (!cart_id) {
    res.status(400).json({ error: "cart_id krävs." })
    return
  }
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: rows } = await query.graph({
      entity: "cart",
      filters: { id: cart_id },
      fields: [
        "id",
        "currency_code",
        "email",
        "items.quantity",
        "items.unit_price",
        "items.product_title",
        "items.title",
        "items.variant_sku",
        "items.product_id",
        "shipping_methods.amount",
        "shipping_methods.name",
      ],
    })
    const cart: any = rows?.[0]
    if (!cart) {
      res.status(404).json({ error: "Kundvagn hittades inte." })
      return
    }

    const { order_amount, order_tax_amount, order_lines } =
      buildLinesFromCart(cart)

    if (!order_lines.length || order_amount <= 0) {
      res.status(400).json({ error: "Tom kundvagn." })
      return
    }

    const base = {
      purchase_country: "SE",
      purchase_currency: (cart.currency_code || "SEK").toUpperCase(),
      locale: "sv-SE",
      order_amount,
      order_tax_amount,
      order_lines,
      merchant_reference1: cart_id,
      merchant_urls: merchantUrls(cart_id),
    }

    /*
     * Try brand colours + B2B first. If Kustom rejects the options (for
     * example B2B not enabled on the merchant account) fall back step by
     * step, so order creation never breaks because of styling.
     */
    let r: any = await postKcoOrder({
      ...base,
      options: { ...BRAND_OPTIONS, ...B2B_OPTIONS },
      customer: { type: "person" },
    }).catch((e: any) => ({ ok: false, status: 0, json: null, text: String(e?.message || e) }))
    if (!r.ok || !r.json) {
      console.warn("[kustom] order with b2b options fail", r.status, String(r.text || "").slice(0, 300))
      r = await postKcoOrder({ ...base, options: { ...BRAND_OPTIONS } }).catch(
        (e: any) => ({ ok: false, status: 0, json: null, text: String(e?.message || e) })
      )
    }
    if (!r.ok || !r.json) {
      console.warn("[kustom] order with colour options fail", r.status, String(r.text || "").slice(0, 300))
      r = await createOrder(base)
    }

    if (!r.ok || !r.json) {
      console.error("[kustom] create order fail", r.status, r.text?.slice(0, 300))
      res
        .status(502)
        .json({ error: "Kunde inte starta Kustom Checkout.", status: r.status })
      return
    }

    res.json({
      order_id: r.json.order_id,
      status: r.json.status,
      html_snippet: r.json.html_snippet,
    })
  } catch (e: any) {
    console.error("[kustom] order route error", e)
    res.status(500).json({ error: e?.message || "Internt fel." })
  }
}
