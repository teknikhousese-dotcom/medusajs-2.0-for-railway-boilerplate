import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import { getRegion } from "./regions"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { sortProducts } from "@lib/util/sort-products"
import { getCacheDirectives } from "./cookies"

// See the note in regions.ts for why these are client.fetch calls rather than
// the sdk.store.* helpers.
export const getProductsById = cache(async function ({
  ids,
  regionId,
}: {
  ids: string[]
  regionId: string
}) {
  return sdk.client
    .fetch<HttpTypes.StoreProductListResponse>("/store/products", {
      method: "GET",
      query: {
        id: ids,
        region_id: regionId,
        fields: "*variants.calculated_price,+variants.inventory_quantity",
      },
      ...(await getCacheDirectives("products")),
    })
    .then(({ products }) => products)
})

export const getProductByHandle = cache(async function (
  handle: string,
  regionId: string
) {
  return sdk.client
    .fetch<HttpTypes.StoreProductListResponse>("/store/products", {
      method: "GET",
      query: {
        handle,
        region_id: regionId,
        fields: "*variants.calculated_price,+variants.inventory_quantity",
      },
      ...(await getCacheDirectives("products")),
    })
    .then(({ products }) => products[0])
})

export const getProductsList = cache(async function ({
  pageParam = 1,
  queryParams,
  countryCode,
}: {
  pageParam?: number
  queryParams?: HttpTypes.StoreProductListParams
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.StoreProductListParams
}> {
  const limit = queryParams?.limit || 12
  const validPageParam = Math.max(pageParam, 1);
  const offset = (validPageParam - 1) * limit
  const region = await getRegion(countryCode)

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }
  return sdk.client
    .fetch<HttpTypes.StoreProductListResponse>("/store/products", {
      method: "GET",
      query: {
        limit,
        offset,
        region_id: region.id,
        fields: "*variants.calculated_price,+categories.handle,+categories.parent_category_id,+categories.id",
        ...queryParams,
      },
      ...(await getCacheDirectives("products")),
    })
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
})

/**
 * Fetch up to 100 products, sort by sortBy, then paginate.
 *
 * Price sorting note: sortProducts orders by variant.calculated_price. The Store
 * API only populates calculated_price when region_id is present, and the cached
 * (force-cache) category list can be served as a stale/variant-less entry, which
 * makes price sort a silent no-op. So for price sorts we fetch the set fresh
 * (no-store) with region_id so prices always resolve, then sort.
 */
export const getProductsListWithSort = cache(async function ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
}: {
  page?: number
  queryParams?: HttpTypes.StoreProductListParams
  sortBy?: SortOptions
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.StoreProductListParams
}> {
  const limit = queryParams?.limit || 12
  const isPriceSort = sortBy === "price_asc" || sortBy === "price_desc"

  let products: HttpTypes.StoreProduct[] = []
  let count = 0

  const region = isPriceSort ? await getRegion(countryCode) : null

  if (isPriceSort && region) {
    const res = await sdk.client.fetch<HttpTypes.StoreProductListResponse>(
      "/store/products",
      {
        method: "GET",
        query: {
          ...queryParams,
          limit: 100,
          offset: 0,
          region_id: region.id,
          fields:
            "*variants.calculated_price,+categories.handle,+categories.parent_category_id,+categories.id",
        },
        cache: "no-store",
      } as any
    )
    products = res.products || []
    count = res.count || 0

    // The category list fetch does not always resolve calculated_price via the
    // SDK even with region_id, but the single-id product fetch reliably does
    // (the same call ProductPreview uses to render each price). Resolve prices
    // through it so the sort has real amounts to order by.
    try {
      const ids = products.map((p) => p.id!).filter(Boolean)
      const pricedById = new Map<string, HttpTypes.StoreProduct>()
      const CONCURRENCY = 6
      for (let i = 0; i < ids.length; i += CONCURRENCY) {
        const batch = ids.slice(i, i + CONCURRENCY)
        const chunk = await Promise.all(
          batch.map((id) =>
            getProductsById({ ids: [id], regionId: region.id }).catch(
              () => [] as HttpTypes.StoreProduct[]
            )
          )
        )
        for (const arr of chunk) {
          const pr = arr?.[0]
          if (pr?.id) pricedById.set(pr.id, pr)
        }
      }
      products = products.map((p) => {
        const pr = pricedById.get(p.id!)
        return pr ? { ...p, variants: pr.variants } : p
      })
    } catch {}
  } else {
    const listed = await getProductsList({
      pageParam: 0,
      queryParams: {
        ...queryParams,
        limit: 100,
      },
      countryCode,
    })
    products = listed.response.products
    count = listed.response.count
  }

  const sortedProducts = sortProducts(products, sortBy)

  const pageParam = (page - 1) * limit

  const nextPage = count > pageParam + limit ? pageParam + limit : null

  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage,
    queryParams,
  }
})
