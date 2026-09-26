"use client"

import { useActionState, useState } from "react"

import { CheckCircleSolid } from "@medusajs/icons"
import { Heading, Text, useToggleState } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import Divider from "@modules/common/components/divider"

import { setAddresses, updateCart } from "@lib/data/cart"
import compareAddresses from "@lib/util/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "address"
  const filled = !!(cart?.shipping_address?.address_1 && cart?.email)

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const meta = ((cart?.metadata as Record<string, any> | null) || {}) as Record<
    string,
    any
  >
  const [isCompany, setIsCompany] = useState<boolean>(
    meta.customer_type === "organization" || !!cart?.shipping_address?.company
  )

  /*
   * Privat / Företag: company name goes in shipping (and billing)
   * address.company, the org nr and customer type in cart metadata, which
   * Medusa copies to the order. Saved first, then the normal address action
   * runs (it redirects to the next step).
   */
  const saveAddresses = async (prev: unknown, formData: FormData) => {
    const company = formData.get("customer_type") === "organization"
    const orgNr = String(formData.get("org_nr") || "").trim()
    const companyName = String(formData.get("shipping_address.company") || "").trim()
    const wasCompany = meta.customer_type === "organization"
    if (company || wasCompany) {
      try {
        await updateCart({
          metadata: {
            ...meta,
            customer_type: company ? "organization" : "person",
            org_nr: company ? orgNr : "",
            company_name: company ? companyName : "",
          },
        })
      } catch (e: any) {
        return e?.message || "Kunde inte spara företagsuppgifterna."
      }
    }
    return setAddresses(prev, formData)
  }

  const [message, formAction] = useActionState(saveAddresses, null)

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between gap-x-4 mb-5 small:mb-6">
        <Heading
          level="h2"
          className={
            "flex flex-row items-center gap-x-2 text-[22px] small:text-[28px] font-semibold leading-tight text-[#14161C]" +
            (!isOpen && !filled ? " opacity-50 pointer-events-none select-none" : "")
          }
        >
          3. Leveransadress
          {!isOpen && filled && <CheckCircleSolid />}
        </Heading>
        {!isOpen && filled && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-address-button"
            >
              Ändra
            </button>
          </Text>
        )}
      </div>
      {isOpen ? (
        <form action={formAction}>
          <div className="pb-8">
            <input
              type="hidden"
              name="customer_type"
              value={isCompany ? "organization" : "person"}
            />
            <div
              role="radiogroup"
              aria-label="Jag handlar som"
              className="grid grid-cols-2 gap-1 p-1 mb-5 rounded-full bg-gray-100 max-w-[340px]"
            >
              {[
                { v: false, t: "Privat" },
                { v: true, t: "Företag" },
              ].map((o) => (
                <button
                  key={o.t}
                  type="button"
                  role="radio"
                  aria-checked={isCompany === o.v}
                  onClick={() => setIsCompany(o.v)}
                  data-testid={o.v ? "customer-type-company" : "customer-type-private"}
                  className={
                    "h-10 rounded-full text-[15px] font-semibold transition-all " +
                    (isCompany === o.v
                      ? "bg-white text-[#14161C] shadow-sm ring-1 ring-black/5"
                      : "text-gray-500 hover:text-[#14161C]")
                  }
                >
                  {o.t}
                </button>
              ))}
            </div>
            <ShippingAddress
              customer={customer}
              checked={sameAsBilling}
              onChange={toggleSameAsBilling}
              cart={cart}
              isCompany={isCompany}
            />

            {!sameAsBilling && (
              <div>
                <Heading
                  level="h3"
                  className="text-[18px] small:text-[20px] font-semibold text-[#14161C] pb-4 pt-6"
                >
                  Fakturaadress
                </Heading>

                <BillingAddress cart={cart} />
              </div>
            )}
            <SubmitButton
              className="mt-6 w-full small:w-auto"
              data-testid="submit-address-button"
            >
              Fortsätt till granskning
            </SubmitButton>
            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>
        </form>
      ) : (
        <div>
          <div className="text-small-regular">
            {cart && filled && cart.shipping_address ? (
              <div className="grid grid-cols-1 small:grid-cols-3 gap-4 small:gap-6 w-full">
                <div
                  className="flex flex-col min-w-0"
                  data-testid="shipping-address-summary"
                >
                  <Text className="txt-medium-plus text-ui-fg-base mb-1">
                    Leveransadress
                  </Text>
                  {cart.shipping_address.company && (
                    <Text className="txt-medium text-ui-fg-subtle break-words">
                      {cart.shipping_address.company}
                      {meta.org_nr ? ", org.nr " + meta.org_nr : ""}
                    </Text>
                  )}
                  <Text className="txt-medium text-ui-fg-subtle break-words">
                    {cart.shipping_address.first_name}{" "}
                    {cart.shipping_address.last_name}
                  </Text>
                  <Text className="txt-medium text-ui-fg-subtle break-words">
                    {cart.shipping_address.address_1}{" "}
                    {cart.shipping_address.address_2}
                  </Text>
                  <Text className="txt-medium text-ui-fg-subtle break-words">
                    {cart.shipping_address.postal_code}{" "}
                    {cart.shipping_address.city}
                  </Text>
                </div>

                <div
                  className="flex flex-col min-w-0"
                  data-testid="shipping-contact-summary"
                >
                  <Text className="txt-medium-plus text-ui-fg-base mb-1">
                    Kontakt
                  </Text>
                  <Text className="txt-medium text-ui-fg-subtle break-words">
                    {cart.shipping_address.phone}
                  </Text>
                  <Text className="txt-medium text-ui-fg-subtle break-all">
                    {cart.email}
                  </Text>
                </div>

                <div
                  className="flex flex-col min-w-0"
                  data-testid="billing-address-summary"
                >
                  <Text className="txt-medium-plus text-ui-fg-base mb-1">
                    Fakturaadress
                  </Text>

                  {sameAsBilling ? (
                    <Text className="txt-medium text-ui-fg-subtle">
                      Samma som leveransadressen
                    </Text>
                  ) : (
                    <>
                      {cart.billing_address?.company && (
                        <Text className="txt-medium text-ui-fg-subtle break-words">
                          {cart.billing_address?.company}
                        </Text>
                      )}
                      <Text className="txt-medium text-ui-fg-subtle break-words">
                        {cart.billing_address?.first_name}{" "}
                        {cart.billing_address?.last_name}
                      </Text>
                      <Text className="txt-medium text-ui-fg-subtle break-words">
                        {cart.billing_address?.address_1}{" "}
                        {cart.billing_address?.address_2}
                      </Text>
                      <Text className="txt-medium text-ui-fg-subtle break-words">
                        {cart.billing_address?.postal_code}{" "}
                        {cart.billing_address?.city}
                      </Text>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Addresses
