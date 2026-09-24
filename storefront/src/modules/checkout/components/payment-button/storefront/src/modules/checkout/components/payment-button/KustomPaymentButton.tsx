"use client"

import { Text } from "@medusajs/ui"
import React, { useEffect, useRef, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "../error-message"
import Spinner from "@modules/common/icons/spinner"
import { initiatePaymentSession } from "@lib/data/cart"

// Kustom Checkout (Klarna/Kort, KCO v3). On mount we ask the backend
// /kustom/order route to create the KCO order from the cart (basket + Swedish
// VAT), register a Medusa payment session carrying the kustom_order_id so the
// order can be completed afterwards, and render Kustom's html_snippet (the
// Klarna iframe). Kustom redirects the buyer to /kassa-klar on completion,
// which finalises the Medusa order via placeOrder().
const KustomPaymentButton = ({
  cart,
  notReady,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [snippet, setSnippet] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)
  const holder = useRef<HTMLDivElement>(null)

  const BACKEND = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "").replace(
    /\/+$/,
    ""
  )

  const start = async () => {
    if (started.current || notReady) return
    started.current = true
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(BACKEND + "/kustom/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: cart.id }),
      })
      const j = await r.json()
      if (!r.ok || !j.html_snippet) {
        started.current = false
        setError("Kunde inte starta Klarna. Försök igen.")
        setLoading(false)
        return
      }
      await initiatePaymentSession(cart, {
        provider_id: "pp_kustom_kustom",
        context: { kustom_order_id: j.order_id },
      } as any)
      setSnippet(j.html_snippet)
    } catch (e: any) {
      started.current = false
      setError(e?.message || "Något gick fel. Försök igen.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!notReady) start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notReady])

  // dangerouslySetInnerHTML does not execute <script> tags; KCO needs them, so
  // re-inject each script node once the snippet is in the DOM.
  useEffect(() => {
    if (!snippet || !holder.current) return
    const scripts = holder.current.querySelectorAll("script")
    scripts.forEach((old) => {
      const s = document.createElement("script")
      for (const a of Array.from(old.attributes)) s.setAttribute(a.name, a.value)
      s.text = old.text
      old.parentNode?.replaceChild(s, old)
    })
  }, [snippet])

  if (error) {
    return <ErrorMessage error={error} data-testid="kustom-payment-error-message" />
  }

  if (loading || !snippet) {
    return (
      <div className="flex items-center gap-2 text-ui-fg-subtle">
        <Spinner />
        <Text className="txt-medium text-ui-fg-subtle">Laddar Klarna…</Text>
      </div>
    )
  }

  return <div ref={holder} dangerouslySetInnerHTML={{ __html: snippet }} />
}

export default KustomPaymentButton
