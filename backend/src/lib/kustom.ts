// Kustom Checkout (KCO v3) API-klient — motsvarar det som körs på
// teknikhouse.se idag (Klarna/Kustom-fliken). HTTP Basic Auth med
// användarnamn + lösenord som genereras i Kustom-portalen (Developers > API).
//
// Miljövariabler (sätts i Railway):
//   KUSTOM_API_BASE       t.ex. https://api.kustom.co  (playground: https://api.playground.kustom.co)
//   KUSTOM_USERNAME       API-användarnamn från Kustom-portalen
//   KUSTOM_PASSWORD       API-lösenord från Kustom-portalen
//   KUSTOM_STOREFRONT_URL t.ex. https://teknikhouse.se  (för terms/checkout/confirmation-URL:er)
//   KUSTOM_BACKEND_URL    t.ex. https://backend-...railway.app (för push-URL)

const env = (k: string, d = "") => (process.env[k] || d).trim()

export function kustomBase(): string {
  return env("KUSTOM_API_BASE", "https://api.kustom.co").replace(/\/+$/, "")
}

function authHeader(): string {
  const u = env("KUSTOM_USERNAME")
  const p = env("KUSTOM_PASSWORD")
  return "Basic " + Buffer.from(`${u}:${p}`).toString("base64")
}

async function call(method: string, path: string, body?: any) {
  const url = kustomBase() + path
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
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

export type KustomOrderLine = {
  type: string
  reference?: string
  name: string
  quantity: number
  quantity_unit?: string
  unit_price: number
  tax_rate: number
  total_amount: number
  total_discount_amount?: number
  total_tax_amount: number
}

export type CreateOrderInput = {
  purchase_country?: string
  purchase_currency?: string
  locale?: string
  order_amount: number
  order_tax_amount: number
  order_lines: KustomOrderLine[]
  merchant_reference1?: string
  merchant_urls?: Record<string, string>
}

export function merchantUrls(cartId: string) {
  const store = env("KUSTOM_STOREFRONT_URL", "https://teknikhouse.se").replace(
    /\/+$/,
    ""
  )
  const back = env(
    "KUSTOM_BACKEND_URL",
    env("SWISH_CALLBACK_BASE", "")
  ).replace(/\/+$/, "")
  return {
    terms: `${store}/kopvillkor`,
    checkout: `${store}/kassa?kustom_order_id={checkout.order.id}`,
    confirmation: `${store}/kassa-klar?kustom_order_id={checkout.order.id}`,
    push: `${back}/kustom/push?kustom_order_id={checkout.order.id}&cart_id=${encodeURIComponent(
      cartId
    )}`,
  }
}

// POST /checkout/v3/orders  -> { order_id, html_snippet, status, ... }
export async function createOrder(input: CreateOrderInput) {
  const body = {
    purchase_country: input.purchase_country || "SE",
    purchase_currency: input.purchase_currency || "SEK",
    locale: input.locale || "sv-SE",
    order_amount: input.order_amount,
    order_tax_amount: input.order_tax_amount,
    order_lines: input.order_lines,
    merchant_reference1: input.merchant_reference1,
    merchant_urls: input.merchant_urls,
  }
  const r = await call("POST", "/checkout/v3/orders", body)
  return r
}

// GET /checkout/v3/orders/{id}  -> full order incl. html_snippet (confirmation)
export async function readOrder(orderId: string) {
  return call("GET", `/checkout/v3/orders/${orderId}`)
}

// Order Management: capture / refund via /ordermanagement/v1/orders/{id}
export async function capture(orderId: string, amount: number) {
  return call(
    "POST",
    `/ordermanagement/v1/orders/${orderId}/captures`,
    { captured_amount: amount }
  )
}

export async function refund(orderId: string, amount: number) {
  return call(
    "POST",
    `/ordermanagement/v1/orders/${orderId}/refunds`,
    { refunded_amount: amount }
  )
}

// Hjälpare: bygg order_lines + totaler från en Medusa-kundvagn.
// Svensk moms 25% inkl. i priset => moms = 20% av bruttobeloppet.
export async function getManagement(orderId: string) {
  return call("GET", `/ordermanagement/v1/orders/${orderId}`)
}

export async function cancel(orderId: string) {
  return call("POST", `/ordermanagement/v1/orders/${orderId}/cancel`)
}

export async function extendAuth(orderId: string) {
  return call("POST", `/ordermanagement/v1/orders/${orderId}/extend-authorization-time`)
}

export function buildLinesFromCart(cart: any): {
  order_amount: number
  order_tax_amount: number
  order_lines: KustomOrderLine[]
} {
  const round = (n: number) => Math.round(n)
  const lines: KustomOrderLine[] = []
  let orderAmount = 0
  let orderTax = 0

  for (const it of cart?.items || []) {
    const qty = it.quantity || 1
    const unit = round((it.unit_price || 0) * 100) // minor units, inkl moms
    const total = unit * qty
    const tax = round(total * 0.2)
    orderAmount += total
    orderTax += tax
    lines.push({
      type: "physical",
      reference: it.variant_sku || it.product_id || undefined,
      name: it.product_title || it.title || "Produkt",
      quantity: qty,
      quantity_unit: "pcs",
      unit_price: unit,
      tax_rate: 2500,
      total_amount: total,
      total_discount_amount: 0,
      total_tax_amount: tax,
    })
  }

  // Frakt som egen rad om den finns.
  const ship = cart?.shipping_methods?.[0]
  if (ship && (ship.amount || 0) > 0) {
    const total = round((ship.amount || 0) * 100)
    const tax = round(total * 0.2)
    orderAmount += total
    orderTax += tax
    lines.push({
      type: "shipping_fee",
      name: ship.name || "Frakt",
      quantity: 1,
      quantity_unit: "pcs",
      unit_price: total,
      tax_rate: 2500,
      total_amount: total,
      total_discount_amount: 0,
      total_tax_amount: tax,
    })
  }

  return { order_amount: orderAmount, order_tax_amount: orderTax, order_lines: lines }
}
