type Cat = { id: string; handle?: string | null; parent_category_id?: string | null }

// Build "category handle -> teknikhouse path" (e.g. mobilreservdelar/apple/iphone-8)
// from the flat category list by walking real parent links. Exact (no guessing).
export function buildCategoryPathMap(categories: Cat[]): Map<string, string> {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const memo = new Map<string, string>()
  const seg = (c: Cat) => {
    const p = c.parent_category_id ? byId.get(c.parent_category_id) : null
    return p && p.handle && c.handle ? c.handle.slice(p.handle.length + 1) : c.handle || ""
  }
  const path = (c: Cat): string => {
    if (memo.has(c.id)) return memo.get(c.id)!
    const p = c.parent_category_id ? byId.get(c.parent_category_id) : null
    const r = p ? path(p) + "/" + seg(c) : seg(c)
    memo.set(c.id, r)
    return r
  }
  const m = new Map<string, string>()
  for (const c of categories) if (c.handle) m.set(c.handle, path(c))
  return m
}

type WithCats = {
  handle?: string | null
  categories?: { handle?: string | null }[] | null
}

// Clean teknikhouse product URL: /<deepest-category-path>/<handle>.
export function productHref(product: WithCats | null | undefined, map: Map<string, string>): string {
  const handle = product?.handle
  if (!handle) return "/store"
  let best = ""
  for (const c of product?.categories || []) {
    const p = c?.handle ? map.get(c.handle) : undefined
    if (p && p.length > best.length) best = p
  }
  return best ? "/" + best + "/" + handle : "/products/" + handle
}
