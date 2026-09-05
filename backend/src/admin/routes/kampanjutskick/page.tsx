import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"

/**
 * Teknikhouse.se — Kampanjutskick (1:1 mirror of Wikinggruppen campaigncarts.php)
 * Info + status page for campaign-cart sends. Native nav hidden; Wiki Snabbmeny on the left.
 */

const ADMIN = "/app"
const WF = "Verdana, Tahoma, Arial, sans-serif"

const CartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
)

type MenuItem = { emo: string; lab: string; href?: string }
const MENU: MenuItem[] = [
  { emo: "🏠", lab: "Start", href: `${ADMIN}/kontrollpanel` },
  { emo: "📋", lab: "Visa ordrar", href: `${ADMIN}/ordrar` },
  { emo: "📊", lab: "Statistik", href: `${ADMIN}/statistik` },
  { emo: "📦", lab: "Inköp / Lager", href: `${ADMIN}/inkop-lager` },
  { emo: "📇", lab: "Kunddatabas", href: `${ADMIN}/kunddatabas` },
  { emo: "🛒", lab: "Kampanjutskick", href: `${ADMIN}/kampanjutskick` },
  { emo: "✉️", lab: "Nyhetsbrev", href: `${ADMIN}/kontrollpanel?s=nyhetsbrev` },
  { emo: "📱", lab: "SMS-utskick", href: `${ADMIN}/kontrollpanel?s=sms` },
  { emo: "🤝", lab: "Avtalskunder", href: `${ADMIN}/customer-groups` },
  { emo: "🧰", lab: "Hantera produkter", href: `${ADMIN}/products` },
  { emo: "💡", lab: "Rekommendationer", href: `${ADMIN}/kontrollpanel?s=rekommendationer` },
  { emo: "🗂️", lab: "Hantera Varugrupper", href: `${ADMIN}/categories` },
  { emo: "🏷️", lab: "Rabattkoder", href: `${ADMIN}/promotions` },
  { emo: "🎁", lab: "Köp X betala för Y", href: `${ADMIN}/promotions` },
  { emo: "🚚", lab: "Fraktinställningar", href: `${ADMIN}/settings/locations` },
  { emo: "💳", lab: "Betalningsalternativ", href: `${ADMIN}/settings` },
  { emo: "📄", lab: "Redigerbara sidor", href: `${ADMIN}/kontrollpanel?s=sidor` },
  { emo: "📰", lab: "Nyheter", href: `${ADMIN}/kontrollpanel?s=nyheter` },
  { emo: "🔗", lab: "Länkar", href: `${ADMIN}/kontrollpanel?s=lankar` },
  { emo: "🔀", lab: "Import / Export", href: `${ADMIN}/products` },
  { emo: "⭐", lab: "Recensioner / Betyg", href: `${ADMIN}/kontrollpanel?s=recensioner` },
  { emo: "🖼️", lab: "Bildspel på 1:a sidan", href: `${ADMIN}/kontrollpanel?s=bildspel` },
  { emo: "📝", lab: "Blogg", href: `${ADMIN}/kontrollpanel?s=blogg` },
  { emo: "↪️", lab: "Hantera gamla URLer", href: `${ADMIN}/kontrollpanel?s=url301` },
  { emo: "🌐", lab: "Språk och valuta", href: `${ADMIN}/settings/store` },
  { emo: "🛍️", lab: "Google Shopping", href: `${ADMIN}/kontrollpanel?s=googlefeed` },
  { emo: "📧", lab: "E-postmallar", href: `${ADMIN}/kontrollpanel?s=epost` },
  { emo: "⚙️", lab: "Grundinställningar", href: `${ADMIN}/settings` },
]

function Snabbmeny({ online, unread, active }: { online: number | null; unread: number; active: string }) {
  return (
    <aside style={{ width: "220px", flexShrink: 0, borderRight: "1px solid #ccc", background: "#f4f4f4", fontFamily: WF }}>
      <div style={{ padding: "10px 12px", borderBottom: "1px solid #ccc", background: "#fff" }}>
        <div style={{ fontSize: "12px", fontWeight: 700 }}>Statistik</div>
        <div style={{ fontSize: "11px", color: "#444", marginTop: "4px" }}>Besökare online: <b>{online == null ? "—" : online} st</b></div>
        <div style={{ fontSize: "11px", color: "#444" }}>Olästa ordrar: <b>{unread} st</b></div>
      </div>
      <nav style={{ fontSize: "12px" }}>
        {MENU.map((m) => (
          <a key={m.lab} href={m.href}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", textDecoration: "none", color: "#000",
              borderBottom: "1px solid #e2e2e2", background: m.lab === active ? "#e2e2e2" : "transparent", fontWeight: m.lab === active ? 700 : 400 }}>
            <span style={{ width: "18px", textAlign: "center" }}>{m.emo}</span><span>{m.lab}</span>
          </a>
        ))}
        <a href={`${ADMIN}/login`} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", textDecoration: "none", color: "#a00", borderBottom: "1px solid #e2e2e2" }}>
          <span style={{ width: "18px", textAlign: "center" }}>⏻</span><span>Logga ut</span>
        </a>
      </nav>
    </aside>
  )
}

function KampanjutskickPage() {
  const [meta, setMeta] = useState<{ online: number | null; unread: number }>({ online: null, unread: 0 })
  useEffect(() => {
    const el = Array.from(document.querySelectorAll("div")).find((d) => {
      const c = typeof d.className === "string" ? d.className : ""
      return c.includes("w-[220px]") && c.includes("lg:flex") && c.includes("border-e")
    }) as HTMLElement | undefined
    const prev = el ? el.style.display : ""
    if (el) el.style.display = "none"
    return () => { if (el) el.style.display = prev }
  }, [])
  useEffect(() => { (async () => { try { const o = await fetch("/admin/orders?limit=1", { credentials: "include" }).then((r) => r.json()); setMeta((s) => ({ ...s, unread: o.count || 0 })) } catch {} })() }, [])

  const th: any = { border: "1px solid #bbb", padding: "6px 8px", fontWeight: 700, fontSize: "11px", textAlign: "left", background: "#cccccc" }
  const td: any = { border: "1px solid #e2e2e2", padding: "5px 8px", fontSize: "12px" }
  const P: any = { fontSize: "12px", color: "#333", lineHeight: 1.6, margin: "0 0 12px" }

  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny online={meta.online} unread={meta.unread} active="Kampanjutskick" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px" }}>
        <div style={{ textAlign: "center", marginBottom: "14px" }}>
          <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>🛒</span>
          <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>KAMPANJUTSKICK</span>
        </div>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <p style={P}>Detta verktyg för kampanjutskick ordnar automatiskt en unik länk till varje mottagare som får utskicket. När mottagaren klickar på länken kan vi t.ex. automatiskt ladda en varukorg med utvalda produkter, en rabattkod, och/eller mottagarens egna adressuppgifter. Mottagaren kan då direkt slutföra köpet!</p>
          <p style={P}>För att göra ett kampanjutskick, gör ett urval i <a href={`${ADMIN}/kunddatabas`} style={{ color: "#0060cc" }}>kunddatabasen</a> och klicka sedan på "Skapa kampanjutskick" längst ner på den sidan. Status för utskicken visas på denna sida (antal klick och ordrar).</p>
          <div style={{ textAlign: "center", fontWeight: 700, fontSize: "13px", margin: "18px 0 10px" }}>Skickade kampanjutskick</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={th}>Namn</th><th style={th}>Skickat</th><th style={{ ...th, textAlign: "right" }}>Mottagare</th><th style={{ ...th, textAlign: "right" }}>Klick</th><th style={{ ...th, textAlign: "right" }}>Ordrar</th></tr></thead>
            <tbody><tr><td colSpan={5} style={{ ...td, textAlign: "center", color: "#666" }}>Inga kampanjutskick har skickats ännu.</td></tr></tbody>
          </table>
        </div>
        <div style={{ textAlign: "center", marginTop: "22px", fontSize: "12px" }}>
          <a href={`${ADMIN}/kontrollpanel`} style={{ color: "#0060cc" }}>◄ Till kontrollpanelen</a>
        </div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Kampanjutskick", icon: CartIcon })
export default KampanjutskickPage
