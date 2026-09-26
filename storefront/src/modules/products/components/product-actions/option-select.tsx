import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
}) => {
  const filteredOptions = option.values?.map((v) => v.value)
  const label = /^(valalternativ|alternativ|default.*|option|title)$/i.test(title.trim())
    ? "alternativ"
    : title.toLowerCase()

  return (
    <div className="flex flex-col gap-y-2.5">
      <span className="text-sm font-semibold text-ui-fg-base">
        Välj {label}
        {current ? <span className="font-normal text-ui-fg-subtle">: {current}</span> : null}
      </span>
      <div className="flex flex-wrap gap-2" data-testid={dataTestId}>
        {filteredOptions?.map((v) => {
          const on = v === current
          return (
            <button
              type="button"
              onClick={() => updateOption(option.title ?? "", v ?? "")}
              key={v}
              aria-pressed={on}
              className={clx(
                "min-h-[44px] grow basis-[calc(50%-4px)] min-[512px]:basis-auto rounded-xl border px-3.5 py-2 text-left text-[13.5px] leading-snug break-words transition-colors",
                on
                  ? "border-[#F50000] bg-[#fff5f5] font-semibold text-ui-fg-base ring-2 ring-[#F50000]/15"
                  : "border-ui-border-base bg-white text-ui-fg-base hover:border-ui-border-strong"
              )}
              disabled={disabled}
              data-testid="option-button"
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
