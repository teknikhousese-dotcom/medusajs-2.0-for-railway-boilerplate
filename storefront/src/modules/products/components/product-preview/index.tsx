import { getProductPrice } from "@lib/util/get-product-price"
import Image from "next/image"
import PreviewPrice from "./price"
import { getProductsById } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import Link from "next/link"
import { listCategories } from "@lib/data/categories"
import { buildCategoryPathMap, productHref } from "@lib/util/teknik-url"

// teknikhouse stock snapshot lives in metadata.in_stock (false = slut).
const isOutOfStock = (product: HttpTypes.StoreProduct) => {
  const v = (product?.metadata as Record<string, any> | undefined)?.in_stock
  return v === false || v === "false" || v === 0 || v === "0"
}

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const [pricedProduct] = await getProductsById({
    ids: [product.id!],
    regionId: region.id,
  })

  if (!pricedProduct) {
    return null
  }

  const { cheapestPrice } = getProductPrice({
    product: pricedProduct,
  })

  const brand = (product as any)?.brand || product.collection?.title
  const oos = isOutOfStock(pricedProduct) || isOutOfStock(product)

  // "Spara X kr": real savings from the campaign price (honest purchase driver)
  const onSale = (cheapestPrice as any)?.price_type === "sale"
  const savings = onSale
    ? Math.round(
        ((cheapestPrice as any).original_price_number || 0) -
          ((cheapestPrice as any).calculated_price_number || 0)
      )
    : 0

  const img = product.thumbnail || (product.images && product.images[0]?.url) || null

  const _catPathMap = buildCategoryPathMap((await listCategories().catch(() => [])) as any)
  const _href = productHref(product as any, _catPathMap)

  return (
    <Link href={_href} className="group block h-full" data-testid="product-wrapper">
      <div className="flex h-full flex-col overflow-hidden rounded-xl small:rounded-2xl border border-ui-border-base bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-ui-border-strong">
        <div className="relative aspect-square overflow-hidden bg-white">
          {onSale && savings > 0 && (
            <span className="absolute left-2 top-2 z-10 rounded-md bg-red-600 px-1.5 py-0.5 small:px-2 small:py-1 text-[10.5px] small:text-[11px] font-semibold leading-tight text-white shadow-sm">
              Spara {savings.toLocaleString("sv-SE")} kr
            </span>
          )}
          {img ? (
            <Image
              src={img}
              alt={product.title || "Produktbild"}
              fill
              quality={60}
              draggable={false}
              sizes="(max-width: 767px) 50vw, (max-width: 1279px) 33vw, (max-width: 1439px) 25vw, 280px"
              className="object-contain p-3 small:p-4 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-ui-bg-subtle text-ui-fg-muted text-xs">
              Bild saknas
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-y-1 border-t border-ui-border-base p-3 small:gap-y-1.5 small:p-4">
          {brand && (
            <span className="truncate text-[10.5px] small:text-[11px] font-medium uppercase tracking-wide text-ui-fg-muted">
              {brand}
            </span>
          )}
          <h3
            className="line-clamp-2 min-h-[2.5em] break-words text-[13px] small:text-sm font-medium leading-[1.25] text-ui-fg-base"
            title={product.title || undefined}
            data-testid="product-title"
          >
            {product.title}
          </h3>
          <span className="flex items-center gap-x-1.5 text-[11.5px] small:text-xs text-ui-fg-subtle">
            <span
              aria-hidden
              className={`inline-block h-2 w-2 shrink-0 rounded-full ${oos ? "bg-gray-400" : "bg-green-500"}`}
            />
            {oos ? "Slut i lager" : "I lager"}
          </span>
          <div className="mt-auto flex items-end justify-between gap-x-2 pt-1.5 small:pt-2">
            <div className="flex min-w-0 flex-col">
              {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
            </div>
            <span
              aria-hidden
              className="flex h-8 w-8 small:h-9 small:w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white transition-colors group-hover:bg-red-600"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
