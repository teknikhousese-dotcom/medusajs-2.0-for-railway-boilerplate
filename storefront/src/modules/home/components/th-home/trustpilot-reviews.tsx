"use client"

import { useEffect, useRef } from "react"

// Official Trustpilot Review Carousel — renders real recent 5-star reviews for
// Teknikhouse.se as cards, pulled live by Trustpilot. Filtered to 5 stars and
// Swedish. Nothing is hardcoded, so reviews stay current automatically.
export default function TrustpilotReviews() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const init = () => {
      // @ts-ignore
      if (typeof window !== "undefined" && window.Trustpilot && ref.current) {
        // @ts-ignore
        window.Trustpilot.loadFromElement(ref.current, true)
      }
    }
    // @ts-ignore
    if (typeof window !== "undefined" && window.Trustpilot) { init(); return }
    const ID = "tp-bootstrap"
    const existing = document.getElementById(ID) as HTMLScriptElement | null
    if (existing) { existing.addEventListener("load", init); return }
    const s = document.createElement("script")
    s.id = ID
    s.src = "https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
    s.async = true
    s.onload = init
    document.head.appendChild(s)
  }, [])
  return (
    <div
      ref={ref}
      className="trustpilot-widget"
      data-locale="sv-SE"
      data-template-id="53aa8912dec7e10d38f59f36"
      data-businessunit-id="5b29870bd309050001e9572e"
      data-style-height="280px"
      data-style-width="100%"
      data-stars="5"
      data-review-languages="sv"
    >
      <a href="https://se.trustpilot.com/review/teknikhouse.se" target="_blank" rel="noreferrer">
        Trustpilot
      </a>
    </div>
  )
}
