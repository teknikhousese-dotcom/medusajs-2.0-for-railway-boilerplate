"use client"

import { useEffect, useRef, useState } from "react"
import { placeOrder } from "@lib/data/cart"

// Kustom (Klarna/Kort) redirects the buyer here after a completed KCO purchase.
// The Medusa cart still lives in the cookie, and its Kustom payment session is
// now authorizable (Kustom reports checkout_complete), so placeOrder() completes
// the cart into an order and redirects to the normal order confirmation page.
export default function KustomConfirmationPage() {
  const [error, setError] = useState<string | null>(null)
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    placeOrder().catch((e: any) =>
      setError(e?.message || "Kunde inte slutföra ordern.")
    )
  }, [])

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "80px auto",
        textAlign: "center",
        padding: "0 20px",
      }}
    >
      {error ? (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#14161C" }}>
            Något gick fel
          </h1>
          <p style={{ color: "#6B7280", marginTop: 8, lineHeight: 1.5 }}>
            {error} Om din betalning genomfördes, kontakta oss på
            info@teknikhouse.se så hjälper vi dig direkt.
          </p>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#14161C" }}>
            Slutför din order…
          </h1>
          <p style={{ color: "#6B7280", marginTop: 8, lineHeight: 1.5 }}>
            Ett ögonblick, vi bekräftar din betalning och skapar din order.
          </p>
        </>
      )}
    </div>
  )
}
