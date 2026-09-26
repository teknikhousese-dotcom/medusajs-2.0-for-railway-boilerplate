"use client"

import { Heading, Text, clx } from "@medusajs/ui"

import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Review = ({ cart }: { cart: any }) => {
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const previousStepsCompleted =
    cart.shipping_address &&
    cart.shipping_methods.length > 0 &&
    (cart.payment_collection || paidByGiftcard)

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between gap-x-4 mb-5 small:mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row items-center gap-x-2 text-[22px] small:text-[28px] font-semibold leading-tight text-[#14161C]",
            {
              "opacity-50 pointer-events-none select-none": !isOpen,
            }
          )}
        >
          4. Granska och betala
        </Heading>
      </div>
      {isOpen && previousStepsCompleted && (
        <>
          <div className="w-full mb-5">
            <Text className="txt-medium text-ui-fg-subtle">
              När du betalar godkänner du våra{" "}
              <LocalizedClientLink
                href="/info/villkor"
                className="underline hover:text-ui-fg-base"
              >
                köpvillkor
              </LocalizedClientLink>{" "}
              och vår{" "}
              <LocalizedClientLink
                href="/info/integritetspolicy"
                className="underline hover:text-ui-fg-base"
              >
                integritetspolicy
              </LocalizedClientLink>
              . Du har alltid 30 dagars öppet köp.
            </Text>
          </div>
          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </>
      )}
    </div>
  )
}

export default Review
