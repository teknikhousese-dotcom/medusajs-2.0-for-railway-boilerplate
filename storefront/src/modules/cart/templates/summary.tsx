"use client"

import { Heading } from "@medusajs/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

/* The checkout always starts at 1 Leverans, then 2 Betalning. */
function getCheckoutStep(cart: HttpTypes.StoreCart) {
  return cart?.shipping_methods?.length ? "payment" : "delivery"
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)

  return (
    <div className="flex flex-col gap-y-4">
      <Heading
        level="h2"
        className="text-[22px] small:text-[24px] font-semibold leading-tight text-[#14161C]"
      >
        Sammanfattning
      </Heading>
      <DiscountCode cart={cart} />
      <Divider />
      <CartTotals totals={cart} />
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
      >
        <span className="flex w-full h-12 items-center justify-center rounded-full bg-[#F50000] hover:bg-[#C90000] text-white text-[16px] font-semibold shadow-[0_6px_16px_-6px_rgba(245,0,0,0.55)] transition-colors">
          Till kassan
        </span>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
