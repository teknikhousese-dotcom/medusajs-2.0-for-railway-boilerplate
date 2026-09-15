"use client"

import { useState } from "react"

/**
 * Category intro description with a working "Läs mer" / "Visa mindre" toggle.
 * Collapsed it shows a few lines; expanded it shows the full HTML description.
 */
const ReadMore = ({ html }: { html?: string }) => {
  const [open, setOpen] = useState(false)
  if (!html) return null
  const plainLen = html.replace(/<[^>]*>/g, "").trim().length
  const long = plainLen > 260
  return (
    <div className="thintro">
      <div
        style={long && !open ? { maxHeight: "6.5em", overflow: "hidden" } : undefined}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {long ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            marginTop: 8,
            color: "#F50000",
            fontWeight: 500,
            fontSize: 14,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          {open ? "Visa mindre" : "Läs mer"}
        </button>
      ) : null}
    </div>
  )
}

export default ReadMore
