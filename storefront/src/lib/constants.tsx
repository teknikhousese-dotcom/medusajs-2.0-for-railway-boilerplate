import React from "react"
import { CreditCard } from "@medusajs/icons"

import Ideal from "@modules/common/icons/ideal"
import Bancontact from "@modules/common/icons/bancontact"
import PayPal from "@modules/common/icons/paypal"

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
    icon: (
      <span className="inline-flex items-center rounded-md bg-[#FFB3C7] px-2.5 py-1 text-[13px] font-bold leading-none text-[#0A0B09]">
        Klarna
      </span>
    ),
  },
  pp_swish_swish: {
    title: "Swish",
    icon: (
      <span className="inline-flex items-center rounded-md bg-[#4D2683] px-2.5 py-1 text-[13px] font-bold leading-none text-white">
        Swish
      </span>
    ),
  },
  pp_system_default: {
    title: "Faktura",
    icon: (
      <span className="inline-flex items-center rounded-md border border-gray-300 bg-gray-50 px-2.5 py-1 text-[13px] font-semibold leading-none text-gray-700">
        Faktura
      </span>
    ),
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
