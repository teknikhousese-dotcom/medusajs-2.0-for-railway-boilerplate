import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import { getCacheDirectives } from "./cookies"

// listCategories returns the full category set (up to 1000) with the fields the
// header mega-menu needs to build the department → brand → model tree, while
// keeping category_children for any other consumer.
export const listCategories = cache(async function () {
  return sdk.client
    .fetch<HttpTypes.StoreProductCategoryListResponse>(
      "/store/product-categories",
      {
        method: "GET",
        query: {
          fields: "id,name,handle,rank,parent_category_id,+category_children",
          limit: 1000,
        },
        ...(await getCacheDirectives("categories")),
      }
    )
    .then(({ product_categories }) => product_categories)
})

export const getCategoriesList = cache(async function (
  offset: number = 0,
  limit: number = 100
) {
  return sdk.client.fetch<HttpTypes.StoreProductCategoryListResponse>(
    "/store/product-categories",
    {
      method: "GET",
      query: { limit, offset },
      ...(await getCacheDirectives("categories")),
    }
  )
})

export const getCategoryByHandle = cache(async function (
  categoryHandle: string[]
) {
  return sdk.client.fetch<HttpTypes.StoreProductCategoryListResponse>(
    "/store/product-categories",
    {
      method: "GET",
      query: { handle: categoryHandle },
      ...(await getCacheDirectives("categories")),
    }
  )
})
