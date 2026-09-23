import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createOrder,
  buildLinesFromCart,
  merchantUrls,
} from "../../../lib/kustom"

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

    const r = await createOrder({
      purchase_country: "SE",
      purchase_currency: (cart.currency_code || "SEK").toUpperCase(),
      locale: "sv-SE",
      order_amount,
      order_tax_amount,
      order_lines,
      merchant_reference1: cart_id,
      merchant_urls: merchantUrls(cart_id),
    })

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
