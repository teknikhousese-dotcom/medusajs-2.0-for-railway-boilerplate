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
    // One-shot debug snapshot (safe, JSON-serialisable) read back via setup-freeshipping {action:"debug"}.
    try {
      const it0 = context && context.items && context.items[0]
      const ctx0 = context && context.cart && context.cart.items && context.cart.items[0]
      ;(globalThis as any).__teknikCtx = {
        keys: context ? Object.keys(context) : [],
        item_total: context && context.item_total,
        subtotal: context && context.subtotal,
        total: context && context.total,
        cart_item_total: context && context.cart && context.cart.item_total,
        cart_subtotal: context && context.cart && context.cart.subtotal,
        itemsLen: (context && context.items && context.items.length) || 0,
        cartItemsLen: (context && context.cart && context.cart.items && context.cart.items.length) || 0,
        item0: it0 ? Object.keys(it0) : null,
        item0vals: it0 ? { unit_price: it0.unit_price, quantity: it0.quantity, subtotal: it0.subtotal, total: it0.total } : null,
        cartItem0vals: ctx0 ? { unit_price: ctx0.unit_price, quantity: ctx0.quantity, subtotal: ctx0.subtotal, total: ctx0.total } : null,
      }
    } catch (e) {}

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

  private num(v: any): number {
    if (v == null) return 0
    if (typeof v === "object" && v.value != null) v = v.value
    const n = Number(v)
    return isNaN(n) ? 0 : n
  }

  private subtotalFrom(context: any): number {
    if (!context) return 0
    const cart = context.cart || {}
    const direct = [
      context.item_total, context.item_subtotal, context.subtotal, context.total, context.original_total,
      cart.item_total, cart.item_subtotal, cart.subtotal, cart.total, cart.original_total,
    ]
    for (const c of direct) {
      const n = this.num(c)
      if (n > 0) return n
    }
    const items = context.items || cart.items || []
    let sum = 0
    for (const it of items) {
      const q = this.num(it.quantity != null ? it.quantity : it.raw_quantity) || 1
      const line = this.num(it.subtotal) || this.num(it.total) || this.num(it.original_total)
      if (line > 0) {
        sum += line
      } else {
        const up = this.num(it.unit_price != null ? it.unit_price : it.raw_unit_price)
        sum += up * q
      }
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
