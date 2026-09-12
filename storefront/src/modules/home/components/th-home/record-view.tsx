"use client"

import { useEffect } from "react"

const KEY = "th:recentlyViewed"
const MAX = 12

/**
 * Records the current product into the visitor's "Senast visade" list.
 * Stored per-browser in localStorage, so the list is different for every
 * customer. The current PDP path is the product's canonical URL, so no
 * server-side URL computation is needed. Renders nothing.
 */
export default function RecordView({
  id,
  title,
  thumbnail,
}: {
  id?: string
  title?: string
  thumbnail?: string | null
}) {
  useEffect(() => {
    if (!id) return
    try {
      const entry = {
        id,
        title: title || "",
        thumbnail: thumbnail || "",
        url: window.location.pathname,
      }
      let arr: any[] = []
      try {
        arr = JSON.parse(localStorage.getItem(KEY) || "[]")
      } catch {
        arr = []
      }
      if (!Array.isArray(arr)) arr = []
      arr = arr.filter((x) => x && x.id !== id)
      arr.unshift(entry)
      arr = arr.slice(0, MAX)
      localStorage.setItem(KEY, JSON.stringify(arr))
    } catch {
      /* localStorage unavailable — ignore */
    }
  }, [id, title, thumbnail])

  return null
}
