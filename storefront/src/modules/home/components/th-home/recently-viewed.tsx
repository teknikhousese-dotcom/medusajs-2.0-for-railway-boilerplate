"use client"

import { useEffect, useState } from "react"

const KEY = "th:recentlyViewed"

type Item = { id: string; title: string; thumbnail: string; url: string }

/**
 * "Senast visade" — personalised recently-viewed rail. Reads the per-browser
 * localStorage list written by <RecordView> on each PDP, so it is different
 * for every customer. Renders nothing until it has items (so the homepage is
 * unaffected on first visit / SSR). Relies on the .th scoped CSS in th-home.
 */
export default function RecentlyViewed() {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    try {
      const arr = JSON.parse(localStorage.getItem(KEY) || "[]")
      if (Array.isArray(arr)) {
        setItems(
          arr
            .filter((x) => x && x.id && x.url)
            .slice(0, 6)
            .map((x) => ({
              id: String(x.id),
              title: String(x.title || ""),
              thumbnail: String(x.thumbnail || ""),
              url: String(x.url),
            }))
        )
      }
    } catch {
      /* ignore */
    }
  }, [])

  if (!items.length) return null

  return (
    <section className="blk" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="shead">
          <h2>Senast visade</h2>
          <span className="r" style={{ color: "var(--sub)", fontWeight: 600, fontSize: 14 }}>
            Baserat på vad du tittat på
          </span>
        </div>
        <div className="rvgrid">
          {items.map((p) => (
            <a key={p.id} className="rvcard" href={p.url}>
              <div className="rvimg">
                {p.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbnail} alt={p.title} loading="lazy" />
                ) : null}
              </div>
              <span className="rvt">{p.title}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
