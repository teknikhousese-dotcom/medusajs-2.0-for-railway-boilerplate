import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"

/**
 * Teknikhouse.se — calculated fulfillment provider.
 * Drives the "Standard" shipping option: free (0 kr) when the cart subtotal
 * reaches the free-shipping threshold (1000 kr, or 2000 kr for B2B/avtalskunder),
 * otherwise the normal 29 kr. Safe default: if the subtotal can't be read from
 * context, it charges the base price (never wrongly free).
 */
const BASE = 29
const THRESHOLD = 1000
const B2B_THRESHOLD = 2000

class TeknikFulfillmentService extends AbstractFulfillmentProviderService {
  static identifier = "teknik"

  async getFulfillmentOptions(): Promise<any[]> {
    return [{ id: "teknik-standard", name: "Standard" }]
  }

  async validateFulfillmentData(_optionData: any, data: any, _context: any): Promise<any> {
    return data || {}
  }

  async validateOption(_data: any): Promise<boolean> {
    return true
  }

  async canCalculate(_data: any): Promise<boolean> {
    return true
  }

  private subtotalFrom(context: any): number {
    if (!context) return 0
    const direct = context.item_total ?? context.subtotal ?? context.item_subtotal
    if (direct != null && !isNaN(Number(direct))) return Number(direct)
    const items = context.items || (context.cart && context.cart.items) || []
    let sum = 0
    for (const it of items) {
      if (it.subtotal != null) { sum += Number(it.subtotal); continue }
      const price = Number(it.unit_price ?? 0)
      const qty = Number(it.quantity ?? 1)
      sum += price * qty
    }
    return sum
  }

  private isB2B(context: any): boolean {
    const groups =
      (context && context.customer && (context.customer.groups || context.customer.customer_groups)) || []
    return (groups || []).some((g: any) => /avtal|b2b|foretag|företag|retail|wholesale/i.test((g && g.name) || ""))
  }

  async calculatePrice(_optionData: any, _data: any, context: any): Promise<any> {
    const threshold = this.isB2B(context) ? B2B_THRESHOLD : THRESHOLD
    const subtotal = this.subtotalFrom(context)
    const amount = subtotal >= threshold ? 0 : BASE
    return { calculated_amount: amount, is_calculated_price_tax_inclusive: false }
  }

  async createFulfillment(_data: any, _items: any, _order: any, _fulfillment: any): Promise<any> {
    return { data: {}, labels: [] }
  }

  async cancelFulfillment(_data: any): Promise<any> {
    return {}
  }

  async createReturnFulfillment(_data: any): Promise<any> {
    return { data: {}, labels: [] }
  }

  async getFulfillmentDocuments(_data: any): Promise<any[]> {
    return []
  }

  async getReturnDocuments(_data: any): Promise<any[]> {
    return []
  }

  async getShipmentDocuments(_data: any): Promise<any[]> {
    return []
  }
}

export default TeknikFulfillmentService
