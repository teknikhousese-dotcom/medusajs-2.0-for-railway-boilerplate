"use client"

import { useEffect, useState } from "react"
import { sdk } from "@lib/config"
import { getProductPrice } from "@lib/util/get-product-price"

const KEY = "th:recentlyViewed"

type Snap = { id: string; title: string; thumbnail: string; url: string }

type Card = {
  id: string
  url: string
  title: string
  thumbnail: string
  oos: boolean
  price: any
  onSale: boolean
  savings: number
}

// teknikhouse stock snapshot lives in metadata.in_stock (false = slut).
const isOutOfStock = (p: any) => {
  const v = p?.metadata?.in_stock
  return v === false || v === "false" || v === 0 || v === "0"
}

/**
 * "Senast visade": personlig rad med produkter kunden har tittat på. Listan
 * med id:n skrivs per webbläsare av <RecordView> på varje produktsida. Här
 * hämtas produkterna igen med aktuella priser och visas med samma kort och
 * samma prisrad som de andra produktraderna (ProductPreview och PreviewPrice):
 * reapriset i rött först och ordinarie pris överstruket bredvid. Raden syns
 * inte förrän det finns något att visa, så SSR och första besöket påverkas inte.
 * Sektionens ram kommer från .th-stilarna i th-home.
 */
export default function RecentlyViewed({ regionId }: { regionId?: string }) {
  const [cards, setCards] = useState<Card[]>([])

  useEffect(() => {
    let snaps: Snap[] = []
    try {
      const arr = JSON.parse(localStorage.getItem(KEY) || "[]")
      if (Array.isArray(arr)) {
        snaps = arr.filter((x) => x && x.id && x.url).slice(0, 5)
      }
    } catch {
      snaps = []
    }
    if (!snaps.length) return

    const ids = snaps.map((s) => s.id)

    async function load() {
      let priced: any[] = []
      if (regionId) {
        try {
          const res: any = await sdk.client.fetch("/store/products", {
            method: "GET",
            query: {
              id: ids,
              region_id: regionId,
              fields:
                "*variants.calculated_price,+variants.inventory_quantity,+metadata",
            },
          })
          priced = res?.products || []
        } catch {
          priced = []
        }
      }

      const byId = new Map<string, any>(priced.map((p: any) => [p.id, p]))

      const merged: Card[] = snaps.map((s) => {
        const p = byId.get(s.id)
        let price: any = null
        if (p) {
          try {
            price = getProductPrice({ product: p }).cheapestPrice
          } catch {
            price = null
          }
        }
        // Same rule as PreviewPrice: a sale only when the price really is lower.
        const onSale =
          price?.price_type === "sale" &&
          Number(price?.original_price_number || 0) >
            Number(price?.calculated_price_number || 0)
        const savings = onSale
          ? Math.round(
              (price.original_price_number || 0) -
                (price.calculated_price_number || 0)
            )
          : 0
        return {
          id: s.id,
          url: s.url,
          title: (p?.title as string) || s.title,
          thumbnail: (p?.thumbnail as string) || s.thumbnail,
          oos: p ? isOutOfStock(p) : false,
          price,
          onSale,
          savings,
        }
      })

      setCards(merged)
    }

    load()
  }, [regionId])

  if (!cards.length) return null

  return (
    <section className="blk" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="shead">
          <h2>Senast visade</h2>
          <span
            className="r"
            style={{ color: "var(--sub)", fontWeight: 600, fontSize: 14 }}
          >
            Baserat på vad du tittat på
          </span>
        </div>
        <div className="prods">
          {cards.map((c) => (
            <a key={c.id} href={c.url} className="group block h-full">
              <div className="flex h-full flex-col overflow-hidden rounded-xl small:rounded-2xl border border-ui-border-base bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-ui-border-strong">
                <div className="relative aspect-square overflow-hidden bg-white">
                  {c.onSale && c.savings > 0 && (
                    <span className="absolute left-2 top-2 z-10 rounded-md bg-red-600 px-1.5 py-0.5 small:px-2 small:py-1 text-[10.5px] small:text-[11px] font-semibold leading-tight text-white shadow-sm">
                      Spara {c.savings.toLocaleString("sv-SE")} kr
                    </span>
                  )}
                  {c.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.thumbnail}
                      alt={c.title}
                      loading="lazy"
                      className="h-full w-full object-contain p-3 small:p-4 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-ui-bg-subtle text-ui-fg-muted text-xs">
                      Bild saknas
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-y-1 border-t border-ui-border-base p-3 small:gap-y-1.5 small:p-4">
                  <h3
                    className="line-clamp-2 min-h-[2.5em] break-words text-[13px] small:text-sm font-medium leading-[1.25] text-ui-fg-base"
                    title={c.title}
                  >
                    {c.title}
                  </h3>
                  <span className="flex items-center gap-x-1.5 text-[11.5px] small:text-xs text-ui-fg-subtle">
                    <span
                      aria-hidden
                      className={
                        "inline-block h-2 w-2 shrink-0 rounded-full " +
                        (c.oos ? "bg-gray-400" : "bg-green-500")
                      }
                    />
                    {c.oos ? "Slut i lager" : "I lager"}
                  </span>
                  <div className="mt-auto flex items-end justify-between gap-x-2 pt-1.5 small:pt-2">
                    <div className="flex min-w-0 flex-col">
                      {c.price ? (
                        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0 leading-tight">
                          <span
                            className={
                              "whitespace-nowrap text-[15px] small:text-base font-semibold " +
                              (c.onSale ? "text-[#D10000]" : "text-ui-fg-base")
                            }
                          >
                            {c.price.calculated_price}
                          </span>
                          {c.onSale && (
                            <span className="whitespace-nowrap text-[11.5px] small:text-xs text-ui-fg-muted line-through">
                              {c.price.original_price}
                            </span>
                          )}
                        </div>
                      ) : null}
                    </div>
                    <span
                      aria-hidden
                      className="flex h-8 w-8 small:h-9 small:w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white transition-colors group-hover:bg-red-600"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
