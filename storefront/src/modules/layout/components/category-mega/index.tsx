"use client"

import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type Cat = HttpTypes.StoreProductCategory

/**
 * teknikhouse-style category navigation.
 * Desktop: a persistent department bar; hovering a department opens a full-width
 * mega-panel with its brands (columns) and each brand's models beneath.
 * Receives the full flat category list and builds the 3-level tree itself.
 */
export default function CategoryMega({ categories }: { categories: Cat[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  const byParent = new Map<string | null, Cat[]>()
  for (const c of categories) {
    const p = (c.parent_category_id as string) || null
    if (!byParent.has(p)) byParent.set(p, [])
    byParent.get(p)!.push(c)
  }
  const sortRank = (a: Cat, b: Cat) =>
    ((a as any).rank ?? 0) - ((b as any).rank ?? 0) || a.name.localeCompare(b.name, "sv")
  const departments = (byParent.get(null) || []).slice().sort(sortRank)
  const childrenOf = (id: string) => (byParent.get(id) || []).slice().sort(sortRank)

  if (!departments.length) return null

  return (
    <nav
      aria-label="Kategorier"
      className="hidden small:block border-b border-ui-border-base bg-white"
      onMouseLeave={() => setOpenId(null)}
    >
      <div className="content-container">
        <ul className="flex items-stretch gap-x-6 h-11 text-small-regular overflow-x-auto">
          {departments.map((dep) => {
            const brands = childrenOf(dep.id)
            const isOpen = openId === dep.id
            return (
              <li
                key={dep.id}
                className="flex items-center"
                onMouseEnter={() => setOpenId(dep.id)}
              >
                <LocalizedClientLink
                  href={`/categories/${dep.handle}`}
                  className={
                    "whitespace-nowrap py-3 hover:text-ui-fg-base " +
                    (isOpen ? "text-ui-fg-base font-medium" : "text-ui-fg-subtle")
                  }
                >
                  {dep.name}
                </LocalizedClientLink>

                {isOpen && brands.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 border-t border-b border-ui-border-base bg-white shadow-lg">
                    <div className="content-container py-6 max-h-[70vh] overflow-y-auto">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
                        {brands.map((brand) => {
                          const models = childrenOf(brand.id)
                          return (
                            <div key={brand.id} className="min-w-0">
                              <LocalizedClientLink
                                href={`/categories/${brand.handle}`}
                                className="block font-semibold text-ui-fg-base hover:text-ui-fg-interactive mb-2"
                              >
                                {brand.name}
                              </LocalizedClientLink>
                              {models.length > 0 && (
                                <ul className="flex flex-col gap-y-1">
                                  {models.map((m) => (
                                    <li key={m.id}>
                                      <LocalizedClientLink
                                        href={`/categories/${m.handle}`}
                                        className="block text-ui-fg-subtle hover:text-ui-fg-base truncate"
                                      >
                                        {m.name}
                                      </LocalizedClientLink>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
