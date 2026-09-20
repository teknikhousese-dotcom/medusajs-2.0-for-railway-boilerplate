import React from "react"
import { CreditCard } from "@medusajs/icons"

import Ideal from "@modules/common/icons/ideal"
import Bancontact from "@modules/common/icons/bancontact"
import PayPal from "@modules/common/icons/paypal"

// Klarna — official pink badge wordmark
const KlarnaLogo = (
  <svg width="56" height="26" viewBox="0 0 56 26" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Klarna">
    <rect width="56" height="26" rx="6" fill="#FFB3C7" />
    <text x="28" y="18" textAnchor="middle" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" fontSize="14" fontWeight="700" fill="#17120F">Klarna</text>
  </svg>
)

// Swish — official brand asset (drop the real file at storefront/public/swish.svg).
// Falls back to a clean Swish wordmark in the brand colour until the asset is added.
const SwishMark = () => {
  const [err, setErr] = React.useState(false)
  if (err) {
    return (
      <span style={{ color: "#DD0074", fontWeight: 700, fontSize: "15px", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
        Swish
      </span>
    )
  }
  return (
    <img src="/swish.svg" alt="Swish" height={24} style={{ objectFit: "contain", display: "block" }} onError={() => setErr(true)} />
  )
}
const SwishLogo = <SwishMark />

const FakturaLogo = (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      backgroundColor: "#F9FAFB",
      color: "#374151",
      border: "1px solid #D1D5DB",
      padding: "4px 10px",
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: 700,
      lineHeight: 1,
    }}
  >
    Faktura
  </span>
)

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  pp_stripe_stripe: {
    title: "Kortbetalning",
    icon: <CreditCard />,
  },
  "pp_stripe-ideal_stripe": {
    title: "iDeal",
    icon: <Ideal />,
  },
  "pp_stripe-bancontact_stripe": {
    title: "Bancontact",
    icon: <Bancontact />,
  },
  pp_paypal_paypal: {
    title: "PayPal",
    icon: <PayPal />,
  },
  pp_klarna_klarna: {
    title: "Klarna",
    icon: KlarnaLogo,
  },
  pp_swish_swish: {
    title: "Swish",
    icon: SwishLogo,
  },
  pp_system_default: {
    title: "Faktura",
    icon: FakturaLogo,
  },
  // Add more payment providers here
}

// This only checks if it is native stripe for card payments, it ignores the other stripe-based providers
export const isStripe = (providerId?: string) => {
  return providerId?.startsWith("pp_stripe_")
}
export const isPaypal = (providerId?: string) => {
  return providerId?.startsWith("pp_paypal")
}
export const isManual = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default")
}
export const isSwish = (providerId?: string) => {
  return providerId?.startsWith("pp_swish")
}

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]
