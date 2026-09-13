import { notFound } from "next/navigation"
import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { listCategories } from "@lib/data/categories"
import ReadMore from "@modules/categories/components/read-more"

type Cat = HttpTypes.StoreProductCategory

// leaf slug = a category's handle minus the parent handle prefix.
const leafSlug = (cat: Cat, byId: Record<string, Cat>) => {
  const parent = cat.parent_category_id ? byId[cat.parent_category_id] : null
  if (parent && cat.handle.startsWith(parent.handle + "-")) {
    return cat.handle.slice(parent.handle.length + 1)
  }
  return cat.handle
}

// full ancestor chain [root ... self]
const chainOf = (cat: Cat, byId: Record<string, Cat>): Cat[] => {
  const chain: Cat[] = []
  let x: Cat | null = cat
  const seen = new Set<string>()
  while (x && !seen.has(x.id)) {
    seen.add(x.id)
    chain.unshift(x)
    x = x.parent_category_id ? byId[x.parent_category_id] || null : null
  }
  return chain
}

// teknikhouse-style pretty slash URL for a category
const pathOf = (cat: Cat, byId: Record<string, Cat>) =>
  "/" + chainOf(cat, byId).map((c) => leafSlug(c, byId)).join("/")

const pretty = (s: string) =>
  decodeURIComponent(s).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

// If a child wrongly inherited its parent's name (an import glitch), derive a
// readable name from its own handle instead.
const displayName = (cat: Cat, byId: Record<string, Cat>) => {
  const parent = cat.parent_category_id ? byId[cat.parent_category_id] : null
  if (parent && cat.name === parent.name) return pretty(leafSlug(cat, byId))
  return cat.name
}

export default async function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
}: {
  category: Cat
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!category || !countryCode) notFound()

  const all = ((await listCategories()) || []) as Cat[]
  const byId: Record<string, Cat> = Object.fromEntries(all.map((c) => [c.id, c]))
  const childrenByParent = new Map<string | null, Cat[]>()
  for (const c of all) {
    const p = (c.parent_category_id as string) || null
    if (!childrenByParent.has(p)) childrenByParent.set(p, [])
    childrenByParent.get(p)!.push(c)
  }
  const rankSort = (a: Cat, b: Cat) =>
    ((a as any).rank ?? 0) - ((b as any).rank ?? 0) ||
    a.name.localeCompare(b.name, "sv")
  const kids = (id: string | null) =>
    (childrenByParent.get(id) || []).slice().sort(rankSort)

  const self = byId[category.id] || category
  const chain = chainOf(self, byId)
  const dept = chain[0]
  const children = kids(category.id)
  const hasChildren = children.length > 0
  const departments = kids(null)

  return (
    <div className="content-container py-6" data-testid="category-container">
      <div className="flex flex-col small:flex-row small:items-start gap-x-8">
        {/* Left sidebar — PRODUKTER category tree */}
        <aside className="hidden small:block small:w-[248px] small:flex-none">
          <div style={{ border: "1px solid #efeae5", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ background: "#faf8f6", padding: "12px 16px", fontFamily: '"Poppins",ui-rounded,system-ui,sans-serif', fontWeight: 600, fontSize: "12.5px", letterSpacing: ".05em", textTransform: "uppercase", color: "#6f685f", borderBottom: "1px solid #efeae5" }}>
              Produkter
            </div>
            <nav style={{ padding: "6px 0" }}>
              {departments.map((d) => {
                const active = !!dept && d.id === dept.id
                const deptKids = active ? kids(d.id) : []
                return (
                  <div key={d.id}>
                    <LocalizedClientLink
                      href={pathOf(d, byId)}
                      style={{ display: "block", padding: "9px 16px", fontSize: "14px", fontWeight: active ? 600 : 500, color: active ? "#1b1714" : "#4a4640", background: active ? "#fff" : "transparent" }}
                    >
                      {d.name}
                    </LocalizedClientLink>
                    {active && deptKids.length > 0 && (
                      <div style={{ paddingBottom: "6px" }}>
                        {deptKids.map((c) => {
                          const onPath = chain.some((x) => x.id === c.id)
                          return (
                            <LocalizedClientLink
                              key={c.id}
                              href={pathOf(c, byId)}
                              style={{ display: "block", padding: "7px 16px 7px 28px", fontSize: "13.5px", color: onPath ? "#F50000" : "#6f685f", fontWeight: onPath ? 600 : 400 }}
                            >
                              {displayName(c, byId)}
                            </LocalizedClientLink>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <div className="w-full">
          <nav aria-label="Brödsmulor" style={{ fontSize: "12.5px", color: "#6f685f", marginBottom: "10px" }}>
            <LocalizedClientLink href="/" style={{ color: "#6f685f" }}>Hem</LocalizedClientLink>
            {chain.map((c, i) => (
              <span key={c.id}>
                <span style={{ margin: "0 7px", color: "#a49c92" }}>/</span>
                {i === chain.length - 1 ? (
                  <span style={{ color: "#1b1714" }}>{displayName(c, byId)}</span>
                ) : (
                  <LocalizedClientLink href={pathOf(c, byId)} style={{ color: "#6f685f" }}>
                    {displayName(c, byId)}
                  </LocalizedClientLink>
                )}
              </span>
            ))}
          </nav>

          <h1 style={{ fontFamily: '"Poppins",ui-rounded,system-ui,sans-serif', fontWeight: 600, fontSize: "27px", color: "#1b1714", margin: "0 0 14px" }} data-testid="category-page-title">
            {displayName(self, byId)}
          </h1>

          {self.description ? <ReadMore html={self.description as string} /> : null}

          {hasChildren ? (
            <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-4" data-testid="subcategories">
              {children.map((c) => (
                <li key={c.id}>
                  <LocalizedClientLink
                    href={pathOf(c, byId)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: "118px", padding: "18px 12px", border: "1px solid #efeae5", borderRadius: "14px", background: "#fff", gap: "10px" }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "46px", height: "46px", borderRadius: "50%", background: "#faf8f6", color: "#F50000" }}>
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 18h2" /></svg>
                    </span>
                    <span style={{ fontFamily: '"Poppins",ui-rounded,system-ui,sans-serif', fontWeight: 600, fontSize: "14px", color: "#1b1714" }}>
                      {displayName(c, byId)}
                    </span>
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          ) : (
            <>
              <div className="mb-4">
                <RefinementList sortBy={sort} data-testid="sort-by-container" />
              </div>
              <Suspense fallback={<SkeletonProductGrid />}>
                <PaginatedProducts
                  sortBy={sort}
                  page={pageNumber}
                  categoryId={category.id}
                  countryCode={countryCode}
                />
              </Suspense>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
