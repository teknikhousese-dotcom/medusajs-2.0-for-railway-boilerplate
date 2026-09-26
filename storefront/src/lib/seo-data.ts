import "server-only"

import { listCategories } from "@lib/data/categories"
import { buildCategoryPathMap, productHref } from "@lib/util/teknik-url"
import { Crumb, ReviewData, categoryChain } from "@lib/seo"

const BACKEND = (
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  ""
).replace(/\/+$/, "")
const PUBKEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

type Cat = { id: string; name?: string | null; handle?: string | null; parent_category_id?: string | null }

/** Category list + handle -> clean path map, shared by product and category pages. */
export const categoryPaths = async () => {
  const categories = ((await listCategories().catch(() => [])) || []) as unknown as Cat[]
  const pathMap = buildCategoryPathMap(categories as any)
  return { categories, pathMap }
}

/** Crumbs Hem > dept > brand > model for a category handle. */
export const categoryCrumbs = (
  categories: Cat[],
  pathMap: Map<string, string>,
  handle?: string | null
): Crumb[] => {
  const chain = categoryChain(categories, handle)
  return [
    { name: "Hem", path: "/" },
    ...chain
      .filter((c) => c.handle && pathMap.get(c.handle))
      .map((c) => ({ name: String(c.name || c.handle), path: `/${pathMap.get(c.handle as string)}` })),
  ]
}

const productCategoryHandles = async (handle: string): Promise<{ handle?: string | null }[]> => {
  if (!BACKEND) return []
  try {
    const res = await fetch(
      `${BACKEND}/store/products?handle=${encodeURIComponent(handle)}&fields=id,categories.handle`,
      { headers: { "x-publishable-api-key": PUBKEY }, next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data?.products?.[0]?.categories || []
  } catch {
    return []
  }
}

/** Canonical path and breadcrumb trail for a product, as the site links it. */
export const productSeoContext = async (product: any) => {
  const { categories, pathMap } = await categoryPaths()
  const cats = Array.isArray(product?.categories) && product.categories.length
    ? product.categories
    : await productCategoryHandles(product?.handle || "")
  const path = productHref({ handle: product?.handle, metadata: product?.metadata, categories: cats }, pathMap)

  const catPath = path.slice(1, path.lastIndexOf("/"))
  let catHandle: string | undefined
  if (catPath && catPath !== "products") {
    pathMap.forEach((p, h) => {
      if (!catHandle && p === catPath) catHandle = h
    })
  }
  const crumbs: Crumb[] = [
    ...categoryCrumbs(categories, pathMap, catHandle),
    { name: String(product?.title || ""), path },
  ]
  return { path, crumbs }
}

/** Real reviews only (same endpoint and cache as the product-reviews component). */
export const productReviews = async (productId: string): Promise<ReviewData | null> => {
  if (!BACKEND || !productId) return null
  try {
    const res = await fetch(BACKEND + "/product-reviews?product_id=" + encodeURIComponent(productId), {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data && data.count ? (data as ReviewData) : null
  } catch {
    return null
  }
}
