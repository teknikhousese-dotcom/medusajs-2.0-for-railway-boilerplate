"use client"

import { RadioGroup } from "@headlessui/react"
import { CheckCircleSolid, Spinner } from "@medusajs/icons"
import { Button, Heading, Text, clx } from "@medusajs/ui"

import Divider from "@modules/common/components/divider"
import Radio from "@modules/common/components/radio"
import ErrorMessage from "@modules/checkout/components/error-message"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { setShippingMethod } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

// Delivery description shown under each shipping option name (teknikhouse.se wording).
const shippingDesc = (name?: string): string => {
  const n = (name || "").toLowerCase()
  if (n.includes("hämta") || n.includes("hamta") || n.includes("butik"))
    return "Hämta din beställning i vår butik på Sveavägen, Stockholm. Vi meddelar dig så snart din order är redo för upphämtning. Öppettider: Mån–Fre 11:00–16:00."
  if (n.includes("ombud"))
    return "Ditt paket kommer till närmaste PostNords utlämningsställe inom 1-3 vardagar."
  if (n.includes("express")) return "1-2 vardagar."
  if (n.includes("hem"))
    return "Få ditt paket levererat direkt hem. Levereras inom 1-3 vardagar."
  if (n.includes("standard")) return "2-3 vardagar. Fraktfritt vid köp över 999 kr."
  return "Leverans med PostNord."
}

// Collapse duplicate options by name (prefer the calculated variant, e.g. free-shipping Standard).
const dedupeMethods = (
  methods: HttpTypes.StoreCartShippingOption[] | null
): HttpTypes.StoreCartShippingOption[] => {
  const byName: Record<string, HttpTypes.StoreCartShippingOption> = {}
  for (const m of methods || []) {
    const cur = byName[m.name]
    if (!cur) {
      byName[m.name] = m
    } else if (cur.price_type !== "calculated" && m.price_type === "calculated") {
      byName[m.name] = m
    }
  }
  return Object.values(byName)
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Optimistic selection: highlight the clicked option instantly while the
  // server round-trip (which recomputes totals) happens in the background.
  const [pendingId, setPendingId] = useState<string | undefined>(undefined)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "delivery"

  const shippingMethods = dedupeMethods(availableShippingMethods)

  const cartSelectedId = cart.shipping_methods?.at(-1)?.shipping_option_id
  const activeId = pendingId ?? cartSelectedId
  const selectedShippingMethod = shippingMethods.find(
    (method) => method.id === activeId
  )

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = () => {
    router.push(pathname + "?step=payment", { scroll: false })
  }

  const set = async (id: string) => {
    setPendingId(id)
    setIsLoading(true)
    setError(null)
    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .catch((err) => {
        setError(err.message)
        setPendingId(undefined)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  // Once the cart catches up with the optimistic choice, drop the override.
  useEffect(() => {
    if (pendingId && cartSelectedId === pendingId) {
      setPendingId(undefined)
    }
  }, [cartSelectedId, pendingId])

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && cart.shipping_methods?.length === 0,
            }
          )}
        >
          Leverans
          {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
            <CheckCircleSolid />
          )}
        </Heading>
        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <Text>
              <button
                onClick={handleEdit}
                className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                data-testid="edit-delivery-button"
              >
                Ändra
              </button>
            </Text>
          )}
      </div>
      {isOpen ? (
        <div data-testid="delivery-options-container">
          <div className="pb-8">
            <RadioGroup value={activeId} onChange={set}>
              {shippingMethods.map((option) => {
                const isSelected = option.id === activeId
                return (
                  <RadioGroup.Option
                    key={option.id}
                    value={option.id}
                    data-testid="delivery-option-radio"
                    className={clx(
                      "flex items-center justify-between text-small-regular cursor-pointer py-4 border rounded-rounded px-8 mb-2 hover:shadow-borders-interactive-with-active",
                      {
                        "border-ui-border-interactive": isSelected,
                      }
                    )}
                  >
                    <div className="flex items-center gap-x-4">
                      <Radio checked={isSelected} />
                      <div className="flex flex-col">
                        <span className="text-base-regular">{option.name}</span>
                        <span className="text-ui-fg-subtle text-small-regular">
                          {shippingDesc(option.name)}
                        </span>
                      </div>
                    </div>
                    <span className="justify-self-end text-ui-fg-base flex items-center gap-x-2">
                      {isSelected && isLoading && (
                        <Spinner className="animate-spin text-ui-fg-muted" />
                      )}
                      {option.amount == null
                        ? "29 kr"
                        : option.amount === 0
                        ? "Fri frakt"
                        : convertToLocale({
                            amount: option.amount!,
                            currency_code: cart?.currency_code,
                          })}
                    </span>
                  </RadioGroup.Option>
                )
              })}
            </RadioGroup>
          </div>

          <ErrorMessage
            error={error}
            data-testid="delivery-option-error-message"
          />

          <Button
            size="large"
            className="mt-6"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!cart.shipping_methods?.[0]}
            data-testid="submit-delivery-option-button"
          >
            Fortsätt till betalning
          </Button>
        </div>
      ) : (
        <div>
          <div className="text-small-regular">
            {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Leveranssätt
                </Text>
                <Text className="txt-medium text-ui-fg-subtle">
                  {selectedShippingMethod?.name}{" "}
                  {convertToLocale({
                    amount: selectedShippingMethod?.amount!,
                    currency_code: cart?.currency_code,
                  })}
                </Text>
              </div>
            )}
          </div>
        </div>
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Shipping
