"use client"
import { useEffect, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Item = { handle: string; title: string; thumbnail?: string; price?: string }
const KEY = "th_wishlist"

export default function WishlistPage() {
  const [items, setItems] = useState<Item[]>([])
  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(KEY) || "[]"))
    } catch {
      setItems([])
    }
  }, [])
  function remove(handle: string) {
    const next = items.filter((i) => i.handle !== handle)
    setItems(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {}
  }
  return (
    <div className="content-container py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6">Önskelista</h1>
        {items.length === 0 ? (
          <div className="text-gray-600">
            Din önskelista är tom. Klicka på hjärtat på en produkt för att spara den här.
            <div className="mt-4">
              <LocalizedClientLink href="/" className="text-[#D10000] hover:underline">Fortsätt handla →</LocalizedClientLink>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {items.map((it) => (
              <div key={it.handle} className="group border rounded-xl p-3 relative">
                <button onClick={() => remove(it.handle)} aria-label="Ta bort" className="absolute top-2 right-2 text-gray-400 hover:text-[#D10000]">✕</button>
                <LocalizedClientLink href={`/products/${it.handle}`}>
                  {it.thumbnail ? (
                    <img src={it.thumbnail} alt={it.title} className="w-full h-40 object-contain mb-2" />
                  ) : (
                    <div className="w-full h-40 bg-gray-50 mb-2 rounded" />
                  )}
                  <div className="text-sm text-gray-800 line-clamp-2">{it.title}</div>
                  {it.price && <div className="text-[#D10000] font-semibold mt-1">{it.price}</div>}
                </LocalizedClientLink>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
