import { Metadata } from "next"
import CartTemplate from "@modules/cart/templates"

import { enrichLineItems, retrieveCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { getCustomer } from "@lib/data/customer"
import { getRegion } from "@lib/data/regions"
import { getProductsList } from "@lib/data/products"
import ProductPreview from "@modules/products/components/product-preview"

export const metadata: Metadata = {
  title: "Varukorg",
  description: "Visa din varukorg",
}

const TRUST = [
  { b: "Fri frakt", t: "över 999 kr" },
  { b: "4,6 / 5", t: "på Trustpilot" },
  { b: "30 dagars", t: "öppet köp" },
  { b: "Snabb leverans", t: "skickas 1–2 dagar" },
]

const fetchCart = async () => {
  const cart = await retrieveCart()

  if (!cart) {
    return null
  }

  if (cart?.items?.length) {
    const enrichedItems = await enrichLineItems(cart?.items, cart?.region_id!)
    cart.items = enrichedItems as HttpTypes.StoreCartLineItem[]
  }

  return cart
}

export default async function Cart({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const cart = await fetchCart()
  const customer = await getCustomer()

  const cc = (
    (cart as any)?.shipping_address?.country_code ||
    countryCode ||
    "se"
  ).toLowerCase()

  const region = cart ? await getRegion(cc).catch(() => null) : null
  let recommended: HttpTypes.StoreProduct[] = []
  if (cart?.items?.length && region) {
    const { response } = await getProductsList({
      countryCode: cc,
      queryParams: { limit: 12 } as HttpTypes.StoreProductListParams,
    }).catch(() => ({ response: { products: [], count: 0 } }))
    recommended = response.products ?? []
  }

  return (
    <>
      <CartTemplate cart={cart} customer={customer} />

      {region && recommended.length > 0 && (
        <div className="content-container border-t py-12">
          <h2 className="text-[26px] font-semibold text-[#14161C] mb-6">
            Kanske gillar du också
          </h2>
          <ul className="flex gap-4 overflow-x-auto snap-x pb-3 -mx-4 px-4">
            {recommended.map((p) => (
              <li
                key={p.id}
                className="snap-start shrink-0 w-[160px] small:w-[220px]"
              >
                <ProductPreview product={p} region={region} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {cart?.items?.length ? (
        <div className="border-t border-b bg-gray-50">
          <div className="content-container py-5 grid grid-cols-2 small:grid-cols-4 gap-4 text-center">
            {TRUST.map((x) => (
              <div key={x.b} className="text-[13px] text-gray-600">
                <div className="font-semibold text-[#14161C]">{x.b}</div>
                <div>{x.t}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}
