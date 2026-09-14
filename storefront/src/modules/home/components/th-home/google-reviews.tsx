"use client"

import { useEffect, useRef } from "react"

// Google reviews via Trustindex — the exact certificate widget teknikhouse.se
// uses today (Nordic Teknik House AB's own Trustindex account). Renders the
// live Google rating + review count; nothing is hardcoded.
export default function GoogleReviews() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || el.dataset.loaded) return
    el.dataset.loaded = "1"
    const s = document.createElement("script")
    s.defer = true
    s.async = true
    s.src = "https://cdn.trustindex.io/loader-cert.js?dec178616c9c9278fa760ffdf96"
    el.appendChild(s)
  }, [])
  return <div ref={ref} />
}
