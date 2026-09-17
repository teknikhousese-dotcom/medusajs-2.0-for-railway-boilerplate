import { Heading } from "@medusajs/ui"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import { convertToLocale } from "@lib/util/money"

const FREE_SHIPPING_THRESHOLD = 1000

const CheckoutSummary = ({ cart }: { cart: any }) => {
  const goods = cart?.item_total ?? 0
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - goods)
  const pct = Math.max(4, Math.min(100, Math.round((goods / FREE_SHIPPING_THRESHOLD) * 100)))
  const currency_code = cart?.currency_code

  return (
    <div className="sticky top-0 flex flex-col-reverse small:flex-col gap-y-8 py-8 small:py-0 ">
      <div className="w-full bg-white flex flex-col">
        <Divider className="my-6 small:hidden" />
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular items-baseline"
        >
          Din varukorg
        </Heading>
        <Divider className="my-6" />

        <div className="mb-6 rounded-xl bg-gray-50 px-4 py-3">
          {remaining > 0 ? (
            <p className="txt-small text-ui-fg-subtle mb-2">
              Lägg till{" "}
              <span className="text-ui-fg-base font-medium">
                {convertToLocale({ amount: remaining, currency_code })}
              </span>{" "}
              till för fri frakt
            </p>
          ) : (
            <p className="txt-small text-emerald-700 mb-2 font-medium">
              Grattis – du har fri frakt!
            </p>
          )}
          <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <CartTotals totals={cart} />
        <ItemsPreviewTemplate items={cart?.items} />
        <div className="my-6">
          <DiscountCode cart={cart} />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-200 pt-4 txt-small text-ui-fg-subtle">
          <span>Trygg e-handel</span>
          <span>·</span>
          <span>30 dagars öppet köp</span>
          <span>·</span>
          <span>4,7 ★ omdöme</span>
        </div>
      </div>
    </div>
  )
}

export default CheckoutSummary
