import { Metadata } from "next"
import { notFound } from "next/navigation"

import Wrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { enrichLineItems, retrieveCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { getCustomer } from "@lib/data/customer"
import { getRegion } from "@lib/data/regions"
import { getProductsList } from "@lib/data/products"
import ProductPreview from "@modules/products/components/product-preview"

export const metadata: Metadata = {
  title: "Kassa",
}

const fetchCart = async () => {
  const cart = await retrieveCart()
  if (!cart) {
    return notFound()
  }

  if (cart?.items?.length) {
    const enrichedItems = await enrichLineItems(cart?.items, cart?.region_id!)
    cart.items = enrichedItems as HttpTypes.StoreCartLineItem[]
  }

  return cart
}

export default async function Checkout({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const cart = await fetchCart()
  const customer = await getCustomer()

  // Source the region from the cart (always present in checkout) with the
  // route param as a fallback, so the recommendations reliably resolve prices.
  const cc = (
    (cart as any)?.shipping_address?.country_code ||
    countryCode ||
    "se"
  ).toLowerCase()

  const region = await getRegion(cc).catch(() => null)
  let recommended: HttpTypes.StoreProduct[] = []
  if (region) {
    const { response } = await getProductsList({
      countryCode: cc,
      queryParams: { limit: 12 } as HttpTypes.StoreProductListParams,
    }).catch(() => ({ response: { products: [], count: 0 } }))
    recommended = response.products ?? []
  }

  return (
    <>
      <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-12">
        <Wrapper cart={cart}>
          <CheckoutForm cart={cart} customer={customer} />
        </Wrapper>
        <CheckoutSummary cart={cart} />
      </div>

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
    </>
  )
}
