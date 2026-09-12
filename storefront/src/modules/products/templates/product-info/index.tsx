import { HttpTypes } from "@medusajs/types"
import RecordView from "@modules/home/components/th-home/record-view"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

// teknikhouse stock snapshot lives in metadata.in_stock (false = slut).
const isOutOfStock = (p: any) => {
  const v = p?.metadata?.in_stock
  return v === false || v === "false" || v === 0 || v === "0"
}

// Header block of the buy column: brand + stock + Trustpilot row, the product
// title, and (when we actually have them) artikelnr / EAN. Kept generic so it
// works for every category — no spare-part-specific wording. The full
// description lives in the Produktinformation tab (ProductTabs).
const ProductInfo = ({ product }: ProductInfoProps) => {
  const oos = isOutOfStock(product)
  const brand =
    (product as any)?.brand ||
    product.collection?.title ||
    (product.metadata as any)?.brand ||
    (product.metadata as any)?.marke
  const v0: any = product.variants?.[0]
  const sku = v0?.sku || (product.metadata as any)?.sku || (product.metadata as any)?.artikelnr
  const ean =
    v0?.barcode ||
    (product.metadata as any)?.ean ||
    (product.metadata as any)?.gtin ||
    (product.metadata as any)?.barcode

  return (
    <div id="product-info">
      <RecordView id={product.id} title={product.title} thumbnail={product.thumbnail} />
      <div className="flex flex-col gap-y-2.5">
        <div className="flex items-center gap-x-3 flex-wrap">
          {brand && (
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ui-fg-muted">
              {brand}
            </span>
          )}
          <span
            className="inline-flex items-center gap-x-1.5 text-xs font-semibold"
            style={{ color: oos ? "#9ca3af" : "#1a9d55" }}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: oos ? "#9ca3af" : "#1a9d55" }}
            />
            {oos ? "Slut i lager" : "I lager"}
          </span>
          <span className="ml-auto inline-flex items-center gap-x-1.5 text-xs text-ui-fg-subtle">
            <span style={{ color: "#FFB020" }}>★</span> Trustpilot 4,9
          </span>
        </div>

        <h1
          className="text-2xl leading-8 font-semibold text-ui-fg-base"
          data-testid="product-title"
          style={{ fontFamily: '"Poppins",ui-rounded,system-ui,sans-serif', letterSpacing: "-0.01em" }}
        >
          {product.title}
        </h1>

        {(sku || ean) && (
          <div className="text-[11px] text-ui-fg-muted">
            {sku && (
              <>
                Artikelnr: <span className="text-ui-fg-subtle">{sku}</span>
              </>
            )}
            {sku && ean && " · "}
            {ean && (
              <>
                EAN: <span className="text-ui-fg-subtle">{ean}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductInfo
