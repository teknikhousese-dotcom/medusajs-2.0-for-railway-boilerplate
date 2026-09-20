import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Publikt (kassan anropar detta från webbläsaren) — ingen admin-auth.
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

// Sparar Klarnas authorization_token på Klarna-betalsessionen så att
// authorizePayment (som körs när kundvagnen slutförs) hittar den och skapar
// Klarna-ordern. Kassan anropar detta direkt efter Klarna.Payments.authorize().
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  cors(res)
  const body = (req.body || {}) as any
  const cart_id: string = body.cart_id
  const authorization_token: string = body.authorization_token
  if (!cart_id || !authorization_token) {
    res.status(400).json({ error: "cart_id och authorization_token krävs." })
    return
  }
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: rows } = await query.graph({
      entity: "cart",
      filters: { id: cart_id },
      fields: [
        "id",
        "payment_collection.payment_sessions.id",
        "payment_collection.payment_sessions.provider_id",
        "payment_collection.payment_sessions.amount",
        "payment_collection.payment_sessions.currency_code",
        "payment_collection.payment_sessions.data",
      ],
    })
    const sessions: any[] =
      rows?.[0]?.payment_collection?.payment_sessions || []
    const sess = sessions.find((s) => s.provider_id === "pp_klarna_klarna")
    if (!sess) {
      res.status(404).json({ error: "Ingen Klarna-betalsession hittades." })
      return
    }
    const payment = req.scope.resolve(Modules.PAYMENT)
    await payment.updatePaymentSession({
      id: sess.id,
      amount: sess.amount,
      currency_code: sess.currency_code,
      data: { ...(sess.data || {}), authorization_token },
    })
    res.json({ ok: true })
  } catch (e: any) {
    console.error("[klarna] kunde inte spara authorization_token", e)
    res.status(500).json({ error: e?.message || "Internt fel." })
  }
}
