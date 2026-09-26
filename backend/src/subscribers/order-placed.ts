import { Modules, ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'
import { SHOP_EMAIL, fromAddress, loadDbTemplate, fillTemplate, sendShopMail, htmlToText } from '../modules/email-notifications/shop-mail'
import { loadOrderForMail, orderNumber, orderPlaceholderMap, sendShopOrderNotification } from '../modules/email-notifications/order-mails'

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

  // Tag the payment method on the order (metadata.payment_method) from the
  // payment provider, so the admin Orders list shows the right logo
  // (Swish/Klarna/Card). Runs after the email so a failure here cannot
  // block the order confirmation.
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: rows } = await query.graph({
      entity: 'order',
      filters: { id: data.id },
      fields: ['id', 'metadata', 'payment_collections.payments.provider_id', 'payment_collections.payments.data'],
    })
    const row: any = rows?.[0]
    const pay: any = row?.payment_collections?.[0]?.payments?.[0]
    const pid: string = pay?.provider_id || ''
    let pm = ''
    if (/swish/i.test(pid)) pm = 'SWISH'
    else if (/klarna|kustom/i.test(pid)) pm = 'KLARNA'
    else if (/stripe|card/i.test(pid)) pm = 'Kort'
    const current = (row?.metadata?.payment_method as string) || ''
    /* Kustom (KCO) orders: store kustom_order_id so the admin Klarna panel can capture/refund. */
    const kid: string = /kustom/i.test(pid) ? String(pay?.data?.kustom_order_id || '') : ''
    const needKid = !!kid && row?.metadata?.kustom_order_id !== kid
    if ((pm && current !== pm) || needKid) {
      const meta: any = { ...(row?.metadata || {}) }
      if (pm) meta.payment_method = pm
      if (needKid) meta.kustom_order_id = kid
      await orderModuleService.updateOrders(data.id, {
        metadata: meta,
      })
    }
  } catch (error) {
    console.error('Could not stamp payment_method on order', data.id, error)
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
