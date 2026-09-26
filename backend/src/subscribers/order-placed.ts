import { Modules, ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'
import { SHOP_EMAIL, fromAddress, loadDbTemplate, fillTemplate, sendShopMail, htmlToText } from '../modules/email-notifications/shop-mail'
import { loadOrderForMail, orderNumber, orderPlaceholderMap, sendShopOrderNotification } from '../modules/email-notifications/order-mails'
import { updateKustomMerchantReferences } from '../lib/kustom-cart'

/* Swedish local time "YYYY-MM-DD HH:MM:SS", the same format as Wiki order times. */
function swedishTime(d: any): string {
  try {
    const opts: any = { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }
    const parts = new Intl.DateTimeFormat('sv-SE', opts).formatToParts(new Date(d))
    const g = (k: string) => parts.find((p) => p.type === k)?.value || '00'
    return g('year') + '-' + g('month') + '-' + g('day') + ' ' + g('hour') + ':' + g('minute') + ':' + g('second')
  } catch {
    return ''
  }
}

/* Payment provider and data of an order: the payment row, else the authorized
   (or any) payment session, so the stamp also works if the payment row is not
   readable yet. */
function pickOrderPayment(row: any): { provider_id: string; data: any } {
  const pcs: any[] = row?.payment_collections || []
  for (const pc of pcs) {
    for (const p of pc?.payments || []) {
      if (p?.provider_id) return { provider_id: String(p.provider_id), data: p.data || {} }
    }
  }
  let fallback: any = null
  for (const pc of pcs) {
    for (const ps of pc?.payment_sessions || []) {
      if (!ps?.provider_id) continue
      if (ps.status === 'authorized') return { provider_id: String(ps.provider_id), data: ps.data || {} }
      if (!fallback) fallback = ps
    }
  }
  return fallback ? { provider_id: String(fallback.provider_id), data: fallback.data || {} } : { provider_id: '', data: {} }
}

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION)
  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
  
  const order = await orderModuleService.retrieveOrder(data.id, { relations: ['items', 'summary', 'shipping_address'] })

  // Digital orders have no shipping address at all. This used to read
  // `order.shipping_address.id` unguarded and outside the try block, so such an
  // order threw here and the confirmation email was never sent.
  let shippingAddress = order.shipping_address ?? null

  if (!shippingAddress && (order as any).shipping_address_id) {
    try {
      shippingAddress = await (orderModuleService as any).orderAddressService_?.retrieve(
        (order as any).shipping_address_id
      )
    } catch (error) {
      console.error('Could not load the shipping address for order', order.id, error)
    }
  }

  /*
   * Totals (item_total, shipping_total, total) are not populated by
   * retrieveOrder, so the confirmation used to hide Delsumma/Frakt. Merge them
   * in from query.graph. Also used by the shop notification below.
   */
  let mailOrder: any = null
  try {
    mailOrder = await loadOrderForMail(container, data.id)
  } catch (error) {
    console.error('Could not load order totals for emails', data.id, error)
  }
  const orderForTemplate: any = mailOrder
    ? { ...order, item_total: mailOrder.item_total, shipping_total: mailOrder.shipping_total, total: mailOrder.total, subtotal: mailOrder.subtotal }
    : order
  const nr = mailOrder ? orderNumber(mailOrder) : String((order as any).display_id || '')

  try {
    /* Epostmallar override: if the shop has created a template named
       "Orderbekräftelse (kund)" with content, send that one instead. */
    let sentFromDb = false
    try {
      const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      const tpl = await loadDbTemplate(pg, 'Orderbekräftelse (kund)')
      if (tpl && mailOrder) {
        const map = orderPlaceholderMap(mailOrder)
        const html = fillTemplate(tpl.body_html, map)
        const r = await sendShopMail({
          to: order.email as string,
          subject: fillTemplate(tpl.subject || 'Orderbekräftelse, order {{ordernummer}}', map),
          html,
          text: htmlToText(html),
          replyTo: process.env.ORDER_REPLY_TO_EMAIL || SHOP_EMAIL,
        })
        sentFromDb = r.ok
      }
    } catch (error) {
      console.error('Epostmallar order confirmation failed, falling back to built-in template', error)
    }
    if (!sentFromDb) {
      await notificationModuleService.createNotifications({
        to: order.email as string,
        from: fromAddress(),
        channel: 'email',
        template: EmailTemplates.ORDER_PLACED,
        data: {
          emailOptions: {
            replyTo: process.env.ORDER_REPLY_TO_EMAIL || SHOP_EMAIL,
            subject: `Orderbekräftelse, order ${nr} hos Teknikhouse.se`
          },
          order: orderForTemplate,
          shippingAddress,
          preview: 'Tack för din beställning hos Teknikhouse!'
        }
      } as any)
    }
  } catch (error) {
    console.error('Error sending order confirmation notification:', error)
  }

  // Order metadata for the admin (Ordrar), for every native order, Swish and
  // Klarna/Kustom alike, including orders created by the Kustom push fallback:
  //  - payment_method (SWISH / KLARNA / Kort) from the payment provider, with
  //    the payment session as fallback, and kustom_order_id for Kustom orders;
  //  - order_time in Swedish local time ("YYYY-MM-DD HH:MM:SS");
  //  - ordered_via "-" when the storefront did not send it (push fallback).
  //    ip_address and ordered_via normally come from the cart metadata that
  //    the storefront placeOrder() writes just before completing the cart.
  // Then the Kustom order's merchant references are set to our order number.
  // Runs after the email so a failure here cannot block the confirmation.
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const loadRow = async (): Promise<any> => {
      const { data: rows } = await query.graph({
        entity: 'order',
        filters: { id: data.id },
        fields: [
          'id',
          'display_id',
          'created_at',
          'metadata',
          'payment_collections.payments.provider_id',
          'payment_collections.payments.data',
          'payment_collections.payment_sessions.provider_id',
          'payment_collections.payment_sessions.status',
          'payment_collections.payment_sessions.data',
        ],
      })
      return rows?.[0] || null
    }
    let row: any = await loadRow()
    let pay = pickOrderPayment(row)
    if (!pay.provider_id) {
      await new Promise((ok) => setTimeout(ok, 3000))
      row = await loadRow()
      pay = pickOrderPayment(row)
    }
    const pid: string = pay.provider_id
    let pm = ''
    if (/swish/i.test(pid)) pm = 'SWISH'
    else if (/klarna|kustom/i.test(pid)) pm = 'KLARNA'
    else if (/stripe|card/i.test(pid)) pm = 'Kort'
    if (!pid) console.warn('order.placed: no payment provider found for', data.id)
    const kid: string = /kustom/i.test(pid) ? String(pay.data?.kustom_order_id || '') : ''

    const meta: any = { ...(row?.metadata || {}) }
    let changed = false
    if (pm && meta.payment_method !== pm) {
      meta.payment_method = pm
      changed = true
    }
    if (kid && meta.kustom_order_id !== kid) {
      meta.kustom_order_id = kid
      changed = true
    }
    if (!meta.wiki_order_id && !meta.order_time) {
      const t = swedishTime(row?.created_at || (order as any).created_at || new Date())
      if (t) {
        meta.order_time = t
        changed = true
      }
    }
    if (!meta.wiki_order_id && !meta.ordered_via) {
      meta.ordered_via = '-'
      changed = true
    }
    if (changed) {
      await orderModuleService.updateOrders(data.id, {
        metadata: meta,
      })
    }

    if (kid && !meta.wiki_order_id) {
      const ref = String(row?.display_id || (order as any).display_id || '')
      let r = await updateKustomMerchantReferences(kid, ref)
      if (!r.ok && r.status !== 401 && r.status !== 403) {
        await new Promise((ok) => setTimeout(ok, 5000))
        r = await updateKustomMerchantReferences(kid, ref)
      }
    }
  } catch (error) {
    console.error('Could not stamp order metadata on order', data.id, error)
  }

  /* Shop notification to info@teknikhouse.se (replaces the old Wiki "Order <nr> (<namn>)" mail). */
  try {
    const r = await sendShopOrderNotification(container, data.id)
    if (!r.ok) console.error('Shop order notification failed for', data.id, r.error)
  } catch (error) {
    console.error('Shop order notification crashed for', data.id, error)
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed'
}
