"use client"

import { Button } from "@medusajs/ui"
import React, { useEffect, useRef, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "../error-message"
import { placeOrder, initiatePaymentSession } from "@lib/data/cart"

const BACKEND = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "").replace(
  /\/+$/,
  ""
)
const KLARNA_SDK = "https://x.klarnacdn.net/kp/lib/v1/api.js"

declare global {
  interface Window {
    Klarna?: any
  }
}

type Props = {
  cart: HttpTypes.StoreCart
  "data-testid"?: string
}

// Klarna Payments widget-flöde:
// 1) skapa session (client_token) 2) ladda Klarnas SDK + widget
// 3) authorize -> spara token på sessionen -> slutför ordern.
const KlarnaPaymentButton = ({ cart, "data-testid": dataTestid }: Props) => {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const [clientToken, setClientToken] = useState<string | null>(null)
  const [category, setCategory] = useState<string>("")
  const [widgetLoaded, setWidgetLoaded] = useState(false)
  const startedRef = useRef(false)

  // Ladda Klarnas SDK en gång.
  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    if (window.Klarna) {
      setSdkReady(true)
      return
    }
    if (document.getElementById("klarna-kp-sdk")) {
      return
    }
    const s = document.createElement("script")
    s.id = "klarna-kp-sdk"
    s.src = KLARNA_SDK
    s.async = true
    s.onload = () => setSdkReady(true)
    s.onerror = () =>
      setError("Kunde inte ladda Klarna. Ladda om sidan och försök igen.")
    document.body.appendChild(s)
  }, [])

  // Skapa Klarna-session och hämta client_token.
  useEffect(() => {
    if (startedRef.current) {
      return
    }
    startedRef.current = true
    ;(async () => {
      try {
        const updated: any = await initiatePaymentSession(cart, {
          provider_id: "pp_klarna_klarna",
        })
        const coll =
          updated?.payment_collection || updated?.cart?.payment_collection
        const sess = (coll?.payment_sessions || []).find(
          (s: any) => s.provider_id === "pp_klarna_klarna"
        )
        const token = sess?.data?.client_token
        const cats = sess?.data?.payment_method_categories || []
        if (!token) {
          setError("Kunde inte starta Klarna. Försök igen.")
          return
        }
        setClientToken(token)
        setCategory(cats?.[0]?.identifier || "pay_later")
      } catch (e: any) {
        setError(e?.message || "Kunde inte starta Klarna.")
      }
    })()
  }, [cart])

  // Rendera Klarna-widgeten när SDK + token är klara.
  useEffect(() => {
    if (!sdkReady || !clientToken || !category || widgetLoaded) {
      return
    }
    try {
      window.Klarna.Payments.init({ client_token: clientToken })
      window.Klarna.Payments.load(
        {
          container: "#klarna-payments-container",
          payment_method_category: category,
        },
        () => setWidgetLoaded(true)
      )
    } catch (e: any) {
      setError(e?.message || "Kunde inte visa Klarna.")
    }
  }, [sdkReady, clientToken, category, widgetLoaded])

  const handlePay = () => {
    setError(null)
    setSubmitting(true)
    try {
      window.Klarna.Payments.authorize(
        { payment_method_category: category },
        {},
        async (res: any) => {
          if (res?.approved && res?.authorization_token) {
            try {
              await fetch(`${BACKEND}/klarna/authorize`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  cart_id: cart.id,
                  authorization_token: res.authorization_token,
                }),
              })
              await placeOrder()
            } catch (e: any) {
              setError(e?.message || "Kunde inte slutföra beställningen.")
              setSubmitting(false)
            }
          } else {
            setError(
              "Klarna godkände inte betalningen. Försök igen eller välj ett annat betalsätt."
            )
            setSubmitting(false)
          }
        }
      )
    } catch (e: any) {
      setError(e?.message || "Något gick fel med Klarna.")
      setSubmitting(false)
    }
  }

  return (
    <>
      <div id="klarna-payments-container" />
      <Button
        onClick={handlePay}
        size="large"
        isLoading={submitting}
        disabled={submitting || !widgetLoaded}
        data-testid={dataTestid}
        className="mt-4"
      >
        Slutför köp med Klarna
      </Button>
      <ErrorMessage
        error={error}
        data-testid="klarna-payment-error-message"
      />
    </>
  )
}

export default KlarnaPaymentButton
