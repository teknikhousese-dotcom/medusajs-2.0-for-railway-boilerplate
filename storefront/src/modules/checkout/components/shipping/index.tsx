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

type Kind = "standard" | "ombud" | "express" | "hem" | "butik" | "other"

const kindOf = (name?: string): Kind => {
  const n = (name || "").toLowerCase()
  if (n.includes("hämta") || n.includes("hamta") || n.includes("butik")) return "butik"
  if (n.includes("ombud")) return "ombud"
  if (n.includes("express")) return "express"
  if (n.includes("hem")) return "hem"
  if (n.includes("standard")) return "standard"
  return "other"
}

/* Leveranstid: teknikhouse.se numbers (no promised date). */
const timeLabel: Record<Kind, string> = {
  standard: "2-3 vardagar",
  ombud: "1-3 vardagar",
  express: "1-2 vardagar",
  hem: "1-3 vardagar",
  butik: "Sveavägen 139, Stockholm",
  other: "1-3 vardagar",
}

const noteLabel: Record<Kind, string> = {
  standard: "Fri frakt när du handlar för över 999 kr",
  ombud: "Hämtas hos ditt närmaste PostNord-ombud",
  express: "Prioriterad leverans med PostNord",
  hem: "PostNord kör hem paketet till din dörr",
  butik: "Mån till fre 10 till 18, lör 11 till 17",
  other: "Leverans med PostNord",
}

const titleOf = (k: Kind, name?: string) =>
  k === "butik" ? "Hämta i butik" : name || ""

const Icon = ({ k, active }: { k: Kind; active: boolean }) => {
  const color = active ? "#F50000" : "#6B7280"
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }
  if (k === "express")
    return (
      <svg {...common}>
        <path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z" />
      </svg>
    )
  if (k === "ombud")
    return (
      <svg {...common}>
        <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    )
  if (k === "butik")
    return (
      <svg {...common}>
        <path d="M3 9l1.5-5h15L21 9M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9ZM4 9h16" />
        <path d="M9 20v-5h6v5" />
      </svg>
    )
  if (k === "hem")
    return (
      <svg {...common}>
        <path d="M3 11l9-7 9 7" />
        <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
        <path d="M9 20v-6h6v6" />
      </svg>
    )
  return (
    <svg {...common}>
      <path d="M1 5h11v11H1zM12 8h5l3 3v5h-8" />
      <circle cx="5.5" cy="18.5" r="1.7" />
      <circle cx="16.5" cy="18.5" r="1.7" />
    </svg>
  )
}

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

  useEffect(() => {
    if (pendingId && cartSelectedId === pendingId) {
      setPendingId(undefined)
    }
  }, [cartSelectedId, pendingId])

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const priceNode = (option: HttpTypes.StoreCartShippingOption) => {
    const free = option.amount === 0
    return (
      <span
        className={clx("text-[15px] small:text-base font-semibold whitespace-nowrap", {
          "text-[#1a9d55]": free,
          "text-[#14161C]": !free,
        })}
      >
        {option.amount == null
          ? "29 kr"
          : free && kindOf(option.name) === "butik"
          ? "Gratis"
          : free
          ? "Fri frakt"
          : convertToLocale({
              amount: option.amount!,
              currency_code: cart?.currency_code,
            })}
      </span>
    )
  }

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between gap-x-4 mb-5 small:mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row items-center gap-x-2 text-[22px] small:text-[28px] font-semibold leading-tight text-[#14161C]",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && cart.shipping_methods?.length === 0,
            }
          )}
        >
          1. Leverans
          {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
            <CheckCircleSolid />
          )}
        </Heading>
        {!isOpen &&
          (cart.shipping_methods?.length ?? 0) > 0 && (
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
          <div className="pb-6">
            <RadioGroup value={activeId} onChange={set}>
              {shippingMethods.map((option) => {
                const isSelected = option.id === activeId
                const k = kindOf(option.name)
                const recommended = k === "standard"
                return (
                  <RadioGroup.Option
                    key={option.id}
                    value={option.id}
                    data-testid="delivery-option-radio"
                    className={clx(
                      "grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-x-3 small:gap-x-4 cursor-pointer py-3.5 px-3.5 small:py-4 small:px-5 border rounded-2xl mb-3 transition-all duration-150",
                      isSelected
                        ? "border-[#F50000] bg-[#FFF5F5] ring-1 ring-[#F50000] shadow-[0_4px_14px_-6px_rgba(245,0,0,0.35)]"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    )}
                  >
                    <Radio checked={isSelected} />
                    <span
                      className={clx(
                        "flex items-center justify-center w-10 h-10 rounded-xl shrink-0",
                        isSelected ? "bg-white" : "bg-gray-50"
                      )}
                    >
                      <Icon k={k} active={isSelected} />
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[15px] small:text-base font-semibold leading-snug text-[#14161C]">
                          {titleOf(k, option.name)}
                        </span>
                        {recommended && (
                          <span className="text-[11px] font-semibold text-[#F50000] bg-[#FFE8E8] rounded px-1.5 py-0.5 leading-none">
                            Populärt
                          </span>
                        )}
                      </span>
                      <span className="text-[13px] font-medium leading-snug text-[#14161C] mt-0.5">
                        {timeLabel[k]}
                      </span>
                      <span className="text-[12px] small:text-[13px] leading-snug text-gray-500 mt-0.5">
                        {noteLabel[k]}
                      </span>
                    </span>
                    <span className="flex items-center gap-x-2 self-center">
                      {isSelected && isLoading && (
                        <Spinner className="animate-spin text-ui-fg-muted" />
                      )}
                      {priceNode(option)}
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
            className="mt-2 w-full small:w-auto"
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
              <div className="flex flex-col">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Leveranssätt
                </Text>
                <Text className="txt-medium text-ui-fg-subtle">
                  {titleOf(
                    kindOf(selectedShippingMethod?.name),
                    selectedShippingMethod?.name
                  )}
                  {", "}
                  {(selectedShippingMethod?.amount == null || Number.isNaN(Number(selectedShippingMethod?.amount)))
                    ? "29 kr"
                    : Number(selectedShippingMethod?.amount) === 0
                    ? kindOf(selectedShippingMethod?.name) === "butik"
                      ? "gratis"
                      : "fri frakt"
                    : convertToLocale({
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
