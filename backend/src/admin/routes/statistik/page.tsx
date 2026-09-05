import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useMemo, useState } from "react"

/**
 * Teknikhouse.se — Statistik (1:1 mirror of Wikinggruppen dashboard.php)
 * STATISTIK / INVENTERING with Dashboard / Försäljningstabell / Lagerbevakning tabs.
 * Cards computed live from /admin/orders where the data exists in Medusa; cards that
 * need visitor analytics (Besökare, Konvertering, Enheter, Kön, Åldersgrupp, Mest
 * visade/sökta) show the Wiki layout with a "Kräver besöksstatistik" note until GA4
 * is wired. Native Medusa nav hidden; Wiki Snabbmeny on the left.
 */

const ADMIN = "/app"
const WF = "Verdana, Tahoma, Arial, sans-serif"

const StatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" /><rect x="12" y="8" width="3" height="10" /><rect x="17" y="4" width="3" height="14" />
  </svg>
)

const nf = (n: number) => new Intl.NumberFormat("sv-SE").format(Math.round(Number(n || 0)))
const sek = (n: number) => nf(n) + " kr"
const pct = (n: number) => (Number(n || 0)).toFixed(2).replace(/\.?0+$/, "") + "%"

type MenuItem = { emo: string; lab: string; href?: string }
const MENU: MenuItem[] = [
  { emo: "🏠", lab: "Start", href: `${ADMIN}/kontrollpanel` },
  { emo: "📋", lab: "Visa ordrar", href: `${ADMIN}/ordrar` },
  { emo: "📊", lab: "Statistik", href: `${ADMIN}/statistik` },
  { emo: "📦", lab: "Inköp / Lager", href: `${ADMIN}/kontrollpanel?s=lager` },
  { emo: "📇", lab: "Kunddatabas", href: `${ADMIN}/customers` },
  { emo: "🛒", lab: "Kampanjutskick", href: `${ADMIN}/kontrollpanel?s=kampanjutskick` },
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

// ---- card primitives (Wiki grey-header cards) ----
function Card({ title, children }: { title: string; children: any }) {
  return (
    <div style={{ border: "1px solid #cfcfcf", borderRadius: "3px", background: "#fff", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#dcdcdc", padding: "4px 8px", borderBottom: "1px solid #cfcfcf" }}>
        <span style={{ color: "#666", fontSize: "11px" }}>⌄</span>
        <span style={{ fontWeight: 700, fontSize: "12px" }}>{title}</span>
        <span style={{ color: "#999", fontSize: "11px" }}>?</span>
      </div>
      <div style={{ padding: "10px 12px", minHeight: "96px" }}>{children}</div>
    </div>
  )
}
const delta = (v: number) => {
  const up = v >= 0
  return <span style={{ color: up ? "#1a7f1a" : "#cc0000", fontWeight: 700, marginLeft: "8px" }}>{up ? "+" : ""}{v.toFixed(1)}%</span>
}
function TriRow({ big, rows }: { big: any; rows: { k: string; v: any; d?: number }[] }) {
  return (
    <table style={{ width: "100%", fontSize: "12px" }}><tbody>
      <tr><td style={{ color: "#333", width: "60px" }}>Igår</td><td style={{ fontSize: "26px", fontWeight: 700, textAlign: "left" }} colSpan={2}>{big}</td></tr>
      {rows.map((r) => (
        <tr key={r.k}><td style={{ color: "#333", paddingTop: "4px" }}>{r.k}</td>
          <td style={{ textAlign: "right", fontWeight: 700, color: (r.d ?? 0) >= 0 ? "#1a7f1a" : "#cc0000", paddingTop: "4px" }}>{r.v}</td>
          <td style={{ textAlign: "right", paddingTop: "4px", width: "70px" }}>{r.d != null ? delta(r.d) : null}</td></tr>
      ))}
    </tbody></table>
  )
}
function ListRows({ rows }: { rows: { k: any; v: string }[] }) {
  return (
    <table style={{ width: "100%", fontSize: "12px" }}><tbody>
      {rows.length === 0 ? <tr><td style={{ color: "#999" }}>Ingen data ännu.</td></tr> :
        rows.map((r, i) => (<tr key={i}><td style={{ padding: "2px 0" }}>{r.k}</td><td style={{ textAlign: "right", padding: "2px 0" }}>{r.v}</td></tr>))}
    </tbody></table>
  )
}
function Bar({ label, p }: { label: string; p: number }) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ fontSize: "12px", marginBottom: "2px" }}>{label} {Math.round(p)}%</div>
      <div style={{ height: "10px", background: "#eee" }}><div style={{ height: "10px", width: Math.max(0, Math.min(100, p)) + "%", background: "#5b9bd5" }} /></div>
    </div>
  )
}
function Soon() {
  return <div style={{ fontSize: "11px", color: "#999", fontStyle: "italic", paddingTop: "20px" }}>Kräver besöksstatistik (GA4) — kopplas in senare.</div>
}

function periodBounds() {
  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startYesterday = new Date(startToday); startYesterday.setDate(startYesterday.getDate() - 1)
  const startWeek = new Date(startToday); startWeek.setDate(startWeek.getDate() - 7)
  const startPrevWeek = new Date(startToday); startPrevWeek.setDate(startPrevWeek.getDate() - 14)
  const startMonth = new Date(startToday); startMonth.setDate(startMonth.getDate() - 30)
  const startPrevMonth = new Date(startToday); startPrevMonth.setDate(startPrevMonth.getDate() - 60)
  return { startToday, startYesterday, startWeek, startPrevWeek, startMonth, startPrevMonth, now }
}
const growth = (cur: number, prev: number) => (prev > 0 ? ((cur - prev) / prev) * 100 : (cur > 0 ? 100 : 0))

function Dashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [carts, setCarts] = useState<{ count: number } | null>(null)
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const r = await fetch(`/admin/orders?limit=1000&order=-display_id&fields=id,display_id,total,item_total,created_at,payment_status,*items,*shipping_address,+metadata`, { credentials: "include" })
        const d = await r.json(); if (alive) setOrders(d.orders || [])
        try { const cr = await fetch(`/admin/carts?limit=1`, { credentials: "include" }); const cd = await cr.json(); if (alive) setCarts({ count: cd.count || 0 }) } catch { /* ignore */ }
      } catch { /* ignore */ }
      if (alive) setLoading(false)
    })()
    return () => { alive = false }
  }, [])

  const m = useMemo(() => {
    const b = periodBounds()
    const dateOf = (o: any) => new Date(o.metadata?.order_time || o.created_at)
    const inRange = (o: any, from: Date, to: Date) => { const t = dateOf(o); return t >= from && t < to }
    const cnt = (from: Date, to: Date) => orders.filter((o) => inRange(o, from, to)).length
    const sum = (from: Date, to: Date) => orders.filter((o) => inRange(o, from, to)).reduce((s, o) => s + Number(o.total || 0), 0)
    const aov = (from: Date, to: Date) => { const c = cnt(from, to); return c ? sum(from, to) / c : 0 }

    const ordY = cnt(b.startYesterday, b.startToday)
    const ordW = cnt(b.startWeek, b.startToday), ordWp = cnt(b.startPrevWeek, b.startWeek)
    const ordM = cnt(b.startMonth, b.startToday), ordMp = cnt(b.startPrevMonth, b.startMonth)
    const aovY = aov(b.startYesterday, b.startToday)
    const aovW = aov(b.startWeek, b.startToday), aovWp = aov(b.startPrevWeek, b.startWeek)
    const aovM = aov(b.startMonth, b.startToday), aovMp = aov(b.startPrevMonth, b.startMonth)

    const byCity: Record<string, number> = {}
    const byPay: Record<string, number> = {}
    const flik = { nya: 0, makulerade: 0, arkiverade: 0 }
    const prodQty: Record<string, number> = {}
    for (const o of orders) {
      const c = (o.shipping_address?.city || "").toUpperCase().trim(); if (c) byCity[c] = (byCity[c] || 0) + 1
      const p = (o.metadata?.payment_method || "").toUpperCase().trim(); if (p) byPay[p] = (byPay[p] || 0) + 1
      const f = o.metadata?.orderflik || (o.payment_status === "canceled" ? "makulerade" : "nya"); (flik as any)[f] = ((flik as any)[f] || 0) + 1
      for (const it of (o.items || [])) prodQty[it.title] = (prodQty[it.title] || 0) + Number(it.quantity || 0)
    }
    const top = (obj: Record<string, number>, n: number) => Object.entries(obj).sort((a, b2) => b2[1] - a[1]).slice(0, n)

    return {
      ordY, ordW, ordWp, ordM, ordMp, aovY, aovW, aovWp, aovM, aovMp,
      cities: top(byCity, 6), pays: top(byPay, 6), flik, prods: top(prodQty, 6),
    }
  }, [orders])

  if (loading) return <div style={{ padding: "20px", fontFamily: WF, fontSize: "12px", color: "#666" }}>Laddar statistik…</div>

  const g3 = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "14px", marginBottom: "14px" } as any

  return (
    <div>
      <div style={g3}>
        <Card title="Besökare"><Soon /></Card>
        <Card title="Antal ordrar"><TriRow big={m.ordY} rows={[
          { k: "Vecka", v: m.ordW, d: growth(m.ordW, m.ordWp) },
          { k: "Månad", v: m.ordM, d: growth(m.ordM, m.ordMp) },
        ]} /></Card>
        <Card title="Konvertering"><Soon /></Card>
      </div>
      <div style={g3}>
        <Card title="Varuvärde/order"><TriRow big={sek(m.aovY)} rows={[
          { k: "Vecka", v: sek(m.aovW), d: growth(m.aovW, m.aovWp) },
          { k: "Månad", v: sek(m.aovM), d: growth(m.aovM, m.aovMp) },
        ]} /></Card>
        <Card title="Täckningsgrad"><div style={{ fontSize: "11px", color: "#999", fontStyle: "italic", paddingTop: "20px" }}>Kräver inköpspris per rad — kopplas in senare.</div></Card>
        <Card title="Enheter"><Soon /></Card>
      </div>
      <div style={g3}>
        <Card title="Ordrar / Plats"><ListRows rows={m.cities.map(([k, v]) => ({ k, v: v + " st." }))} /></Card>
        <Card title="Ordrar / Kön"><Soon /></Card>
        <Card title="Ordrar / Åldersgrupp"><Soon /></Card>
      </div>
      <div style={g3}>
        <Card title="Ordrar / Betalsätt"><ListRows rows={m.pays.map(([k, v]) => ({ k, v: v + " st." }))} /></Card>
        <Card title="Ordrar / Flik"><ListRows rows={[
          { k: <a href={`${ADMIN}/ordrar`} style={{ color: "#06c" }}>Nya</a>, v: (m.flik.nya || 0) + " st" },
          { k: <a href={`${ADMIN}/ordrar`} style={{ color: "#06c" }}>Makulerade</a>, v: (m.flik.makulerade || 0) + " st" },
          { k: <a href={`${ADMIN}/ordrar`} style={{ color: "#06c" }}>Arkiverade</a>, v: (m.flik.arkiverade || 0) + " st" },
        ]} /></Card>
        <Card title="Aktiva varukorgar"><table style={{ width: "100%", fontSize: "12px" }}><tbody>
          <tr><td>Antal korgar</td><td style={{ textAlign: "right", fontSize: "22px", fontWeight: 700 }}>{carts ? carts.count : "—"}</td></tr>
        </tbody></table></Card>
      </div>
      <div style={g3}>
        <Card title="Mest sålda produkter"><ListRows rows={m.prods.map(([k, v]) => ({ k, v: v + " st" }))} /></Card>
        <Card title="Mest visade produkter"><Soon /></Card>
        <Card title="Mest sökta"><Soon /></Card>
      </div>
    </div>
  )
}

function StatistikPage() {
  const [tab, setTab] = useState("dashboard")
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

  useEffect(() => {
    ;(async () => {
      try { const o = await fetch("/admin/orders?limit=1", { credentials: "include" }).then((r) => r.json()); setMeta((s) => ({ ...s, unread: o.count || 0 })) } catch { /* ignore */ }
    })()
  }, [])

  const tabBtn = (active: boolean): any => ({ padding: "6px 20px", margin: "0 6px", fontSize: "12px", fontFamily: WF, cursor: "pointer",
    border: "1px solid #9bb", borderRadius: "4px", background: active ? "#cfe3f5" : "#eef5fb", color: "#036", fontWeight: active ? 700 : 400 })

  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny online={meta.online} unread={meta.unread} active="Statistik" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px" }}>
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <span style={{ fontSize: "24px", verticalAlign: "middle", marginRight: "8px" }}>📊</span>
          <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>STATISTIK / INVENTERING</span>
        </div>
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <button style={tabBtn(tab === "dashboard")} onClick={() => setTab("dashboard")}>Dashboard</button>
          <button style={tabBtn(tab === "tabell")} onClick={() => setTab("tabell")}>Försäljningstabell</button>
          <button style={tabBtn(tab === "lager")} onClick={() => setTab("lager")}>Lagerbevakning</button>
        </div>
        <div style={{ textAlign: "center", fontSize: "12px", color: "#333", marginBottom: "16px" }}>
          Här visas en överblick av försäljning och besökare.
        </div>
        {tab === "dashboard" && <Dashboard />}
        {tab === "tabell" && <div style={{ fontSize: "12px", color: "#666", padding: "20px" }}>Försäljningstabell (per period/produkt) — byggs härnäst. Motsvarar Wikis Försäljningstabell.</div>}
        {tab === "lager" && <div style={{ fontSize: "12px", color: "#666", padding: "20px" }}>Lagerbevakning (lågt lagersaldo) — hämtas från Medusas lagermodul. Byggs härnäst.</div>}
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Statistik", icon: StatIcon })
export default StatistikPage
