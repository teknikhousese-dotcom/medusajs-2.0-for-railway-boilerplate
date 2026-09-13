"use client"

import { useState } from "react"

/**
 * Category SEO intro with a "Läs mer" toggle, teknikhouse-style. Collapsed it
 * shows a few lines; expanded it shows the full HTML description.
 */
export default function ReadMore({ html }: { html: string }) {
  const [open, setOpen] = useState(false)
  if (!html) return null
  return (
    <div style={{ marginBottom: "22px" }}>
      <div
        className="thintro"
        style={{
          color: "#4a4640",
          fontSize: "14.5px",
          lineHeight: 1.6,
          maxWidth: "820px",
          overflow: "hidden",
          maxHeight: open ? "none" : "78px",
          position: "relative",
          maskImage: open ? "none" : "linear-gradient(#000 55%, transparent)",
          WebkitMaskImage: open ? "none" : "linear-gradient(#000 55%, transparent)",
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          marginTop: "6px",
          background: "none",
          border: 0,
          padding: 0,
          cursor: "pointer",
          color: "#F50000",
          fontWeight: 600,
          fontSize: "14px",
        }}
      >
        {open ? "Visa mindre ▲" : "Läs mer ▾"}
      </button>
    </div>
  )
}
