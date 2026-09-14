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
 * Fetch up to 100 products, sort them by the sortBy parameter, then paginate.
 *
 * Note on price sorting: a category-filtered list fetch from the Store API does
 * not reliably resolve variant.calculated_price (the amounts come back null),
 * so sortProducts sees _minPrice = 0 for every product and price sort becomes a
 * no-op. The single-id product fetch (getProductsById) DOES resolve prices
 * reliably — it is the same path ProductPreview uses to render each card's
 * price. So for price sorts we warm each product's price through that proven
 * path (concurrency-limited) before sorting. Because getProductsById is
 * React-cache() memoized, ProductPreview then reuses these exact results, so
 * this adds almost no real network cost.
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

  const {
    response: { products, count },
  } = await getProductsList({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: 100,
    },
    countryCode,
  })

  let productsToSort = products
  if ((sortBy === "price_asc" || sortBy === "price_desc") && products.length) {
    const region = await getRegion(countryCode)
    if (region) {
      try {
        const ids = products.map((p) => p.id!).filter(Boolean)
        const pricedById = new Map<string, HttpTypes.StoreProduct>()
        const CONCURRENCY = 8
        for (let i = 0; i < ids.length; i += CONCURRENCY) {
          const batch = ids.slice(i, i + CONCURRENCY)
          const results = await Promise.all(
            batch.map((id) =>
              getProductsById({ ids: [id], regionId: region.id }).catch(
                () => [] as HttpTypes.StoreProduct[]
              )
            )
          )
          for (const arr of results) {
            const pr = arr?.[0]
            if (pr?.id) pricedById.set(pr.id, pr)
          }
        }
        productsToSort = products.map((p) => {
          const pr = pricedById.get(p.id!)
          return pr ? { ...p, variants: pr.variants } : p
        })
      } catch {
        productsToSort = products
      }
    }
  }

  if (sortBy === "price_asc" || sortBy === "price_desc") {
    try {
      const _sample = (productsToSort as any[]).slice(0, 5).map((p) => ({
        id: String(p.id || "").slice(-6),
        v: (p.variants || []).map((v: any) => v?.calculated_price?.calculated_amount),
      }))
      const _resolved = (productsToSort as any[]).filter((p) =>
        (p.variants || []).some((v: any) => (v?.calculated_price?.calculated_amount || 0) > 0)
      ).length
      console.error(
        `[PRICESORT] n=${productsToSort.length} resolved=${_resolved} sample=` +
          JSON.stringify(_sample)
      )
    } catch (e) {
      console.error("[PRICESORT] dbg-error", e)
    }
  }

  const sortedProducts = sortProducts(productsToSort, sortBy)

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
