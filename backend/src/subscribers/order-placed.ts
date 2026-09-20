import { Modules, ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'
import { RESEND_FROM_EMAIL } from '../lib/constants'

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

  try {
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template: EmailTemplates.ORDER_PLACED,
      data: {
        emailOptions: {
          // RESEND_FROM_EMAIL comes from lib/constants, which falls back to
          // RESEND_FROM. Reading process.env directly here missed that
          // fallback, so the reply-to was empty on every deploy configured
          // with RESEND_FROM, which is what the Railway template sets.
          replyTo: process.env.ORDER_REPLY_TO_EMAIL || RESEND_FROM_EMAIL,
          subject: 'Din order är bekräftad – Teknikhouse.se'
        },
        order,
        shippingAddress,
        preview: 'Tack för din beställning hos Teknikhouse!'
      }
    })
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
      fields: ['id', 'metadata', 'payment_collections.payments.provider_id'],
    })
    const row: any = rows?.[0]
    const pid: string =
      row?.payment_collections?.[0]?.payments?.[0]?.provider_id || ''
    let pm = ''
    if (/swish/i.test(pid)) pm = 'SWISH'
    else if (/klarna/i.test(pid)) pm = 'KLARNA'
    else if (/stripe|card/i.test(pid)) pm = 'Kort'
    const current = (row?.metadata?.payment_method as string) || ''
    if (pm && current !== pm) {
      await orderModuleService.updateOrders(data.id, {
        metadata: { ...(row?.metadata || {}), payment_method: pm },
      })
    }
  } catch (error) {
    console.error('Could not stamp payment_method on order', data.id, error)
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed'
}
