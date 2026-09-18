import React from "react"
import { CreditCard } from "@medusajs/icons"

import Ideal from "@modules/common/icons/ideal"
import Bancontact from "@modules/common/icons/bancontact"
import PayPal from "@modules/common/icons/paypal"

const badge = (
  label: string,
  bg: string,
  color: string,
  border?: string
): React.JSX.Element => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      backgroundColor: bg,
      color,
      border: border ? `1px solid ${border}` : "none",
      padding: "4px 10px",
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: "0.01em",
    }}
  >
    {label}
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
    icon: badge("Klarna", "#FFB3C7", "#0A0B09"),
  },
  pp_swish_swish: {
    title: "Swish",
    icon: badge("Swish", "#4D2683", "#FFFFFF"),
  },
  pp_system_default: {
    title: "Faktura",
    icon: badge("Faktura", "#F9FAFB", "#374151", "#D1D5DB"),
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
