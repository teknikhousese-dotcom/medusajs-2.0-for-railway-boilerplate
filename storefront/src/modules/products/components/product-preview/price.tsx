import { VariantPrice } from "types/global"

/* Card price: sale price in red with the old price struck through next to it.
   The old price only shows when it is actually higher, so no "0 kr" savings. */
export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  const p: any = price
  const onSale =
    price.price_type === "sale" &&
    Number(p.original_price_number || 0) > Number(p.calculated_price_number || 0)

  return (
    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0 leading-tight">
      <span
        className={
          "whitespace-nowrap text-[15px] small:text-base font-semibold " +
          (onSale ? "text-[#D10000]" : "text-ui-fg-base")
        }
        data-testid="price"
      >
        {price.calculated_price}
      </span>
      {onSale && (
        <span
          className="whitespace-nowrap text-[11.5px] small:text-xs text-ui-fg-muted line-through"
          data-testid="original-price"
        >
          {price.original_price}
        </span>
      )}
    </div>
  )
}
