import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import { getCacheDirectives } from "./cookies"

type Cat = HttpTypes.StoreProductCategory

/**
 * Category data for navigation, breadcrumbs and URL building.
 *
 * The full category list with description and metadata is about 2 MB: every
 * category carries SEO texts, banner texts and an HTML description2. That was
 * fetched on every render (too big for the Next data cache, which caps entries
 * at 2 MB) and then handed to the mega-menu and the side drawer, so every page
 * shipped the whole thing in its RSC payload.
 *
 * So the tree is fetched slim: only the columns navigation needs. Metadata is
 * fetched separately for the few categories that actually need it (the
 * top-level departments, and the subcategory tiles on a category page), and
 * only whitelisted keys are kept. A category page still loads its own full
 * record, description included, through getCategoryByHandle.
 */
const NAV_FIELDS = "id,name,handle,rank,parent_category_id"

// Metadata keys the menus read on departments. Anything else stays server-side.
export const MENU_META_KEYS = ["startpage_dropdown", "icon", "hide_in_menu"]

// Categories drive the menu order (by rank). Refresh every 10 min so
// reordering in the admin shows up without a redeploy.
const NAV_CACHE = {
  cache: "force-cache" as const,
  next: { tags: ["categories"], revalidate: 600 },
}

const pick = (meta: unknown, keys: string[]): Record<string, unknown> | null => {
  if (!meta || typeof meta !== "object") return null
  const out: Record<string, unknown> = {}
  for (const k of keys) {
    const v = (meta as Record<string, unknown>)[k]
    if (v !== undefined && v !== null && v !== "") out[k] = v
  }
  return Object.keys(out).length ? out : null
}

/**
 * Whitelisted metadata for a set of category ids, as id -> metadata subset.
 * Ids are sorted and fetched in chunks so the cache key is stable and the URL
 * stays short. Never throws: a failure just means no metadata.
 */
export const listCategoryMetadata = cache(async function (
  ids: string[],
  keys: string[]
): Promise<Map<string, Record<string, unknown>>> {
  const out = new Map<string, Record<string, unknown>>()
  const sorted = Array.from(new Set(ids.filter(Boolean))).sort()
  const CHUNK = 100
  for (let i = 0; i < sorted.length; i += CHUNK) {
    const chunk = sorted.slice(i, i + CHUNK)
    try {
      const { product_categories } =
        await sdk.client.fetch<HttpTypes.StoreProductCategoryListResponse>(
          "/store/product-categories",
          {
            method: "GET",
            query: { id: chunk, fields: "id,metadata", limit: chunk.length },
            ...NAV_CACHE,
          }
        )
      for (const c of product_categories || []) {
        const m = pick(c.metadata, keys)
        if (m) out.set(c.id, m)
      }
    } catch {
      // Menus and tiles degrade gracefully without metadata.
    }
  }
  return out
})

/**
 * The whole category tree, slim: id, name, handle, rank, parent_category_id,
 * plus MENU_META_KEYS metadata on top-level departments (the mega-menu reads
 * metadata.startpage_dropdown). Safe to pass to client components.
 */
export const listCategories = cache(async function (): Promise<Cat[]> {
  const { product_categories } =
    await sdk.client.fetch<HttpTypes.StoreProductCategoryListResponse>(
      "/store/product-categories",
      {
        method: "GET",
        query: { fields: NAV_FIELDS, limit: 1000 },
        ...NAV_CACHE,
      }
    )
  const cats = product_categories || []
  const topIds = cats.filter((c) => !c.parent_category_id).map((c) => c.id)
  const meta = await listCategoryMetadata(topIds, MENU_META_KEYS)
  return cats.map((c) => {
    const m = meta.get(c.id)
    return (m ? { ...c, metadata: m } : c) as Cat
  })
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
