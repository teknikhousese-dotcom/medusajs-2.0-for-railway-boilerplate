"use client"

import { usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const FIX: Record<string, string> = {
  "batterier": "Batterier",
  "datortillbehor": "Datortillbehör",
  "gaming": "Gaming",
  "hem-fritid": "Hem & Fritid",
  "horlurar-hogtalare": "Hörlurar & Högtalare",
  "kablar-laddare": "Kablar & Laddare",
  "kablar-adaptrar": "Kablar & Adaptrar",
  "mobiler-surfplattor": "Mobiler & Surfplattor",
  "mobilreparation": "Mobilreparation",
  "mobilreservdelar": "Mobilreservdelar",
  "mobiltillbehor": "Mobiltillbehör",
  "outlet-fyndvaror": "Outlet - Fyndvaror",
  "powerbank": "Powerbank",
  "sakerhet-smart-hem": "Säkerhet & Smart hem",
  "halsa-skonhet": "Hälsa & Skönhet",
}

const pretty = (s: string) => {
  const key = decodeURIComponent(s).toLowerCase()
  if (FIX[key]) return FIX[key]
  return decodeURIComponent(s)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bIphone\b/g, "iPhone")
    .replace(/\bIpad\b/g, "iPad")
    .replace(/\bIpod\b/g, "iPod")
    .replace(/\bMacbook\b/g, "MacBook")
    .replace(/\bAirpods\b/g, "AirPods")
}

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
      style={{ fontSize: "12.5px", color: "#6f685f", paddingTop: "12px", paddingBottom: "12px" }}
    >
      <style>{`.thbc{display:flex;align-items:center;list-style:none;margin:0;padding:0;flex-wrap:nowrap;overflow-x:auto;white-space:nowrap;scrollbar-width:none;-webkit-overflow-scrolling:touch}.thbc::-webkit-scrollbar{display:none}.thbc li{display:flex;align-items:center;flex:0 0 auto}.thbc li.cur{flex:0 1 auto;min-width:0}.thbc li.cur span.t{overflow:hidden;text-overflow:ellipsis}@media(min-width:1024px){.thbc{flex-wrap:wrap;white-space:normal;overflow:visible}}`}</style>
      <ol className="thbc">
        <li>
          <LocalizedClientLink href="/" style={{ color: "#6f685f" }}>
            Hem
          </LocalizedClientLink>
        </li>
        {crumbs.map((c, i) => (
          <li key={i} className={c.last ? "cur" : undefined}>
            <span aria-hidden style={{ color: "#a49c92", margin: "0 7px" }}>/</span>
            {c.last ? (
              <span className="t" aria-current="page" style={{ color: "#1b1714", fontWeight: 500 }}>
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
