import { AbstractPaymentProvider, PaymentSessionStatus } from "@medusajs/framework/utils"
import { createPaymentRequest, getStatus, cancel, refund } from "../../lib/swish"

/**
 * Teknikhouse.se — Swish Handel provider for Medusa v2.19.
 * Thin wrapper over src/lib/swish (the mTLS Commerce API client). initiatePayment
 * creates the Swish payment request and returns the token so the storefront can
 * render QR / deep-link; the storefront polls until the payer approves. Swish
 * captures on payment, so capturePayment is a no-op success.
 */
class SwishProviderService extends AbstractPaymentProvider {
  static identifier = "swish"

  constructor(container: any, options: any) {
    super(container, options)
  }

  static validateOptions(_options: Record<string, unknown>) {}

  private map(s: string): PaymentSessionStatus {
    const up = String(s || "").toUpperCase()
    if (up === "PAID") return PaymentSessionStatus.AUTHORIZED
    if (up === "DECLINED" || up === "ERROR") return PaymentSessionStatus.ERROR
    if (up === "CANCELLED" || up === "CANCELED") return PaymentSessionStatus.CANCELED
    return PaymentSessionStatus.PENDING
  }

  async initiatePayment(input: any): Promise<any> {
    const { amount, currency_code, data, context } = input || {}
    const r = await createPaymentRequest({
      amount,
      currency: currency_code,
      reference: data?.reference || context?.idempotency_key,
      message: data?.message,
    })
    if (r.ok) {
      return {
        id: r.id,
        data: {
          swishId: r.id, token: r.token, location: r.location, reference: r.reference,
          deepLink: r.token ? "swish://paymentrequest?token=" + r.token + "&callbackurl=" : "",
          amount, currency_code,
        },
      }
    }
    return { id: r.id, data: { swishId: r.id, error: true, status: (r as any).status, message: (r as any).error } }
  }

  async updatePayment(input: any): Promise<any> {
    const { amount, currency_code, data } = input || {}
    return { data: { ...(data || {}), amount, currency_code } }
  }

  async getPaymentStatus(input: any): Promise<any> {
    const data = input?.data || {}
    if (!data.swishId && !data.location) return { status: PaymentSessionStatus.PENDING, data }
    const s = await getStatus(data.location || data.swishId)
    return { status: this.map(s.status), data: { ...data, swishStatus: s.status, paymentReference: s.paymentReference || data.paymentReference } }
  }

  async authorizePayment(input: any): Promise<any> {
    const res = await this.getPaymentStatus(input)
    return { status: res.status, data: res.data }
  }

  async capturePayment(input: any): Promise<any> {
    const data = input?.data || {}
    return { data: { ...data, captured: true } }
  }

  async refundPayment(input: any): Promise<any> {
    const data = input?.data || {}
    if (!data.paymentReference) return { data }
    const r = await refund({ originalPaymentReference: data.paymentReference, amount: input?.amount != null ? input.amount : data.amount, currency: data.currency_code })
    return { data: { ...data, refundId: r.id, refunded: r.ok } }
  }

  async cancelPayment(input: any): Promise<any> {
    const data = input?.data || {}
    if (data.swishId) { try { await cancel(data.swishId) } catch { /* noop */ } }
    return { data }
  }

  async deletePayment(input: any): Promise<any> {
    return this.cancelPayment(input)
  }

  async retrievePayment(input: any): Promise<any> {
    const data = input?.data || {}
    if (!data.swishId && !data.location) return { data }
    const s = await getStatus(data.location || data.swishId)
    return { data: { ...data, swish: s.raw } }
  }

  async getWebhookActionAndData(_payload: any): Promise<any> {
    return { action: "not_supported" }
  }
}

export default SwishProviderService
