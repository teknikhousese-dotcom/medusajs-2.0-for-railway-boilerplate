import Product from "../product-preview"
import { getRegion } from "@lib/data/regions"
import { getProductsList } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

/**
 * Related products for teknikhouse. Most of our imported products have no
 * collection/tags, so the stock Medusa logic left this section empty. We now
 * try the product's own category first, then collection, then tags, and finally
 * fall back to newest products — so the rail is never blank and always sells.
 */
export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)
  if (!region) {
    return null
  }

  const fetchWith = async (
    params: Partial<HttpTypes.StoreProductListParams>
  ): Promise<HttpTypes.StoreProduct[]> => {
    try {
      const { response } = await getProductsList({
        queryParams: { ...params, region_id: region.id, limit: 12 } as any,
        countryCode,
      })
      return (response.products || []).filter((p) => p.id !== product.id)
    } catch {
      return []
    }
  }

  let products: HttpTypes.StoreProduct[] = []

  // 1) Same category — the best match for our catalog.
  const categoryIds =
    (product.categories?.map((c) => c.id).filter(Boolean) as string[]) || []
  if (categoryIds.length) {
    products = await fetchWith({ category_id: categoryIds } as any)
  }

  // 2) Fallback: same collection.
  if (products.length === 0 && product.collection_id) {
    products = await fetchWith({ collection_id: [product.collection_id] })
  }

  // 3) Fallback: shared tags.
  if (products.length === 0) {
    const tagIds = product.tags?.map((t) => t.id).filter(Boolean) as
      | string[]
      | undefined
    if (tagIds?.length) {
      products = await fetchWith({ tag_id: tagIds } as any)
    }
  }

  // 4) Last resort: newest products, so the section is never empty.
  if (products.length === 0) {
    products = await fetchWith({})
  }

  products = products.slice(0, 5)

  if (!products.length) {
    return null
  }

  return (
    <div className="product-page-constraint">
      <div className="mb-5 flex flex-col items-start small:mb-8 small:items-center small:text-center">
        <span className="mb-1 text-sm text-gray-600">Fler produkter</span>
        <h2
          style={{
            fontFamily: '"Poppins",ui-rounded,system-ui,sans-serif',
            fontWeight: 600,
            fontSize: "clamp(19px, 5vw, 22px)",
            color: "#1b1714",
            margin: 0,
          }}
        >
          Relaterade produkter
        </h2>
      </div>

      {/* Phones and tablets: a swipeable rail. Desktop: a five column grid. */}
      <ul
        className="-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden small:mx-0 small:grid small:grid-cols-5 small:gap-5 small:overflow-visible small:px-0 small:pb-0"
        data-testid="related-products-list"
      >
        {products.map((p) => (
          <li
            key={p.id}
            className="w-[44%] min-w-[150px] max-w-[220px] shrink-0 snap-start small:w-auto small:min-w-0 small:max-w-none"
          >
            <Product region={region} product={p} />
          </li>
        ))}
      </ul>
    </div>
  )
}
