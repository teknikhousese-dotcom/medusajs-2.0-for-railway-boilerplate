"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { niceCategoryName, categoryLabel } from "@lib/util/category-name"

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
  return <svg className="shrink-0" viewBox="0 0 24 24" width="24" height="24">{path}</svg>
}

// Links here use prefetch={false}: the department bar is on every page and
// prefetching all of it on load fired a dozen RSC requests per page view.

/**
 * teknikhouse category navigation: icon department bar, one row (scrolls sideways if it does not fit).
 * The row starts at the content-container left edge, the same edge as the logo,
 * the breadcrumb and the page content, so everything lines up at every width.
 * Each department shows an outline icon above its label; hovering opens a
 * full-width mega-panel with its brands (columns) and each brand's models.
 */
export default function CategoryMega({ categories }: { categories: Cat[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  // Close the mega-panel when the route changes. The nav stays mounted across
  // client-side navigations and the pointer may still be over a department, so
  // openId would otherwise keep the panel open on top of the new page.
  const pathname = usePathname()
  useEffect(() => {
    setOpenId(null)
  }, [pathname])

  /* One row of departments. If it does not fit, it scrolls sideways and arrow buttons appear. */
  const scrollRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ l: false, r: false })
  const updateEdges = () => {
    const el = scrollRef.current
    if (!el) return
    const l = el.scrollLeft > 2
    const r = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
    setEdges((prev) => (prev.l === l && prev.r === r ? prev : { l, r }))
  }
  useEffect(() => {
    updateEdges()
    window.addEventListener("resize", updateEdges)
    return () => window.removeEventListener("resize", updateEdges)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories])
  const nudge = (dir: number) => {
    const el = scrollRef.current
    if (!el) return
    setOpenId(null)
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.7), behavior: "smooth" })
  }

  const byParent = new Map<string | null, Cat[]>()
  for (const c of categories) {
    const p = (c.parent_category_id as string) || null
    if (!byParent.has(p)) byParent.set(p, [])
    byParent.get(p)!.push(c)
  }
  const sortRank = (a: Cat, b: Cat) =>
    ((a as any).rank ?? 0) - ((b as any).rank ?? 0) || a.name.localeCompare(b.name, "sv")
  const inTopMenu = (c: any) => { const m = (c && (c as any).metadata) || {}; return m.startpage_dropdown === "1" || m.startpage_dropdown === 1 || m.startpage_dropdown === true }
  const departments = (byParent.get(null) || []).filter(inTopMenu).slice().sort(sortRank)
  const childrenOf = (id: string) => (byParent.get(id) || []).slice().sort(sortRank)

  if (!departments.length) return null

  return (
    <nav
      aria-label="Kategorier"
      className="hidden small:block border-b border-ui-border-base bg-white"
      onMouseLeave={() => setOpenId(null)}
    >
      <div className="content-container relative">
        {edges.l && (
          <button
            type="button"
            aria-label="Visa fler kategorier"
            onClick={() => nudge(-1)}
            className="absolute left-0 top-0 bottom-0 z-10 w-12 flex items-center justify-start pl-2 bg-gradient-to-r from-white via-white to-transparent text-ui-fg-base hover:text-[#F50000]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
        )}
        {edges.r && (
          <button
            type="button"
            aria-label="Visa fler kategorier"
            onClick={() => nudge(1)}
            className="absolute right-0 top-0 bottom-0 z-10 w-12 flex items-center justify-end pr-2 bg-gradient-to-l from-white via-white to-transparent text-ui-fg-base hover:text-[#F50000]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        )}
        <div ref={scrollRef} onScroll={updateEdges} className="overflow-x-auto no-scrollbar">
        <ul className="flex flex-nowrap items-stretch w-max">
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
                  prefetch={false}
                  href={depHref}
                  className={
                    "group flex flex-col items-center justify-start gap-1 min-w-[64px] max-w-[100px] px-1 pt-2 pb-1.5 border-b-2 transition-colors " +
                    (isOpen
                      ? "border-[#F50000] text-[#F50000]"
                      : "border-transparent text-ui-fg-subtle hover:text-[#F50000]")
                  }
                >
                  <DeptIcon name={niceCategoryName(dep.name, dep.handle)} />
                  <span className="text-[11.5px] font-medium leading-[1.2] text-center">
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
                                prefetch={false}
                                href={brandHref}
                                className="block font-semibold text-ui-fg-base hover:text-[#F50000] mb-2"
                              >
                                {categoryLabel(brand.name, dep.name, seg(brand, dep))}
                              </Link>
                              {models.length > 0 && (
                                <ul className="flex flex-col gap-y-1">
                                  {models.map((m) => (
                                    <li key={m.id}>
                                      <Link
                                        prefetch={false}
                                        href={`${brandHref}/${seg(m, brand)}`}
                                        className="block text-ui-fg-subtle hover:text-ui-fg-base truncate"
                                      >
                                        {categoryLabel(m.name, brand.name, seg(m, brand))}
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
              prefetch={false}
              href="/kampanjer"
              className="group flex flex-col items-center justify-start gap-1 min-w-[64px] max-w-[100px] px-1 pt-2 pb-1.5 border-b-2 border-transparent text-[#F50000] hover:text-[#D10000]"
            >
              <svg className="shrink-0" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M20.6 8.4 12 3 3.4 8.4v7.2L12 21l8.6-5.4z" /><path d="M12 8v5M9.5 10.5h5" /></svg>
              <span className="text-[11.5px] font-semibold leading-[1.2] text-center">Kampanjer</span>
            </Link>
          </li>
        </ul>
        </div>
      </div>
    </nav>
  )
}
