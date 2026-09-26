"use client"

import { useEffect, useRef, useState } from "react"
import { placeOrder, prepareKustomCart } from "@lib/data/cart"

// Kustom (Klarna/Kort) redirects the buyer here after a completed KCO purchase.
// The Medusa cart still lives in the cookie, and its Kustom payment session is
// now authorizable (Kustom reports checkout_complete). First the backend copies
// email, phone and addresses from the Kustom order onto the cart (Klarna-first
// checkout has no address step), then placeOrder() completes the cart into an
// order and redirects to the normal order confirmation page.
export default function KustomConfirmationPage() {
  const [error, setError] = useState<string | null>(null)
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    const run = async () => {
      let kid = ""
      try {
        kid = new URLSearchParams(window.location.search).get("kustom_order_id") || ""
      } catch {
        kid = ""
      }
      if (kid) {
        let r: any = await prepareKustomCart(kid)
        if (r && !r.ok && r.reason === "not_complete") {
          await new Promise((ok) => setTimeout(ok, 2500))
          r = await prepareKustomCart(kid)
        }
      }
      await placeOrder()
    }
    run().catch((e: any) => {
      /* redirect() from the server action is not an error */
      if (e && typeof e.digest === "string" && e.digest.startsWith("NEXT_REDIRECT")) {
        return
      }
      setError(e?.message || "Kunde inte slutföra ordern.")
    })
  }, [])

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "56px auto 80px",
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
          <div
            aria-hidden="true"
            className="mx-auto mb-5 h-10 w-10 rounded-full border-4 border-[#FFE0E0] border-t-[#F50000] animate-spin"
          />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#14161C" }}>
            Vi slutför din order
          </h1>
          <p style={{ color: "#6B7280", marginTop: 8, lineHeight: 1.5 }}>
            Ett ögonblick, vi bekräftar betalningen och skapar din order.
            Stäng inte sidan.
          </p>
        </>
      )}
    </div>
  )
}
