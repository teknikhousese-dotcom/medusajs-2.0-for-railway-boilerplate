"use client"

import { useCallback, useEffect, useState } from "react"

/*
   Önskelistan sparas i webbläsaren (localStorage "th_wishlist") så att den
   fungerar utan inloggning. Alla hjärtan på sidan lyssnar på samma händelse
   och uppdateras direkt, även mellan flikar (storage-händelsen).
*/

export type WishItem = {
  id: string
  handle: string
  title: string
  thumbnail?: string | null
  href?: string | null
  at?: number
}

const KEY = "th_wishlist"
const EVT = "th-wishlist-change"

export function readWishlist(): WishItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]")
    if (!Array.isArray(raw)) return []
    const out: WishItem[] = []
    const seen = new Set<string>()
    for (const x of raw) {
      if (!x || typeof x !== "object") continue
      const id = String(x.id || x.handle || "")
      if (!id || seen.has(id)) continue
      seen.add(id)
      out.push({
        id,
        handle: String(x.handle || ""),
        title: String(x.title || ""),
        thumbnail: x.thumbnail || null,
        href: x.href || null,
        at: Number(x.at) || 0,
      })
    }
    return out
  } catch {
    return []
  }
}

export function writeWishlist(list: WishItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* privat läge eller fullt lagringsutrymme */
  }
  try {
    window.dispatchEvent(new Event(EVT))
  } catch {
    /* äldre webbläsare */
  }
}

export function useWishlist() {
  const [items, setItems] = useState<WishItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const sync = () => setItems(readWishlist())
    sync()
    setReady(true)
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === KEY) sync()
    }
    window.addEventListener(EVT, sync)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener(EVT, sync)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  const has = useCallback((id?: string | null) => !!id && items.some((i) => i.id === id), [items])

  const remove = useCallback((id: string) => {
    writeWishlist(readWishlist().filter((i) => i.id !== id))
  }, [])

  const add = useCallback((item: WishItem) => {
    const cur = readWishlist().filter((i) => i.id !== item.id)
    writeWishlist([{ ...item, at: Date.now() }, ...cur].slice(0, 200))
  }, [])

  const toggle = useCallback(
    (item: WishItem): boolean => {
      const on = readWishlist().some((i) => i.id === item.id)
      if (on) remove(item.id)
      else add(item)
      return !on
    },
    [add, remove]
  )

  const clear = useCallback(() => writeWishlist([]), [])

  return { items, ready, count: items.length, has, add, remove, toggle, clear }
}

/* Hjärtat på produktkorten. Ligger inuti kortets länk, så klicket stoppas. */
export function WishlistHeart({ item, className }: { item: WishItem; className?: string }) {
  const wl = useWishlist()
  const on = wl.ready && wl.has(item.id)
  const [pop, setPop] = useState(false)

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Ta bort från önskelistan" : "Spara i önskelistan"}
      title={on ? "Sparad i önskelistan" : "Spara i önskelistan"}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        const now = wl.toggle(item)
        if (now) {
          setPop(true)
          window.setTimeout(() => setPop(false), 320)
        }
      }}
      className={
        "absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 backdrop-blur transition-transform hover:scale-105 active:scale-95 " +
        (className || "")
      }
      style={{ transform: pop ? "scale(1.18)" : undefined }}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        aria-hidden="true"
        fill={on ? "#F50000" : "none"}
        stroke={on ? "#F50000" : "#6f685f"}
        strokeWidth={1.9}
        strokeLinejoin="round"
      >
        <path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21z" />
      </svg>
    </button>
  )
}
