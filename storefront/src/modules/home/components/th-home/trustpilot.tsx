"use client"

import { useEffect, useRef } from "react"

// Official Trustpilot TrustBox (Mini template) for Teknikhouse.se.
// Renders the live TrustScore + review count straight from Trustpilot —
// no hardcoded rating, so it always shows the real, current score.
export default function TrustpilotBox() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const init = () => {
      // @ts-ignore - injected by the Trustpilot bootstrap script
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
      data-template-id="53aa8807dec7e10d38f59f32"
      data-businessunit-id="5b29870bd309050001e9572e"
      data-style-height="150px"
      data-style-width="100%"
      data-theme="light"
    >
      <a href="https://se.trustpilot.com/review/teknikhouse.se" target="_blank" rel="noreferrer">
        Trustpilot
      </a>
    </div>
  )
}
