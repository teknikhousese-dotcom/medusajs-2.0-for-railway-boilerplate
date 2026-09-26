"use client"

import { useEffect, useState } from "react"

const CONSENT_KEY = "th_cookie_consent"
let trackingLoaded = false

function addScript(src: string, target: HTMLElement) {
  const s = document.createElement("script")
  s.async = true
  s.src = src
  target.appendChild(s)
}

function injectHtml(html: any, target: HTMLElement) {
  if (!html || typeof html !== "string") return
  const box = document.createElement("div")
  box.innerHTML = html.replace(/<\/?head>/gi, "")
  Array.from(box.childNodes).forEach((node) => {
    if (node.nodeType !== 1) return
    const el = node as Element
    if (el.tagName === "SCRIPT") {
      const old = el as HTMLScriptElement
      const s = document.createElement("script")
      Array.from(old.attributes).forEach((a) => s.setAttribute(a.name, a.value))
      if (old.text) s.text = old.text
      target.appendChild(s)
    } else {
      document.body.appendChild(el)
    }
  })
}

/**
 * Loads the statistics/marketing tags configured in Grundinställningar
 * (GTM, Google tag, Facebook pixel, Bing UET, TrustBox, extra head code).
 * Only called after the visitor has chosen "Acceptera alla".
 */
async function loadTracking() {
  if (trackingLoaded || typeof window === "undefined") return
  trackingLoaded = true
  let cfg: any = {}
  try {
    const r = await fetch("/api/tracking-config", { cache: "no-store" })
    if (r.ok) cfg = await r.json()
  } catch (e) {}
  const w: any = window
  const head = document.head
  try {
    const gtm = String(cfg.googleTagManagerID || "").trim()
    if (/^GTM-[A-Z0-9]+$/i.test(gtm)) {
      w.dataLayer = w.dataLayer || []
      w.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" })
      addScript("https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(gtm), head)
    }
    const ga = String(cfg.googleAnalyticsID || "").trim()
    if (/^(G|UA|AW|GT)-[A-Z0-9-]+$/i.test(ga)) {
      w.dataLayer = w.dataLayer || []
      if (!w.gtag) w.gtag = function () { w.dataLayer.push(arguments) }
      w.gtag("js", new Date())
      w.gtag("config", ga)
      addScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ga), head)
    }
    const fb = String(cfg.facebookPixelID || "").trim()
    if (/^\d{6,20}$/.test(fb) && !w.fbq) {
      const n: any = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }
      w.fbq = n
      if (!w._fbq) w._fbq = n
      n.push = n
      n.loaded = true
      n.version = "2.0"
      n.queue = []
      addScript("https://connect.facebook.net/en_US/fbevents.js", head)
      w.fbq("init", fb)
      w.fbq("track", "PageView")
    }
  } catch (e) {}
  try { injectHtml(cfg.counterCodeEarly, head) } catch (e) {}
  try { injectHtml(cfg.extraHeadCode, head) } catch (e) {}
  try { injectHtml(cfg.counterCode, document.body) } catch (e) {}
}

/**
 * Lightweight GDPR/ePrivacy cookie consent banner, teknikhouse-style.
 * Remembers the choice in localStorage so it only shows once.
 */
export default function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let v: string | null = null
    try {
      v = localStorage.getItem(CONSENT_KEY)
    } catch {
      v = null
    }
    if (v === "all") loadTracking()
    else if (!v) setShow(true)
  }, [])

  const decide = (value: "all" | "necessary") => {
    try {
      localStorage.setItem("th_cookie_consent", value)
    } catch {}
    setShow(false)
    if (value === "all") loadTracking()
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
