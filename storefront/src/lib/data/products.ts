import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import { getRegion } from "./regions"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { sortProducts } from "@lib/util/sort-products"
import { getCacheTag } from "./cookies"

// See the note in regions.ts for why these are client.fetch calls rather than
// the sdk.store.* helpers.

/*
 * Product reads are cached for everyone for a short while.
 *
 * They used to go through getCacheDirectives, which caches per visitor and
 * never expires, and caches nothing at all for a visitor without a cache id
 * (first page view, crawlers). So a cold visitor fetched every product card
 * from Medusa one by one, and a warm one could keep an old price or stock
 * status until the next deploy.
 *
 * Now every read has a lifetime: 60 s on the product page, where price and
 * stock must be current, and 5 min for cards and lists. The shared "products"
 * tag can purge everything at once, and the visitor tag is kept so existing
 * per-visitor revalidation still reaches these entries.
 */
const PDP_SECONDS = 60
const LIST_SECONDS = 300

const productCache = async (seconds: number) => {
  const visitor = await getCacheTag("products")
  return {
    cache: "force-cache" as const,
    next: {
      revalidate: seconds,
      tags: visitor ? ["products", visitor] : ["products"],
    },
  }
}
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
        fields: "*variants.calculated_price,+variants.inventory_quantity,+metadata",
      },
      ...(await productCache(LIST_SECONDS)),
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
        fields: "*variants.calculated_price,+variants.inventory_quantity,+metadata",
      },
      ...(await productCache(PDP_SECONDS)),
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
        fields: "*variants.calculated_price,+categories.handle,+categories.parent_category_id,+categories.id,+metadata",
        ...queryParams,
      },
      ...(await productCache(LIST_SECONDS)),
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
  sortBy = "recommended",
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

  const region = await getRegion(countryCode)

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
      queryParams,
    }
  }

  // Cached for LIST_SECONDS like the other list reads. The sort order is
  // part of the query, and so of the cache key, so every order gets its own
  // entry and a cached default order is never served for another sort.
  // sortProducts then applies the price ordering the Store API cannot do
  // server-side.
  const { products, count } =
    await sdk.client.fetch<HttpTypes.StoreProductListResponse>("/store/products", {
      method: "GET",
      query: {
        ...queryParams,
        limit: 200,
        offset: 0,
        region_id: region.id,
        fields:
          "*variants.calculated_price,+categories.handle,+categories.parent_category_id,+categories.id,+metadata",
      },
      ...(await productCache(LIST_SECONDS)),
    } as any)

  const sortedProducts = sortProducts(products || [], sortBy)

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
