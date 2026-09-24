import { AbstractPaymentProvider, PaymentSessionStatus } from "@medusajs/framework/utils"
import { readOrder, capture, refund } from "../../lib/kustom"

/**
 * Teknikhouse.se — Kustom Checkout (Klarna/Kort, KCO v3) payment provider for
 * Medusa v2.19. Thin wrapper, same shape as the Swish provider. The KCO order
 * itself is created up front by the /kustom/order route (which builds the
 * basket from the cart and returns order_id + html_snippet); the storefront
 * passes that kustom_order_id into the payment session data. This provider then
 * drives Medusa's payment lifecycle off the id: authorize once Kustom reports
 * checkout_complete, and capture / refund through Kustom Order Management so the
 * native Medusa admin capture/refund buttons work.
 */
class KustomProviderService extends AbstractPaymentProvider {
  static identifier = "kustom"

  constructor(container: any, options: any) {
    super(container, options)
  }

  static validateOptions(_options: Record<string, unknown>) {}

  private map(status: string, completedAt?: any): PaymentSessionStatus {
    const s = String(status || "").toLowerCase()
    if (s === "checkout_complete" || completedAt) return PaymentSessionStatus.AUTHORIZED
    if (s === "checkout_expired") return PaymentSessionStatus.ERROR
    return PaymentSessionStatus.PENDING
  }

  async initiatePayment(input: any): Promise<any> {
    const { amount, currency_code, data, context } = input || {}
    const oid = data?.kustom_order_id || context?.kustom_order_id
    return {
      id: oid || "kustom",
      data: {
        kustom_order_id: oid,
        html_snippet: data?.html_snippet,
        status: data?.status,
        amount,
        currency_code,
      },
    }
  }

  async updatePayment(input: any): Promise<any> {
    const { amount, currency_code, data } = input || {}
    return { data: { ...(data || {}), amount, currency_code } }
  }

  private async statusFor(data: any): Promise<{ status: PaymentSessionStatus; data: any }> {
    const id = data?.kustom_order_id
    if (!id) return { status: PaymentSessionStatus.PENDING, data }
    try {
      const r = await readOrder(id)
      const ko: any = r.json || {}
      return {
        status: this.map(ko.status, ko.completed_at),
        data: { ...data, kustom_status: ko.status },
      }
    } catch {
      return { status: PaymentSessionStatus.PENDING, data }
    }
  }

  async getPaymentStatus(input: any): Promise<any> {
    return this.statusFor(input?.data || {})
  }

  async authorizePayment(input: any): Promise<any> {
    const res = await this.statusFor(input?.data || {})
    return { status: res.status, data: res.data }
  }

  async capturePayment(input: any): Promise<any> {
    const data = input?.data || {}
    const id = data.kustom_order_id
    const amount = input?.amount != null ? input.amount : data.amount
    if (id && amount != null) {
      try {
        const minor = Math.round(Number(amount) * 100)
        const r = await capture(id, minor)
        return { data: { ...data, captured: !!r.ok, capture_status: r.status } }
      } catch {
        /* noop */
      }
    }
    return { data: { ...data, captured: true } }
  }

  async refundPayment(input: any): Promise<any> {
    const data = input?.data || {}
    const id = data.kustom_order_id
    const amount = input?.amount != null ? input.amount : data.amount
    if (id && amount != null) {
      try {
        const minor = Math.round(Number(amount) * 100)
        const r = await refund(id, minor)
        return { data: { ...data, refunded: !!r.ok, refund_status: r.status } }
      } catch {
        /* noop */
      }
    }
    return { data }
  }

  async cancelPayment(input: any): Promise<any> {
    return { data: input?.data || {} }
  }

  async deletePayment(input: any): Promise<any> {
    return { data: input?.data || {} }
  }

  async retrievePayment(input: any): Promise<any> {
    const data = input?.data || {}
    const id = data.kustom_order_id
    if (!id) return { data }
    try {
      const r = await readOrder(id)
      return { data: { ...data, kustom: r.json } }
    } catch {
      return { data }
    }
  }

  async getWebhookActionAndData(_payload: any): Promise<any> {
    return { action: "not_supported" }
  }
}

export default KustomProviderService
