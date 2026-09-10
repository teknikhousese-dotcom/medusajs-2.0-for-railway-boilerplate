"use client"

import { useState } from "react"
import Link from "next/link"
import { HttpTypes } from "@medusajs/types"

type Cat = HttpTypes.StoreProductCategory

/**
 * Mobile category tree for the "Meny" drawer — an accordion:
 * department → tap to expand brands → tap to expand models (links).
 * Links use the hierarchical teknikhouse paths (/dept/brand/model), built by
 * appending each category's own segment (handle minus the parent handle prefix).
 */
export default function CategoryTreeMobile({
  categories,
  onNavigate,
}: {
  categories: Cat[]
  onNavigate?: () => void
}) {
  const byParent = new Map<string | null, Cat[]>()
  for (const c of categories) {
    const p = (c.parent_category_id as string) || null
    if (!byParent.has(p)) byParent.set(p, [])
    byParent.get(p)!.push(c)
  }
  const sortRank = (a: Cat, b: Cat) =>
    ((a as any).rank ?? 0) - ((b as any).rank ?? 0) || a.name.localeCompare(b.name, "sv")
  const roots = (byParent.get(null) || []).slice().sort(sortRank)
  const kids = (id: string) => (byParent.get(id) || []).slice().sort(sortRank)

  const [open, setOpen] = useState<Record<string, boolean>>({})
  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }))

  if (!roots.length) return null

  const Row = ({
    cat,
    depth,
    parentHandle,
    parentHref,
  }: {
    cat: Cat
    depth: number
    parentHandle?: string
    parentHref?: string
  }) => {
    const children = kids(cat.id)
    const isOpen = !!open[cat.id]
    const selfSeg =
      parentHandle && cat.handle ? cat.handle.slice(parentHandle.length + 1) : cat.handle || ""
    const href = parentHref ? `${parentHref}/${selfSeg}` : `/${cat.handle}`
    return (
      <li>
        <div className="flex items-center justify-between gap-2">
          <Link
            href={href}
            onClick={onNavigate}
            className={
              "block py-2 hover:text-ui-fg-disabled " +
              (depth === 0 ? "text-xl" : depth === 1 ? "text-base pl-3" : "text-sm pl-6 text-ui-fg-subtle")
            }
          >
            {cat.name}
          </Link>
          {children.length > 0 && (
            <button
              type="button"
              aria-label={isOpen ? "Dölj" : "Visa"}
              onClick={() => toggle(cat.id)}
              className="px-2 text-ui-fg-on-color/80"
            >
              {isOpen ? "–" : "+"}
            </button>
          )}
        </div>
        {isOpen && children.length > 0 && (
          <ul className="flex flex-col">
            {children.map((c) => (
              <Row
                key={c.id}
                cat={c}
                depth={depth + 1}
                parentHandle={cat.handle || undefined}
                parentHref={href}
              />
            ))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <ul className="flex flex-col border-t border-white/20 pt-4 mt-2 max-h-[45vh] overflow-y-auto">
      {roots.map((r) => (
        <Row key={r.id} cat={r} depth={0} />
      ))}
    </ul>
  )
}
