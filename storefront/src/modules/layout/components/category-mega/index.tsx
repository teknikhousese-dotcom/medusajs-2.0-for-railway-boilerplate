"use client"

import { useState } from "react"
import Link from "next/link"
import { HttpTypes } from "@medusajs/types"

type Cat = HttpTypes.StoreProductCategory

// A category's own path segment = its handle minus the parent handle prefix.
const seg = (child: Cat, parent?: Cat) =>
  parent && parent.handle && child.handle
    ? child.handle.slice(parent.handle.length + 1)
    : child.handle || ""

// Department → outline icon (matched by keywords in the Swedish name).
function DeptIcon({ name }: { name: string }) {
  const n = (name || "").toLowerCase()
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  let path = <><rect x="4" y="4" width="7" height="7" rx="1.5" {...p} /><rect x="13" y="4" width="7" height="7" rx="1.5" {...p} /><rect x="4" y="13" width="7" height="7" rx="1.5" {...p} /><rect x="13" y="13" width="7" height="7" rx="1.5" {...p} /></>
  if (n.includes("reservdel")) path = <><rect x="7" y="2.5" width="10" height="19" rx="2.4" {...p} /><path d="M10.5 18.5h3" {...p} /></>
  else if (n.includes("tillbeh")) path = <><rect x="7" y="2.5" width="10" height="19" rx="2.4" {...p} /><path d="M12 6h.01" {...p} /><path d="M15 2.5l3 3-3 3" {...p} /></>
  else if (n.includes("batteri") || n.includes("powerbank")) path = <><rect x="3" y="8" width="16" height="9" rx="2" {...p} /><path d="M21 11v3" {...p} /><path d="M9 10l-2 3h3l-2 3" {...p} /></>
  else if (n.includes("kabl") || n.includes("laddar")) path = <><path d="M9 3v4M15 3v4" {...p} /><path d="M7 7h10v3.5a5 5 0 01-10 0z" {...p} /><path d="M12 16v5" {...p} /></>
  else if (n.includes("hörlur") || n.includes("högtal") || n.includes("ljud")) path = <><path d="M5 15v-3a7 7 0 0114 0v3" {...p} /><rect x="3" y="14" width="4" height="6" rx="1.6" {...p} /><rect x="17" y="14" width="4" height="6" rx="1.6" {...p} /></>
  else if (n.includes("gaming")) path = <><rect x="3" y="8" width="18" height="9" rx="4" {...p} /><path d="M8 12.5h-2M7 11v3M15 12h.01M17.5 13h.01" {...p} /></>
  else if (n.includes("dator")) path = <><rect x="3" y="5" width="18" height="11" rx="2" {...p} /><path d="M2 20h20" {...p} /></>
  else if (n.includes("surfplatt") || n.includes("mobiler")) path = <><rect x="4" y="3" width="16" height="18" rx="2.4" {...p} /><path d="M10 18h4" {...p} /></>
  else if (n.includes("smartwatch") || n.includes("klock")) path = <><rect x="7" y="7" width="10" height="10" rx="3" {...p} /><path d="M9 7l1-3h4l1 3M9 17l1 3h4l1-3" {...p} /></>
  else if (n.includes("verktyg")) path = <><path d="M14 4l6 6-3 3-6-6z" {...p} /><path d="M11 7L4 14v6h6l7-7" {...p} /></>
  else if (n.includes("reparation")) path = <><path d="M14 6.5a3.5 3.5 0 00-4.6 4.6L4 16.5 7 19l5.4-5.4A3.5 3.5 0 0017 9l-2 2-2-2z" {...p} /></>
  else if (n.includes("outlet") || n.includes("fynd")) path = <><path d="M4 4h7l9 9-7 7-9-9z" {...p} /><circle cx="8.5" cy="8.5" r="1.2" {...p} /></>
  else if (n.includes("hem") || n.includes("fritid")) path = <><path d="M4 11l8-7 8 7" {...p} /><path d="M6 10v9h12v-9" {...p} /></>
  return <svg viewBox="0 0 24 24" width="26" height="26">{path}</svg>
}

/**
 * teknikhouse category navigation — icon department bar (Teknikdelar-style).
 * Each department shows an outline icon above its label; hovering opens a
 * full-width mega-panel with its brands (columns) and each brand's models.
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
        <ul className="flex items-stretch gap-x-1 overflow-x-auto">
          {departments.map((dep) => {
            const brands = childrenOf(dep.id)
            const isOpen = openId === dep.id
            const depHref = `/${dep.handle}`
            return (
              <li
                key={dep.id}
                className="flex"
                onMouseEnter={() => setOpenId(dep.id)}
              >
                <Link
                  href={depHref}
                  className={
                    "group flex flex-col items-center justify-center gap-1 min-w-[92px] px-3 py-2.5 border-b-2 transition-colors " +
                    (isOpen
                      ? "border-[#F50000] text-[#F50000]"
                      : "border-transparent text-ui-fg-subtle hover:text-[#F50000]")
                  }
                >
                  <DeptIcon name={dep.name} />
                  <span className="text-[12px] font-medium leading-tight text-center whitespace-nowrap">
                    {dep.name}
                  </span>
                </Link>

                {isOpen && brands.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 border-t border-b border-ui-border-base bg-white shadow-lg">
                    <div className="content-container py-6 max-h-[70vh] overflow-y-auto">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
                        {brands.map((brand) => {
                          const models = childrenOf(brand.id)
                          const brandHref = `${depHref}/${seg(brand, dep)}`
                          return (
                            <div key={brand.id} className="min-w-0">
                              <Link
                                href={brandHref}
                                className="block font-semibold text-ui-fg-base hover:text-[#F50000] mb-2"
                              >
                                {brand.name}
                              </Link>
                              {models.length > 0 && (
                                <ul className="flex flex-col gap-y-1">
                                  {models.map((m) => (
                                    <li key={m.id}>
                                      <Link
                                        href={`${brandHref}/${seg(m, brand)}`}
                                        className="block text-ui-fg-subtle hover:text-ui-fg-base truncate"
                                      >
                                        {m.name}
                                      </Link>
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
          <li className="flex">
            <Link
              href="/kampanjer"
              className="group flex flex-col items-center justify-center gap-1 min-w-[92px] px-3 py-2.5 border-b-2 border-transparent text-[#F50000] hover:text-[#D10000]"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M20.6 8.4 12 3 3.4 8.4v7.2L12 21l8.6-5.4z" /><path d="M12 8v5M9.5 10.5h5" /></svg>
              <span className="text-[12px] font-semibold leading-tight text-center whitespace-nowrap">Kampanjer</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}
