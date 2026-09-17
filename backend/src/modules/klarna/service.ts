import { AbstractPaymentProvider, PaymentSessionStatus } from "@medusajs/framework/utils"

type Options = {
  username?: string
  password?: string
  apiBase?: string
  region?: string
  environment?: string
}

/**
 * Teknikhouse.se — Klarna Payments provider for Medusa v2 (2.19).
 * Flow: initiatePayment creates a Klarna session (client_token for the widget);
 * the storefront authorizes with the widget and stores the authorization_token via
 * updatePayment; authorizePayment then creates the Klarna order; capture/refund/
 * cancel go through Klarna Order Management. Credentials come from env (set in Railway).
 */
class KlarnaProviderService extends AbstractPaymentProvider<Options> {
  static identifier = "klarna"

  protected options_: Options

  constructor(container: any, options: Options) {
    super(container, options)
    this.options_ = options || {}
  }

  static validateOptions(_options: Record<string, unknown>) {
    // Credentials are read from env at call time; no hard failure at boot so the
    // provider can be registered before keys are set.
  }

  private base(): string {
    return (
      this.options_.apiBase ||
      process.env.KLARNA_API_BASE ||
      "https://api.playground.klarna.com"
    ).replace(/\/+$/, "")
  }

  private authHeader(): string {
    const user = this.options_.username || process.env.KLARNA_USERNAME || ""
    const pass = this.options_.password || process.env.KLARNA_PASSWORD || ""
    return "Basic " + Buffer.from(user + ":" + pass).toString("base64")
  }

  private async call(method: string, path: string, body?: any): Promise<{ status: number; json: any; text: string }> {
    const res = await fetch(this.base() + path, {
      method,
      headers: {
        Authorization: this.authHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    let json: any = null
    try { json = text ? JSON.parse(text) : null } catch { json = null }
    return { status: res.status, json, text }
  }

  private minor(amount: any): number {
    return Math.round(Number(amount) * 100)
  }

  private buildSessionBody(amount: any, currency: string, data: any): any {
    const orderAmount = this.minor(amount)
    const cur = String(currency || "sek").toUpperCase()
    const lines = Array.isArray(data?.order_lines) && data.order_lines.length
      ? data.order_lines
      : [
          {
            name: data?.summary_name || "Order",
            quantity: 1,
            unit_price: orderAmount,
            tax_rate: 0,
            total_amount: orderAmount,
            total_tax_amount: 0,
          },
        ]
    return {
      purchase_country: (data?.country || "SE").toUpperCase(),
      purchase_currency: cur,
      locale: data?.locale || "sv-SE",
      order_amount: orderAmount,
      order_tax_amount: 0,
      order_lines: lines,
    }
  }

  async initiatePayment(input: any): Promise<any> {
    const { amount, currency_code, data, context } = input || {}
    try {
      const body = this.buildSessionBody(amount, currency_code, data || {})
      const r = await this.call("POST", "/payments/v1/sessions", body)
      if (r.status >= 200 && r.status < 300 && r.json) {
        return {
          id: r.json.session_id,
          data: {
            session_id: r.json.session_id,
            client_token: r.json.client_token,
            payment_method_categories: r.json.payment_method_categories,
            amount,
            currency_code,
          },
        }
      }
      return {
        id: "klarna_error",
        data: { error: true, status: r.status, message: r.text?.slice(0, 300) },
      }
    } catch (e: any) {
      return { id: "klarna_error", data: { error: true, message: String(e?.message || e) } }
    }
  }

  async updatePayment(input: any): Promise<any> {
    const { amount, currency_code, data } = input || {}
    const sessionId = data?.session_id
    // Persist any authorization_token the storefront attached, and refresh the
    // session amount if it changed.
    if (sessionId && amount != null) {
      try {
        const body = this.buildSessionBody(amount, currency_code || data?.currency_code, data || {})
        await this.call("POST", "/payments/v1/sessions/" + sessionId, body)
      } catch { /* non-fatal */ }
    }
    return { data: { ...(data || {}), amount, currency_code } }
  }

  async authorizePayment(input: any): Promise<any> {
    const data = input?.data || {}
    const token = data.authorization_token || input?.context?.authorization_token
    if (!token) {
      return { status: PaymentSessionStatus.PENDING, data }
    }
    try {
      const orderBody = this.buildSessionBody(data.amount, data.currency_code, data)
      const r = await this.call(
        "POST",
        "/payments/v1/authorizations/" + token + "/order",
        orderBody
      )
      if (r.status >= 200 && r.status < 300 && r.json) {
        const fraud = r.json.fraud_status
        const status =
          fraud === "REJECTED"
            ? PaymentSessionStatus.CANCELED
            : fraud === "PENDING"
            ? PaymentSessionStatus.REQUIRES_MORE
            : PaymentSessionStatus.AUTHORIZED
        return {
          status,
          data: {
            ...data,
            klarna_order_id: r.json.order_id,
            fraud_status: fraud,
            redirect_url: r.json.redirect_url,
          },
        }
      }
      return { status: PaymentSessionStatus.ERROR, data: { ...data, error: r.text?.slice(0, 300) } }
    } catch (e: any) {
      return { status: PaymentSessionStatus.ERROR, data: { ...data, error: String(e?.message || e) } }
    }
  }

  async capturePayment(input: any): Promise<any> {
    const data = input?.data || {}
    const orderId = data.klarna_order_id
    if (!orderId) return { data }
    try {
      const amount = input?.amount != null ? input.amount : data.amount
      await this.call(
        "POST",
        "/ordermanagement/v1/orders/" + orderId + "/captures",
        { captured_amount: this.minor(amount) }
      )
      return { data: { ...data, captured: true } }
    } catch {
      return { data }
    }
  }

  async refundPayment(input: any): Promise<any> {
    const data = input?.data || {}
    const orderId = data.klarna_order_id
    if (!orderId) return { data }
    try {
      await this.call(
        "POST",
        "/ordermanagement/v1/orders/" + orderId + "/refunds",
        { refunded_amount: this.minor(input?.amount != null ? input.amount : data.amount) }
      )
      return { data: { ...data, refunded: true } }
    } catch {
      return { data }
    }
  }

  async cancelPayment(input: any): Promise<any> {
    const data = input?.data || {}
    const orderId = data.klarna_order_id
    if (orderId) {
      try { await this.call("POST", "/ordermanagement/v1/orders/" + orderId + "/cancel") } catch { /* noop */ }
    }
    return { data }
  }

  async deletePayment(input: any): Promise<any> {
    return this.cancelPayment(input)
  }

  async retrievePayment(input: any): Promise<any> {
    const data = input?.data || {}
    const orderId = data.klarna_order_id
    if (!orderId) return { data }
    try {
      const r = await this.call("GET", "/ordermanagement/v1/orders/" + orderId)
      return { data: { ...data, klarna: r.json } }
    } catch {
      return { data }
    }
  }

  async getPaymentStatus(input: any): Promise<any> {
    const data = input?.data || {}
    const orderId = data.klarna_order_id
    if (!orderId) {
      return { status: PaymentSessionStatus.PENDING, data }
    }
    try {
      const r = await this.call("GET", "/ordermanagement/v1/orders/" + orderId)
      const s = (r.json?.status || "").toUpperCase()
      let status = PaymentSessionStatus.AUTHORIZED
      if (s === "CAPTURED" || s === "PART_CAPTURED") status = PaymentSessionStatus.CAPTURED
      else if (s === "CANCELLED") status = PaymentSessionStatus.CANCELED
      return { status, data }
    } catch {
      return { status: PaymentSessionStatus.AUTHORIZED, data }
    }
  }

  async getWebhookActionAndData(_payload: any): Promise<any> {
    return { action: "not_supported" }
  }
}

export default KlarnaProviderService
