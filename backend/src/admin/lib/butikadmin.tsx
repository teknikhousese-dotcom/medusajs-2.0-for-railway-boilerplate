import { useEffect, useState } from "react"

/**
 * Teknikhouse.se butikadmin — SHARED shell (single source of truth).
 * One canonical Snabbmeny (with Wiki's indented sub-items), one bulletproof
 * native-sidebar hide, and shared jget/jsend helpers. Every mirror page imports
 * from here so the menu never drifts and the double-menu race can't come back.
 */
export const ADMIN = "/app"
export const WF = "Verdana, Tahoma, Arial, sans-serif"

export type MenuItem = { emo?: string; lab: string; href: string; children?: MenuItem[] }

export const MENU: MenuItem[] = [
  { emo: "🏠", lab: "Start", href: `${ADMIN}/kontrollpanel` },
  { emo: "📋", lab: "Visa ordrar", href: `${ADMIN}/ordrar` },
  { emo: "📊", lab: "Statistik", href: `${ADMIN}/statistik` },
  { emo: "📦", lab: "Inköp / Lager", href: `${ADMIN}/inkop-lager` },
  { emo: "📇", lab: "Kunddatabas", href: `${ADMIN}/kunddatabas` },
  { emo: "🛒", lab: "Kampanjutskick", href: `${ADMIN}/kampanjutskick` },
  {
    emo: "✉️", lab: "Nyhetsbrev", href: `${ADMIN}/nyhetsbrev`, children: [
      { lab: "Visa prenumeranter", href: `${ADMIN}/nyhetsbrev?s=recipients` },
      { lab: "Skriv nytt nyhetsbrev", href: `${ADMIN}/nyhetsbrev?s=new` },
      { lab: "Hantera skickade nyhetsbrev", href: `${ADMIN}/nyhetsbrev?s=letters` },
      { lab: "Hantera HTML-mallar", href: `${ADMIN}/nyhetsbrev?s=templates` },
    ],
  },
  { emo: "📱", lab: "SMS-utskick", href: `${ADMIN}/sms-utskick` },
  { emo: "🤝", lab: "Avtalskunder", href: `${ADMIN}/avtalskunder` },
  {
    emo: "🛍", lab: "Hantera produkter", href: `${ADMIN}/hantera-produkter`, children: [
      { lab: "Lägg in ny produkt", href: `${ADMIN}/products/create` },
      { lab: "Kopiera produkt", href: `${ADMIN}/hantera-produkter?action=copy` },
      { lab: "Produktsortering", href: `${ADMIN}/hantera-produkter?action=sorting` },
      { lab: "Produktfiltrering", href: `${ADMIN}/hantera-produkter?action=filter` },
    ],
  },
  { emo: "💡", lab: "Rekommendationer", href: `${ADMIN}/rekommendationer` },
  {
    emo: "🗂️", lab: "Hantera Varugrupper", href: `${ADMIN}/categories`, children: [
      { lab: "Ny varugrupp", href: `${ADMIN}/categories/create` },
      { lab: "Ordning på varugrupperna", href: `${ADMIN}/categories?sort=1` },
    ],
  },
  { emo: "🏷️", lab: "Rabattkoder", href: `${ADMIN}/promotions` },
  { emo: "🎁", lab: "Köp X betala för Y", href: `${ADMIN}/promotions` },
  { emo: "🚚", lab: "Fraktinställningar", href: `${ADMIN}/settings/locations` },
  { emo: "💳", lab: "Betalningsalternativ", href: `${ADMIN}/settings` },
  { emo: "📄", lab: "Redigerbara sidor", href: `${ADMIN}/redigerbara-sidor` },
  {
    emo: "📰", lab: "Nyheter", href: `${ADMIN}/nyheter`, children: [
      { lab: "Skapa ny nyhet", href: `${ADMIN}/nyheter?new=1` },
    ],
  },
  { emo: "🔗", lab: "Länkar", href: `${ADMIN}/lankar` },
  { emo: "🔀", lab: "Import / Export", href: `${ADMIN}/products` },
  { emo: "⭐", lab: "Recensioner / Betyg", href: `${ADMIN}/recensioner` },
  { emo: "🖼️", lab: "Bildspel på 1:a sidan", href: `${ADMIN}/bildspel` },
  { emo: "📝", lab: "Blogg", href: `${ADMIN}/blogg` },
  { emo: "↪️", lab: "Hantera gamla URLer", href: `${ADMIN}/kontrollpanel?s=url301` },
  { emo: "🌐", lab: "Språk och valuta", href: `${ADMIN}/settings/store` },
  { emo: "🈳", lab: "Översättningar", href: `${ADMIN}/kontrollpanel?s=translations` },
  { emo: "🛍️", lab: "Google Shopping", href: `${ADMIN}/google-shopping` },
  { emo: "📧", lab: "E-postmallar", href: `${ADMIN}/epostmallar` },
  { emo: "⚙️", lab: "Grundinställningar", href: `${ADMIN}/settings` },
]

export async function jget(u: string) { return fetch(u, { credentials: "include" }).then((r) => r.json()) }
export async function jsend(u: string, m: string, b?: any) {
  return fetch(u, { method: m, credentials: "include", headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined }).then((r) => r.json())
}

/** Bulletproof: hide the native Medusa sidebar via a persistent stylesheet rule.
 *  A CSS rule matches the native sidebar whenever it mounts (no mount-order race),
 *  and is removed on unmount so native pages keep their own sidebar. */
function useHideNativeSidebar() {
  useEffect(() => {
    const id = "__butikadmin_hide_native"
    let st = document.getElementById(id) as HTMLStyleElement | null
    if (!st) {
      st = document.createElement("style"); st.id = id
      st.textContent = 'div.h-screen.w-\\[220px\\].border-e.lg\\:flex{display:none !important}@media print{aside[data-bm="menu"]{display:none !important}body{background:#fff}}'
      document.head.appendChild(st)
    }
    return () => { const e = document.getElementById(id); if (e) e.remove() }
  }, [])
}

export function Snabbmeny({ active }: { active?: string }) {
  useHideNativeSidebar()
  const [unread, setUnread] = useState(0)
  useEffect(() => { jget(`${"/admin"}/orders?limit=1`).then((o) => setUnread(o.count || 0)).catch(() => {}) }, [])

  const path = typeof window !== "undefined" ? window.location.pathname + window.location.search : ""
  const isActive = (m: MenuItem) => {
    if (active) return m.lab === active
    // auto-detect by path (ignore query for parents)
    const base = m.href.split("?")[0]
    return path.split("?")[0] === base
  }

  const rowStyle = (on: boolean, sub: boolean): any => ({
    display: "flex", alignItems: "center", gap: "8px",
    padding: sub ? "4px 12px 4px 34px" : "6px 12px",
    textDecoration: "none", color: sub ? "#333" : "#000",
    borderBottom: "1px solid #e2e2e2", background: on ? "#e2e2e2" : "transparent",
    fontWeight: on ? 700 : 400, fontSize: sub ? "11px" : "12px",
  })

  return (
    <aside data-bm="menu" style={{ width: "220px", flexShrink: 0, borderRight: "1px solid #ccc", background: "#f4f4f4", fontFamily: WF }}>
      <div style={{ padding: "10px 12px", borderBottom: "1px solid #ccc", background: "#fff" }}>
        <div style={{ fontSize: "12px", fontWeight: 700 }}>Statistik</div>
        <div style={{ fontSize: "11px", color: "#444", marginTop: "4px" }}>Besökare online: <b>— st</b></div>
        <div style={{ fontSize: "11px", color: "#444" }}>Olästa ordrar: <b>{unread} st</b></div>
      </div>
      <nav style={{ fontSize: "12px" }}>
        {MENU.map((m) => (
          <div key={m.lab}>
            <a href={m.href} style={rowStyle(isActive(m), false)}>
              <span style={{ width: "18px", textAlign: "center" }}>{m.emo}</span><span>{m.lab}</span>
            </a>
            {m.children && m.children.map((c) => (
              <a key={c.lab} href={c.href} style={rowStyle(isActive(c), true)}>
                <span style={{ width: "18px", textAlign: "center", color: "#999" }}>›</span><span>{c.lab}</span>
              </a>
            ))}
          </div>
        ))}
        <a href={`${ADMIN}/login`} style={{ ...rowStyle(false, false), color: "#a00" }}>
          <span style={{ width: "18px", textAlign: "center" }}>⏻</span><span>Logga ut</span>
        </a>
      </nav>
    </aside>
  )
}

/** Standard page shell: hidden native sidebar + Snabbmeny + white content panel. */
export function Shell({ active, children }: { active?: string; children: any }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny active={active} />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px" }}>{children}</div>
    </div>
  )
}
