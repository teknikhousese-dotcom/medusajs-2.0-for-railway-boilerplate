"use client"

import { Button, Text } from "@medusajs/ui"
import React, { useEffect, useRef, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "../error-message"
import Spinner from "@modules/common/icons/spinner"
import { placeOrder, initiatePaymentSession } from "@lib/data/cart"

// Swish Handel pay button: creates a fresh Swish request on click, shows the QR
// (desktop) or opens the swish:// deep-link (mobile), polls status, and places
// the order when the payer approves. Backend routes: /swish/status, /swish/qr.
const SwishPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const BACKEND = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "").replace(/\/+$/, "")

  const stop = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }
  useEffect(() => () => stop(), [])

  const onPaid = async () => {
    stop()
    await placeOrder().catch((err) => {
      setErrorMessage(err.message)
      setWaiting(false)
      setSubmitting(false)
    })
  }

  const startPolling = (swishId: string) => {
    const started = Date.now()
    pollRef.current = setInterval(async () => {
      if (Date.now() - started > 210000) {
        stop()
        setWaiting(false)
        setSubmitting(false)
        setErrorMessage("Tiden gick ut. Försök igen.")
        return
      }
      try {
        const r = await fetch(BACKEND + "/swish/status?id=" + swishId, { cache: "no-store" })
        const j = await r.json()
        const st = String(j.status || "").toUpperCase()
        if (st === "PAID") return onPaid()
        if (st === "DECLINED" || st === "ERROR" || st === "CANCELLED") {
          stop()
          setWaiting(false)
          setSubmitting(false)
          setErrorMessage(
            st === "DECLINED"
              ? "Betalningen nekades i Swish-appen."
              : "Betalningen avbröts. Försök igen."
          )
        }
      } catch {
        /* transient — keep polling */
      }
    }, 2500)
  }

  const handlePayment = async () => {
    setErrorMessage(null)
    setSubmitting(true)
    try {
      const resp: any = await initiatePaymentSession(cart, { provider_id: "pp_swish_swish" })
      const sessions = resp?.payment_collection?.payment_sessions || []
      const s =
        sessions.find((x: any) => x.provider_id === "pp_swish_swish") ||
        sessions[sessions.length - 1]
      const data = s?.data || {}
      if (data.error || !data.swishId) {
        setSubmitting(false)
        setErrorMessage("Kunde inte starta Swish. Försök igen.")
        return
      }
      const isMobile =
        typeof navigator !== "undefined" &&
        /android|iphone|ipad|ipod/i.test(navigator.userAgent)
      setWaiting(true)
      startPolling(data.swishId)
      if (isMobile && data.token) {
        const ret = typeof window !== "undefined" ? window.location.href : ""
        window.location.href =
          "swish://paymentrequest?token=" + data.token + "&callbackurl=" + encodeURIComponent(ret)
      } else {
        setQrToken(data.token || null)
      }
    } catch (err: any) {
      setSubmitting(false)
      setWaiting(false)
      setErrorMessage(err.message || "Något gick fel. Försök igen.")
    }
  }

  if (waiting) {
    return (
      <div className="flex flex-col items-center gap-3">
        {qrToken ? (
          <>
            <Text className="txt-medium text-ui-fg-subtle text-center">
              Skanna QR-koden med Swish-appen för att betala.
            </Text>
            <img
              src={BACKEND + "/swish/qr?token=" + encodeURIComponent(qrToken) + "&size=260"}
              alt="Swish QR"
              width={260}
              height={260}
              style={{ borderRadius: 12 }}
            />
          </>
        ) : (
          <Text className="txt-medium text-ui-fg-subtle text-center">
            Öppnar Swish-appen… godkänn betalningen i appen.
          </Text>
        )}
        <div className="flex items-center gap-2 text-ui-fg-subtle">
          <Spinner />
          <span>Väntar på betalning…</span>
        </div>
        <ErrorMessage error={errorMessage} data-testid="swish-payment-error-message" />
      </div>
    )
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid={dataTestId || "submit-order-button"}
      >
        Betala med Swish
      </Button>
      <ErrorMessage error={errorMessage} data-testid="swish-payment-error-message" />
    </>
  )
}

export default SwishPaymentButton
