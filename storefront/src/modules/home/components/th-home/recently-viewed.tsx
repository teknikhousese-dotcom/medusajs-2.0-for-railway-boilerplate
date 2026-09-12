"use client"

import { useEffect, useState } from "react"
import { Text, clx } from "@medusajs/ui"
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
 * "Senast visade" — personalised recently-viewed rail. The per-browser list of
 * viewed product ids is written by <RecordView> on each PDP (so it is different
 * for every customer). Here we re-fetch those products with live pricing and
 * render them exactly like the other product rails (price, rea-badge, lager,
 * +-knapp). Renders nothing until there are items, so SSR / first visit is
 * unaffected. Relies on the .th scoped CSS in th-home for the section chrome.
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
        const onSale = price?.price_type === "sale"
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
              <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-ui-border-base bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-ui-border-strong">
                <div className="relative aspect-square overflow-hidden bg-ui-bg-subtle">
                  {c.onSale && c.savings > 0 && (
                    <span className="absolute left-2 top-2 z-10 rounded-md bg-red-600 px-2 py-1 text-[11px] font-semibold text-white shadow-sm">
                      Spara {c.savings.toLocaleString("sv-SE")} kr
                    </span>
                  )}
                  {c.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.thumbnail}
                      alt={c.title}
                      loading="lazy"
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-y-1.5 p-4">
                  <Text className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-ui-fg-base">
                    {c.title}
                  </Text>
                  <span className="flex items-center gap-x-1.5 text-xs text-ui-fg-subtle">
                    <span
                      aria-hidden
                      className={`inline-block h-2 w-2 rounded-full ${
                        c.oos ? "bg-gray-400" : "bg-green-500"
                      }`}
                    />
                    {c.oos ? "Slut i lager" : "I lager"}
                  </span>
                  <div className="mt-auto flex items-end justify-between pt-2">
                    <div className="flex flex-col text-ui-fg-base">
                      {c.price ? (
                        <>
                          {c.onSale && (
                            <Text className="line-through text-ui-fg-muted">
                              {c.price.original_price}
                            </Text>
                          )}
                          <Text
                            className={clx("text-ui-fg-muted", {
                              "text-ui-fg-interactive": c.onSale,
                            })}
                          >
                            {c.price.calculated_price}
                          </Text>
                        </>
                      ) : null}
                    </div>
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-lg font-light leading-none text-white transition-colors group-hover:bg-red-600"
                    >
                      +
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
