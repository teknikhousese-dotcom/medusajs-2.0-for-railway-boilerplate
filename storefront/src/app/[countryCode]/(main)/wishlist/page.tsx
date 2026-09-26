"use client"

import { useEffect, useState } from "react"
import { sdk } from "@lib/config"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useWishlist } from "@modules/wishlist"

/*
   Önskelistan. Produkterna sparas i webbläsaren (se modules/wishlist) och
   pris och lagerstatus hämtas färskt från butiken varje gång sidan visas.
*/

type Live = { price: string | null; oos: boolean; thumbnail: string | null; title: string }

let REGION_ID: string | null = null

async function regionId(): Promise<string | null> {
  if (REGION_ID) return REGION_ID
  try {
    const r: any = await sdk.client.fetch("/store/regions", { method: "GET" })
    const list: any[] = r?.regions || []
    const se = list.find((x) => (x.countries || []).some((c: any) => c?.iso_2 === "se")) || list[0]
    REGION_ID = se?.id || null
  } catch {
    REGION_ID = null
  }
  return REGION_ID
}

const FONT = '"Poppins",ui-rounded,system-ui,sans-serif'
const HEART = "M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21z"

export default function WishlistPage() {
  const wl = useWishlist()
  const [live, setLive] = useState<Record<string, Live>>({})
  const ids = wl.items.map((i) => i.id).filter((id) => id.startsWith("prod_"))
  const idKey = ids.join(",")

  useEffect(() => {
    if (!ids.length) return
    let off = false
    const run = async () => {
      try {
        const rid = await regionId()
        const r: any = await sdk.client.fetch("/store/products", {
          method: "GET",
          query: {
            id: ids,
            limit: ids.length,
            ...(rid ? { region_id: rid } : {}),
            fields: rid ? "id,title,thumbnail,+metadata,*variants.calculated_price" : "id,title,thumbnail,+metadata",
          },
        })
        const next: Record<string, Live> = {}
        for (const p of r?.products || []) {
          let price: string | null = null
          try {
            price = (getProductPrice({ product: p }).cheapestPrice as any)?.calculated_price || null
          } catch {
            price = null
          }
          const v = p?.metadata?.in_stock
          next[p.id] = {
            price,
            oos: v === false || v === "false" || v === 0 || v === "0",
            thumbnail: p.thumbnail || null,
            title: p.title || "",
          }
        }
        if (!off) setLive(next)
      } catch {
        /* visa det som sparades lokalt */
      }
    }
    run()
    return () => {
      off = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idKey])

  const items = wl.items
  const n = items.length

  return (
    <div className="content-container py-10 small:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 style={{ fontFamily: FONT, fontWeight: 600, fontSize: "clamp(24px, 5vw, 30px)", color: "#1b1714", margin: 0 }}>
              Önskelista
            </h1>
            <p style={{ fontSize: "14px", color: "#6f685f", margin: "4px 0 0" }}>
              {!wl.ready
                ? ""
                : n
                  ? n + (n === 1 ? " sparad produkt." : " sparade produkter.") + " Listan sparas i den här webbläsaren."
                  : "Spara produkter med hjärtat så hittar du dem här."}
            </p>
          </div>
          {n > 1 ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Vill du tömma önskelistan?")) wl.clear()
              }}
              className="text-sm text-ui-fg-subtle underline-offset-2 hover:text-ui-fg-base hover:underline"
            >
              Töm listan
            </button>
          ) : null}
        </div>

        {!wl.ready ? null : n === 0 ? (
          <div
            className="mx-auto max-w-xl text-center"
            style={{ border: "1px solid #efeae5", borderRadius: "16px", background: "#faf8f6", padding: "32px 20px" }}
          >
            <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: "18px", color: "#1b1714", margin: "0 0 6px" }}>
              Din önskelista är tom
            </p>
            <p style={{ fontSize: "14.5px", color: "#6f685f", margin: "0 0 18px", lineHeight: 1.55 }}>
              Tryck på hjärtat på en produkt för att spara den här. Bra när du jämför delar eller vill komma tillbaka senare.
            </p>
            <LocalizedClientLink
              href="/mobilreservdelar"
              className="inline-flex rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
            >
              Hitta delar till din telefon
            </LocalizedClientLink>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 min-[768px]:grid-cols-3 min-[768px]:gap-4 medium:grid-cols-4 medium:gap-5">
            {items.map((it) => {
              const l = live[it.id]
              const img = l?.thumbnail || it.thumbnail
              const title = l?.title || it.title
              const href = it.href || "/products/" + it.handle
              return (
                <li key={it.id} className="relative">
                  <LocalizedClientLink
                    href={href}
                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-ui-border-base bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg small:rounded-2xl"
                  >
                    <div className="relative aspect-square bg-white">
                      {img ? (
                        <img src={img} alt={title} loading="lazy" className="absolute inset-0 h-full w-full object-contain p-3 small:p-4" />
                      ) : (
                        <div className="absolute inset-0 bg-ui-bg-subtle" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-y-1 border-t border-ui-border-base p-3 small:p-4">
                      <h3 className="line-clamp-2 min-h-[2.5em] text-[13px] font-medium leading-[1.25] text-ui-fg-base small:text-sm">{title}</h3>
                      {l ? (
                        <span className="flex items-center gap-x-1.5 text-[11.5px] text-ui-fg-subtle small:text-xs">
                          <span aria-hidden className={"inline-block h-2 w-2 rounded-full " + (l.oos ? "bg-gray-400" : "bg-green-500")} />
                          {l.oos ? "Slut i lager" : "I lager"}
                        </span>
                      ) : null}
                      <div className="mt-auto pt-1.5 text-[15px] font-semibold text-ui-fg-base">{l?.price || ""}</div>
                    </div>
                  </LocalizedClientLink>
                  <button
                    type="button"
                    onClick={() => wl.remove(it.id)}
                    aria-label={"Ta bort " + title + " från önskelistan"}
                    title="Ta bort"
                    className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 hover:scale-105"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="#F50000" stroke="#F50000" strokeWidth={1.9} strokeLinejoin="round">
                      <path d={HEART} />
                    </svg>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
