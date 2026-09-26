import React from "react"

const BACKEND = process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://backend-production-c278d.up.railway.app"

type Review = { author?: string; rating?: number; comment?: string; created_at?: string }

function Stars({ value }: { value: number }) {
  const full = Math.round(value || 0)
  const arr = [1, 2, 3, 4, 5]
  return (
    <span aria-label={String(value) + " av 5"} style={{ color: "#f5a623", letterSpacing: "1px" }}>
      {arr.map((n) => (<span key={n}>{n <= full ? "★" : "☆"}</span>))}
    </span>
  )
}

export default async function ProductReviews({ productId, productTitle }: { productId: string; productTitle?: string }) {
  let data: { reviews: Review[]; count: number; average: number } = { reviews: [], count: 0, average: 0 }
  try {
    const res = await fetch(BACKEND + "/product-reviews?product_id=" + encodeURIComponent(productId), { next: { revalidate: 300 } })
    if (res.ok) data = await res.json()
  } catch (e) {}
  if (!data || !data.count) return null

  return (
    <div className="content-container" style={{ paddingTop: "8px", paddingBottom: "24px" }}>
      <div style={{ borderTop: "1px solid #eee", paddingTop: "20px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px" }}>Kundomdömen</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <Stars value={data.average} />
          <span style={{ fontWeight: 600 }}>{Number(data.average).toFixed(1)}</span>
          <span style={{ color: "#777", fontSize: "14px" }}>({data.count} omdömen)</span>
        </div>
        <div style={{ display: "grid", gap: "14px" }}>
          {(data.reviews || []).map((r, i) => (
            <div key={i} style={{ border: "1px solid #eee", borderRadius: "10px", padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <Stars value={r.rating || 5} />
                <strong style={{ fontSize: "14px" }}>{r.author || "Kund"}</strong>
                {r.created_at ? <span style={{ color: "#999", fontSize: "12px" }}>{String(r.created_at).slice(0, 10)}</span> : null}
              </div>
              {r.comment ? <p style={{ margin: 0, fontSize: "14px", color: "#333", lineHeight: 1.5 }}>{r.comment}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
