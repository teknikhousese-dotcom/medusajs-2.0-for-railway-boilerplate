import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  if (!shippingMethods || !paymentMethods) {
    return null
  }

  /*
   * Order: 1 Leverans -> 2 Betalning -> 3 Dina uppgifter (only for Swish and
   * other non-Klarna methods) -> Slutför köp. With Klarna (Kustom Checkout)
   * the KCO iframe is shown inside step 2 and Klarna collects email, phone
   * and address, so steps 3/4 are hidden.
   */
  const activeProvider: string =
    cart.payment_collection?.payment_sessions?.find(
      (s: any) => s.status === "pending"
    )?.provider_id ?? ""
  const klarnaChosen = activeProvider.startsWith("pp_kustom")

  return (
    <div>
      <div className="w-full grid grid-cols-1 gap-y-8">
        <div>
          <Shipping cart={cart} availableShippingMethods={shippingMethods} />
        </div>

        <div>
          <Payment cart={cart} availablePaymentMethods={paymentMethods} />
        </div>

        {!klarnaChosen && (
          <div>
            <Addresses cart={cart} customer={customer} />
          </div>
        )}

        {!klarnaChosen && (
          <div>
            <Review cart={cart} />
          </div>
        )}
      </div>
    </div>
  )
}
