import { ImageResponse } from "next/og"

import { getStoreName } from "@lib/util/env"

// Teknikhouse social share card — own-branded, no external assets.
export const alt = "Teknikhouse"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpengraphImage() {
  const storeName = getStoreName()

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0B0C10",
          color: "#ffffff",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontSize: 26,
            color: "#8b93a7",
          }}
        >
          Reservdelar · Tillbehör · Begagnade mobiler
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontSize: 128,
            fontWeight: 900,
            letterSpacing: "-0.04em",
          }}
        >
          <span>teknik</span>
          <span style={{ color: "#F50000" }}>house</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 30,
            color: "#8b93a7",
          }}
        >
          <span>{storeName}.se</span>
          <span>Rätt del. Första gången.</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
