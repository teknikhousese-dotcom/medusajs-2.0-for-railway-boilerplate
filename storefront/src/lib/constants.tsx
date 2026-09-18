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

// Swish — swirl mark + magenta wordmark
const SwishLogo = (
  <svg width="72" height="26" viewBox="0 0 72 26" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Swish">
    <path d="M8 8.5c-3.6-1-6.5 1-6.5 4 0 2.2 1.8 3.6 4.2 3.6" fill="none" stroke="#DD0074" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M13.5 17c3.6 1 6.5-1 6.5-4 0-2.2-1.8-3.6-4.2-3.6" fill="none" stroke="#7A2E8E" strokeWidth="2.6" strokeLinecap="round" />
    <text x="26" y="18" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" fontSize="15" fontWeight="700" fill="#DD0074">Swish</text>
  </svg>
)

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
