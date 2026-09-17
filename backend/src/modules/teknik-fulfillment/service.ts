import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"

/**
 * Teknik calculated fulfillment provider.
 * Standard shipping costs BASE kr and becomes free once the cart subtotal
 * reaches the threshold (1000 kr for consumers, 2000 kr for B2B).
 * Return types on overridden methods are annotated as Promise<any> on purpose:
 * bare any is assignable to the base signatures (including never[]), which
 * avoids the TS2416 override-compatibility errors that any[] triggers.
 */
const BASE = 29
const THRESHOLD = 1000
const B2B_THRESHOLD = 2000

class TeknikFulfillmentService extends AbstractFulfillmentProviderService {
  static identifier = "teknik"

  async getFulfillmentOptions(): Promise<any> {
    return [{ id: "teknik-standard", name: "Standard" }]
  }

  async validateFulfillmentData(_optionData: any, data: any, _context: any): Promise<any> {
    return data ?? {}
  }

  async validateOption(_data: any): Promise<boolean> {
    return true
  }

  async canCalculate(_data: any): Promise<boolean> {
    return true
  }

  async calculatePrice(_optionData: any, _data: any, context: any): Promise<any> {
    const subtotal = this.subtotalFrom(context)
    const threshold = this.isB2B(context) ? B2B_THRESHOLD : THRESHOLD
    return {
      calculated_amount: subtotal >= threshold ? 0 : BASE,
      is_calculated_price_tax_inclusive: false,
    }
  }

  async createFulfillment(_data: any, _items: any, _order: any, _fulfillment: any): Promise<any> {
    return { data: {}, labels: [] }
  }

  async cancelFulfillment(_fulfillment: any): Promise<any> {
    return {}
  }

  async createReturnFulfillment(_fulfillment: any): Promise<any> {
    return { data: {}, labels: [] }
  }

  private subtotalFrom(context: any): number {
    if (!context) return 0
    const cand = [context.item_total, context.subtotal, context.total]
    for (const c of cand) {
      const n = Number(c)
      if (!isNaN(n) && n > 0) return n
    }
    const items = context.items || (context.cart && context.cart.items) || []
    let sum = 0
    for (const it of items) {
      const q = Number(it.quantity != null ? it.quantity : (it.raw_quantity && it.raw_quantity.value) || 1)
      const up = Number(it.unit_price != null ? it.unit_price : it.subtotal || 0)
      sum += up * (isNaN(q) ? 1 : q)
    }
    return sum
  }

  private isB2B(context: any): boolean {
    try {
      const groups =
        (context && context.customer && context.customer.groups) ||
        (context && context.cart && context.cart.customer && context.cart.customer.groups) ||
        []
      return groups.some((g: any) => /b2b|foretag|retail|wholesale/i.test((g && g.name) || ""))
    } catch (e) {
      return false
    }
  }
}

export default TeknikFulfillmentService
