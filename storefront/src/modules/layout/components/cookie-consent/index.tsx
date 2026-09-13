"use client"

import { useEffect, useState } from "react"

/**
 * Lightweight GDPR/ePrivacy cookie consent banner, teknikhouse-style.
 * Remembers the choice in localStorage so it only shows once.
 */
export default function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem("th_cookie_consent")) setShow(true)
    } catch {
      setShow(true)
    }
  }, [])

  const decide = (value: "all" | "necessary") => {
    try {
      localStorage.setItem("th_cookie_consent", value)
    } catch {}
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie-samtycke"
      style={{
        position: "fixed",
        left: "16px",
        right: "16px",
        bottom: "16px",
        zIndex: 1000,
        maxWidth: "520px",
        margin: "0 auto",
        background: "#fff",
        border: "1px solid #efeae5",
        borderRadius: "16px",
        boxShadow: "0 12px 40px rgba(0,0,0,.16)",
        padding: "18px 20px",
        fontFamily: '"Poppins",ui-rounded,system-ui,sans-serif',
      }}
    >
      <div style={{ fontWeight: 600, fontSize: "16px", color: "#1b1714", marginBottom: "6px" }}>
        Vi använder cookies
      </div>
      <p style={{ fontSize: "13.5px", lineHeight: 1.55, color: "#6f685f", margin: "0 0 14px" }}>
        Vi använder cookies för funktion på sidan, analys av data och marknadsföring.{" "}
        <a href="/info/integritetspolicy" style={{ color: "#F50000", textDecoration: "underline" }}>
          Läs mer
        </a>
      </p>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => decide("all")}
          style={{
            flex: "1 1 auto",
            background: "#F50000",
            color: "#fff",
            border: 0,
            borderRadius: "9px",
            padding: "10px 16px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Acceptera alla
        </button>
        <button
          type="button"
          onClick={() => decide("necessary")}
          style={{
            flex: "1 1 auto",
            background: "#faf8f6",
            color: "#1b1714",
            border: "1px solid #efeae5",
            borderRadius: "9px",
            padding: "10px 16px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Endast nödvändiga
        </button>
      </div>
    </div>
  )
}
