import { Text } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import { getProductsById } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import Link from "next/link"
import { listCategories } from "@lib/data/categories"
import { buildCategoryPathMap, productHref } from "@lib/util/teknik-url"

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

  const _catPathMap = buildCategoryPathMap((await listCategories().catch(() => [])) as any)
  const _href = productHref(product as any, _catPathMap)

  return (
    <Link href={_href} className="group block h-full" data-testid="product-wrapper">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-ui-border-base bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-ui-border-strong">
        <div className="relative aspect-square overflow-hidden bg-ui-bg-subtle">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
            className="!rounded-none !shadow-none h-full w-full transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-1 flex-col gap-y-1.5 p-4">
          {brand && (
            <span className="text-[11px] font-medium uppercase tracking-wide text-ui-fg-muted">
              {brand}
            </span>
          )}
          <Text
            className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-ui-fg-base"
            data-testid="product-title"
          >
            {product.title}
          </Text>
          <div className="mt-auto flex items-end justify-between pt-2">
            <div className="flex flex-col text-ui-fg-base">
              {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
            </div>
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-lg font-light leading-none text-white transition-colors group-hover:bg-red-600"
            >
              +
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
