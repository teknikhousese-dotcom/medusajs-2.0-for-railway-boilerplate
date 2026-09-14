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
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
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

  // Category-filtered list fetches don't always resolve calculated_price,
  // which makes price sorting a no-op. Re-fetch priced versions in one call so
  // the sort has real prices to work with (getProductsById is cached).
  let productsToSort = products
  if ((sortBy === "price_asc" || sortBy === "price_desc") && products.length) {
    const region = await getRegion(countryCode)
    if (region) {
      // Batch/category product fetches don't reliably resolve calculated_price
      // (Medusa computes prices for only a limited number of products per call),
      // so price sorting becomes a no-op. Fetch prices in small chunks (fresh),
      // which resolve reliably, then merge them in before sorting.
      try {
        const ids = products.map((p) => p.id!).filter(Boolean)
        const CHUNK = 20
        const pricedById = new Map<string, any>()
        for (let i = 0; i < ids.length; i += CHUNK) {
          const slice = ids.slice(i, i + CHUNK)
          const res: any = await sdk.client.fetch("/store/products", {
            method: "GET",
            query: {
              id: slice,
              limit: slice.length,
              region_id: region.id,
              fields: "id,*variants.calculated_price",
            },
            cache: "no-store",
          } as any)
          for (const pr of res?.products || []) pricedById.set(pr.id, pr)
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
