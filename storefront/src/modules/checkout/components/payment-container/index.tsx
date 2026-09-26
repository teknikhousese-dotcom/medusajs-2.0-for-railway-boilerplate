import { RadioGroup } from "@headlessui/react"
import { Text, clx } from "@medusajs/ui"
import React from "react"

import Radio from "@modules/common/components/radio"

import PaymentTest from "../payment-test"
import { isManual } from "@lib/constants"

type PaymentContainerProps = {
  paymentProviderId: string
  selectedPaymentOptionId: string | null
  disabled?: boolean
  paymentInfoMap: Record<string, { title: string; icon: JSX.Element }>
}

const subtitleMap: Record<string, string> = {
  pp_klarna_klarna: "Faktura, delbetalning eller kort via Klarna",
  pp_kustom_kustom: "Faktura, delbetalning eller kort via Klarna",
  pp_swish_swish: "Betala direkt i Swish-appen",
  pp_stripe_stripe: "Betala säkert med kort",
  pp_paypal_paypal: "Betala med ditt PayPal-konto",
  pp_system_default: "Betala mot faktura, 14 dagar",
}

const PaymentContainer: React.FC<PaymentContainerProps> = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
}) => {
  const isDevelopment = process.env.NODE_ENV === "development"
  const selected = selectedPaymentOptionId === paymentProviderId
  const subtitle = subtitleMap[paymentProviderId]

  return (
    <RadioGroup.Option
      key={paymentProviderId}
      value={paymentProviderId}
      disabled={disabled}
      className={clx(
        "flex items-center justify-between gap-x-3 cursor-pointer py-3.5 px-3.5 small:py-4 small:px-5 border rounded-2xl mb-3 transition-all duration-150",
        selected
          ? "border-[#F50000] bg-[#FFF5F5] ring-1 ring-[#F50000] shadow-[0_4px_14px_-6px_rgba(245,0,0,0.35)]"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
      )}
      data-testid="payment-option-radio"
      data-value={paymentProviderId}
    >
      <div className="flex items-center gap-x-3 small:gap-x-4 min-w-0">
        <Radio checked={selected} />
        <div className="flex flex-col min-w-0">
          <Text className="text-[15px] small:text-base font-semibold text-[#14161C] leading-snug">
            {paymentInfoMap[paymentProviderId]?.title || paymentProviderId}
          </Text>
          {subtitle && (
            <Text className="text-[13px] text-gray-500 leading-snug mt-0.5">
              {subtitle}
            </Text>
          )}
          {isManual(paymentProviderId) && isDevelopment && (
            <PaymentTest className="mt-1 text-[10px]" />
          )}
        </div>
      </div>
      <span className="flex items-center shrink-0">
        {paymentInfoMap[paymentProviderId]?.icon}
      </span>
    </RadioGroup.Option>
  )
}

export default PaymentContainer
