import { Text, Section, Hr, Link, Row, Column } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'
import { OrderDTO, OrderAddressDTO } from '@medusajs/framework/types'

export const ORDER_PLACED = 'order-placed'

interface OrderPlacedPreviewProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  shippingAddress?: OrderAddressDTO | null
}

export interface OrderPlacedTemplateProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  shippingAddress?: OrderAddressDTO | null
  preview?: string
}

export const isOrderPlacedTemplateData = (data: any): data is OrderPlacedTemplateProps =>
  typeof data?.order === 'object' && data.order !== null

// Medusa v2 lagrar pengar som BigNumber-decimaler (kommer som strängar).
// Formatera i svensk stil: "1 234 kr".
const kr = (amount: unknown, currencyCode?: string): string => {
  const value = Number(amount)
  const code = (currencyCode ?? 'SEK').toUpperCase()
  if (!Number.isFinite(value)) return String(amount ?? '')
  try {
    return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(value)
  } catch {
    return `${Math.round(value)} kr`
  }
}
const qty = (q: unknown): string => {
  const v = Number(q)
  return Number.isFinite(v) ? String(v) : ''
}

const C = { ink: '#14161C', sub: '#5B5F6B', mut: '#8A8F9A', line: '#ECECEF', red: '#F50000' }

export const OrderPlacedTemplate: React.FC<OrderPlacedTemplateProps> & {
  PreviewProps: OrderPlacedPreviewProps
} = ({ order, shippingAddress, preview = 'Tack för din beställning hos Teknikhouse!' }) => {
  const name = [shippingAddress?.first_name, shippingAddress?.last_name].filter(Boolean).join(' ')
  const items = order.items ?? []
  const anyOrder = order as any
  const total = order.summary?.raw_current_order_total?.value ?? anyOrder.total
  const itemTotal = anyOrder.item_total
  const shippingTotal = anyOrder.shipping_total

  return (
    <Base preview={preview}>
      <Section>
        {/* Bekräftelse-hero */}
        <div style={{ textAlign: 'center', margin: '0 0 6px' }}>
          <div style={{ display: 'inline-block', width: '52px', height: '52px', lineHeight: '52px', borderRadius: '999px', background: '#EAF8EF', color: '#1E9E57', fontSize: '26px', fontWeight: 700 }}>✓</div>
        </div>
        <Text style={{ fontSize: '23px', fontWeight: 700, color: C.ink, textAlign: 'center', margin: '10px 0 4px', letterSpacing: '-0.02em' }}>
          Tack för din beställning!
        </Text>
        <Text style={{ color: C.sub, textAlign: 'center', margin: '0 0 4px', fontSize: '15px', lineHeight: '1.6' }}>
          {name ? `Hej ${name}, din` : 'Din'} order är bekräftad och behandlas nu. Du får ett nytt mejl så fort den skickas.
        </Text>
        <Text style={{ textAlign: 'center', margin: '0 0 22px' }}>
          <span style={{ display: 'inline-block', background: '#F7F7FA', color: C.ink, fontWeight: 700, fontSize: '14px', padding: '7px 16px', borderRadius: '999px' }}>
            Ordernummer #{order.display_id}
          </span>
          <span style={{ display: 'inline-block', color: C.mut, fontSize: '13px', margin: '0 0 0 10px' }}>
            {new Date(order.created_at).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </Text>

        {/* Varor */}
        <Text style={{ fontSize: '13px', fontWeight: 700, color: C.mut, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Din beställning</Text>
        <div style={{ border: `1px solid ${C.line}`, borderRadius: '12px', overflow: 'hidden' }}>
          {items.map((item, i) => (
            <Row key={item.id} style={{ padding: '12px 14px', borderBottom: i < items.length - 1 ? `1px solid ${C.line}` : 'none' }}>
              <Column>
                <Text style={{ margin: 0, color: C.ink, fontSize: '14px', fontWeight: 600 }}>{(item as any).product_title || item.title}</Text>
                {(item as any).product_title && item.title !== (item as any).product_title && (
                  <Text style={{ margin: '2px 0 0', color: C.mut, fontSize: '12px' }}>{item.title}</Text>
                )}
                <Text style={{ margin: '2px 0 0', color: C.mut, fontSize: '12px' }}>Antal: {qty(item.quantity)}</Text>
              </Column>
              <Column style={{ textAlign: 'right', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                <Text style={{ margin: 0, color: C.ink, fontSize: '14px', fontWeight: 700 }}>{kr(Number(item.unit_price) * Number(item.quantity), order.currency_code)}</Text>
              </Column>
            </Row>
          ))}
        </div>

        {/* Summering */}
        <div style={{ margin: '14px 0 0' }}>
          {itemTotal != null && (
            <Row style={{ padding: '3px 2px' }}>
              <Column><Text style={{ margin: 0, color: C.sub, fontSize: '14px' }}>Delsumma</Text></Column>
              <Column style={{ textAlign: 'right' }}><Text style={{ margin: 0, color: C.ink, fontSize: '14px' }}>{kr(itemTotal, order.currency_code)}</Text></Column>
            </Row>
          )}
          {shippingTotal != null && (
            <Row style={{ padding: '3px 2px' }}>
              <Column><Text style={{ margin: 0, color: C.sub, fontSize: '14px' }}>Frakt</Text></Column>
              <Column style={{ textAlign: 'right' }}><Text style={{ margin: 0, color: Number(shippingTotal) === 0 ? '#1E9E57' : C.ink, fontSize: '14px', fontWeight: Number(shippingTotal) === 0 ? 700 : 400 }}>{Number(shippingTotal) === 0 ? 'Fri frakt' : kr(shippingTotal, order.currency_code)}</Text></Column>
            </Row>
          )}
          <Hr style={{ borderColor: C.line, margin: '8px 0' }} />
          <Row style={{ padding: '2px' }}>
            <Column><Text style={{ margin: 0, color: C.ink, fontSize: '16px', fontWeight: 700 }}>Totalt</Text></Column>
            <Column style={{ textAlign: 'right' }}><Text style={{ margin: 0, color: C.ink, fontSize: '16px', fontWeight: 700 }}>{kr(total, order.currency_code)}</Text></Column>
          </Row>
          <Text style={{ margin: '2px 2px 0', color: C.mut, fontSize: '11px', textAlign: 'right' }}>Inkl. moms</Text>
        </div>

        {shippingAddress && (
          <>
            <Hr style={{ borderColor: C.line, margin: '22px 0 18px' }} />
            <Text style={{ fontSize: '13px', fontWeight: 700, color: C.mut, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Leveransadress</Text>
            <Text style={{ margin: 0, color: C.ink, fontSize: '14px', lineHeight: '1.6' }}>
              {name}<br />
              {shippingAddress.address_1}{shippingAddress.address_2 ? `, ${shippingAddress.address_2}` : ''}<br />
              {shippingAddress.postal_code} {shippingAddress.city}
            </Text>
          </>
        )}

        {/* CTA */}
        <Section style={{ textAlign: 'center', margin: '28px 0 6px' }}>
          <Link href="https://teknikhouse.se" style={{ background: C.red, color: '#fff', textDecoration: 'none', fontWeight: 600, padding: '13px 28px', borderRadius: '10px', fontSize: '14px', display: 'inline-block' }}>
            Fortsätt handla på teknikhouse.se →
          </Link>
        </Section>
        <Text style={{ textAlign: 'center', color: C.mut, fontSize: '13px', lineHeight: '1.6', margin: '12px 0 0' }}>
          Har du frågor om din order? Svara på det här mejlet eller kontakta oss på <Link href="mailto:info@teknikhouse.se" style={{ color: C.red, textDecoration: 'none' }}>info@teknikhouse.se</Link>.
        </Text>
      </Section>
    </Base>
  )
}

OrderPlacedTemplate.PreviewProps = {
  order: {
    id: 'test-order-id',
    display_id: '68266',
    created_at: new Date().toISOString(),
    email: 'kund@example.com',
    currency_code: 'sek',
    items: [
      { id: 'item-1', title: 'Svart', product_title: 'iPhone 13 Skärm (OLED)', quantity: 1, unit_price: 890 },
      { id: 'item-2', title: '2m', product_title: 'USB-C Kabel', quantity: 2, unit_price: 99 }
    ],
    item_total: 1088,
    shipping_total: 0,
    total: 1088,
    summary: { raw_current_order_total: { value: 1088 } }
  } as any,
  shippingAddress: {
    first_name: 'Anna',
    last_name: 'Andersson',
    address_1: 'Sveavägen 139',
    city: 'Stockholm',
    postal_code: '113 46',
    country_code: 'se'
  } as any
} as OrderPlacedPreviewProps

export default OrderPlacedTemplate
