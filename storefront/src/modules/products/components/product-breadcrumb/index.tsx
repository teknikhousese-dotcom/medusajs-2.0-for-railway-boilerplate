"use client"

import { usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const pretty = (s: string) =>
  decodeURIComponent(s)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())

/**
 * Path-based breadcrumb — works for every category since it reads the current
 * URL. The last segment is the product slug, shown as the product title.
 */
export default function ProductBreadcrumb({ title }: { title?: string }) {
  const path = usePathname() || ""
  const segs = path.split("/").filter(Boolean)
  if (!segs.length) return null

  const crumbs = segs.map((seg, i) => ({
    seg,
    href: "/" + segs.slice(0, i + 1).join("/"),
    last: i === segs.length - 1,
  }))

  return (
    <nav
      aria-label="Brödsmulor"
      className="content-container"
      style={{ fontSize: "12.5px", color: "#6f685f", padding: "14px 0" }}
    >
      <ol
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      >
        <li>
          <LocalizedClientLink href="/" style={{ color: "#6f685f" }}>
            Hem
          </LocalizedClientLink>
        </li>
        {crumbs.map((c, i) => (
          <li key={i} style={{ display: "flex", alignItems: "center" }}>
            <span style={{ color: "#a49c92", margin: "0 7px" }}>/</span>
            {c.last ? (
              <span style={{ color: "#1b1714", fontWeight: 500 }}>
                {title || pretty(c.seg)}
              </span>
            ) : (
              <LocalizedClientLink href={c.href} style={{ color: "#6f685f" }}>
                {pretty(c.seg)}
              </LocalizedClientLink>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
