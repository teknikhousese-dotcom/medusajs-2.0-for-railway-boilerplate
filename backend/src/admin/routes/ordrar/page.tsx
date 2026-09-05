import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useMemo, useState } from "react"

/**
 * Teknikhouse.se — Visa ordrar
 * A faithful 1:1 mirror of Wikinggruppen's order_list.php + order_page.php,
 * built on Medusa's order engine. Classic Wiki look (Verdana, grey header bars,
 * bordered tables) with the right-hand "Hantera order" panel. Live data via
 * /admin/orders with the logged-in session cookie. Native order screens hidden.
 */

const ADMIN = "/app"
const WF = "Verdana, Tahoma, Arial, sans-serif"

const OrdersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h6" />
  </svg>
)

const sek = (n: number) =>
  new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0)) + " kr"
const dt = (s?: string) => {
  if (!s) return ""
  try { return new Date(s).toLocaleString("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).replace(",", "") } catch { return s }
}
const payText = (st?: string): string => {
  switch (st) {
    case "captured": case "paid": return "Betald"
    case "partially_captured": return "Delbetald"
    case "refunded": case "partially_refunded": return "Återbetald"
    case "canceled": return "Makulerad"
    default: return "Ej betald"
  }
}

type MenuItem = { emo: string; lab: string; href?: string }
const MENU: MenuItem[] = [
  { emo: "🏠", lab: "Start", href: `${ADMIN}/kontrollpanel` },
  { emo: "📋", lab: "Visa ordrar", href: `${ADMIN}/ordrar` },
  { emo: "📊", lab: "Statistik", href: `${ADMIN}/kontrollpanel?s=statistik` },
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

function currentId(): string | null {
  try { return new URLSearchParams(window.location.search).get("id") } catch { return null }
}

// ---- classic Wiki table primitives (inline styles for exact look) ----
const tbl: any = { width: "600px", maxWidth: "100%", borderCollapse: "collapse", fontFamily: WF, marginBottom: "14px" }
const secTd: any = { background: "#cccccc", fontWeight: 700, fontSize: "13px", textAlign: "center", padding: "6px", border: "1px solid #999" }
const labTd: any = { background: "#eeeeee", fontSize: "11px", padding: "6px", border: "1px solid #cccccc", width: "200px", verticalAlign: "top", color: "#000" }
const valTd: any = { background: "#ffffff", fontSize: "11px", padding: "6px", border: "1px solid #cccccc", color: "#000" }
const thTd: any = { background: "#eeeeee", fontSize: "11px", fontWeight: 700, padding: "5px 6px", border: "1px solid #cccccc", color: "#000", textAlign: "left" }
const cellTd: any = { background: "#ffffff", fontSize: "11px", padding: "5px 6px", border: "1px solid #cccccc", color: "#000" }

function KV({ k, v, colspan }: { k: string; v: any; colspan?: number }) {
  return (
    <tr>
      <td style={labTd}>{k}</td>
      <td style={valTd} colSpan={colspan}>{v}</td>
    </tr>
  )
}
function SectionRow({ title }: { title: string }) {
  return <tr><td style={secTd} colSpan={2}>{title}</td></tr>
}

function Snabbmeny({ unread, products }: { unread: number; products: number }) {
  return (
    <aside style={{ width: "220px", flexShrink: 0, borderRight: "1px solid #ccc", background: "#f4f4f4", fontFamily: WF }}>
      <div style={{ padding: "10px 12px", borderBottom: "1px solid #ccc", background: "#fff" }}>
        <div style={{ fontSize: "12px", fontWeight: 700 }}>Statistik</div>
        <div style={{ fontSize: "11px", color: "#444", marginTop: "4px" }}>Olästa ordrar: <b>{unread} st</b></div>
        <div style={{ fontSize: "11px", color: "#444" }}>Produkter: <b>{products} st</b></div>
      </div>
      <nav style={{ fontSize: "12px" }}>
        {MENU.map((m) => (
          <a key={m.lab} href={m.href}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", textDecoration: "none", color: "#000",
              borderBottom: "1px solid #e2e2e2", background: m.lab === "Visa ordrar" ? "#e2e2e2" : "transparent", fontWeight: m.lab === "Visa ordrar" ? 700 : 400 }}>
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

function OrderList({ onOpen }: { onOpen: (id: string) => void }) {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const r = await fetch(`/admin/orders?limit=200&order=-display_id&fields=id,display_id,email,total,currency_code,created_at,payment_status,*shipping_address,+metadata`, { credentials: "include" })
        const d = await r.json(); if (alive) { setRows(d.orders || []); setLoading(false) }
      } catch { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [])
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase(); if (!t) return rows
    return rows.filter((o) => {
      const nm = o.shipping_address ? `${o.shipping_address.first_name || ""} ${o.shipping_address.last_name || ""}` : ""
      return String(o.display_id).includes(t) || (o.email || "").toLowerCase().includes(t) || nm.toLowerCase().includes(t) || String(o.metadata?.wiki_order_id || "").includes(t)
    })
  }, [rows, q])
  return (
    <div style={{ flex: 1, minWidth: 0, padding: "16px 20px", fontFamily: WF }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>📋 Visa ordrar</h1>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sök ordernr, namn, e-post…"
          style={{ fontSize: "12px", padding: "5px 8px", border: "1px solid #bbb", width: "280px", fontFamily: WF }} />
      </div>
      <div style={{ fontSize: "11px", color: "#666", marginBottom: "6px" }}>{loading ? "Laddar…" : `${filtered.length} ordrar`}</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: WF }}>
        <thead>
          <tr>
            <td style={thTd}>Ordernr</td><td style={thTd}>Datum</td><td style={thTd}>Kund</td>
            <td style={thTd}>Betalning</td><td style={{ ...thTd, textAlign: "right" }}>Summa</td>
          </tr>
        </thead>
        <tbody>
          {filtered.map((o) => {
            const nm = o.shipping_address ? `${o.shipping_address.first_name || ""} ${o.shipping_address.last_name || ""}`.trim() : ""
            const wid = o.metadata?.wiki_order_id
            const when = o.metadata?.order_time || o.created_at
            return (
              <tr key={o.id} onClick={() => onOpen(o.id)} style={{ cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f7ff")} onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                <td style={{ ...cellTd, fontWeight: 700 }}>{wid || o.display_id}</td>
                <td style={{ ...cellTd, color: "#555" }}>{dt(when)}</td>
                <td style={cellTd}>{nm || o.email}</td>
                <td style={{ ...cellTd, color: o.payment_status === "captured" ? "#161" : "#a00" }}>{payText(o.payment_status)}</td>
                <td style={{ ...cellTd, textAlign: "right" }}>{sek(o.total)}</td>
              </tr>
            )
          })}
          {!loading && filtered.length === 0 && (<tr><td style={cellTd} colSpan={5}>Inga ordrar hittades.</td></tr>)}
        </tbody>
      </table>
    </div>
  )
}

function Btn({ children, onClick, href }: { children: any; onClick?: () => void; href?: string }) {
  const st: any = { display: "block", width: "100%", boxSizing: "border-box", textAlign: "center", padding: "6px 8px", margin: "6px 0", fontSize: "11px", fontFamily: WF,
    border: "1px solid #bbb", background: "#fafafa", color: "#000", textDecoration: "none", cursor: "pointer", borderRadius: "3px" }
  if (href) return <a style={st} href={href}>{children}</a>
  return <button style={st} onClick={onClick}>{children}</button>
}

function OrderDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const [o, setO] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [nav, setNav] = useState<{ prev?: any; next?: any }>({})
  const [note, setNote] = useState("")
  const [flik, setFlik] = useState("nya")
  const [stat, setStat] = useState(true)
  const [saved, setSaved] = useState("")

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const f = "*items,*shipping_address,*billing_address,*shipping_methods,+metadata,+display_id,+email,+currency_code,+total,+item_total,+item_subtotal,+shipping_total,+tax_total,+payment_status,+created_at"
        const r = await fetch(`/admin/orders/${id}?fields=${f}`, { credentials: "include" })
        const d = await r.json()
        if (!alive) return
        setO(d.order); setLoading(false)
        const m = d.order?.metadata || {}
        setNote(m.internal_comment || ""); setFlik(m.orderflik || (d.order?.payment_status === "canceled" ? "makulerade" : "nya")); setStat(m.counts_in_stats !== false)
        // prev/next by display_id
        const lr = await fetch(`/admin/orders?limit=1000&order=-display_id&fields=id,display_id,+metadata`, { credentials: "include" })
        const ld = await lr.json(); const list = ld.orders || []
        const idx = list.findIndex((x: any) => x.id === id)
        if (idx >= 0 && alive) setNav({ next: list[idx - 1], prev: list[idx + 1] })
      } catch { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [id])

  if (loading) return <div style={{ flex: 1, padding: "30px", fontFamily: WF, fontSize: "12px", color: "#666" }}>Laddar order…</div>
  if (!o) return <div style={{ flex: 1, padding: "30px", fontFamily: WF, fontSize: "12px" }}>Ordern kunde inte hämtas. <a onClick={onBack} style={{ color: "#06c", cursor: "pointer" }}>Tillbaka</a></div>

  const m = o.metadata || {}
  const sa = o.shipping_address || {}
  const sm = (o.shipping_methods || [])[0]
  const wid = m.wiki_order_id || o.display_id
  const when = m.order_time || o.created_at
  const paid = o.payment_status === "captured" || o.payment_status === "paid"
  const canceled = o.payment_status === "canceled" || flik === "makulerade"

  const itemsExcl = (o.items || []).reduce((s: number, it: any) => s + Number(it.unit_price) * Number(it.quantity), 0)
  const shipExcl = Number(sm ? sm.amount : (o.shipping_total ?? 0))
  const totalExcl = itemsExcl + shipExcl
  const grand = Number(o.total ?? 0)
  const taxTotal = Number(o.tax_total ?? (grand - totalExcl))
  const incl = (excl: number, vat: number) => Number(excl) * (1 + (Number(vat) || 25) / 100)

  const save = async () => {
    setSaved("Sparar…")
    try {
      const r = await fetch(`/admin/orders/${id}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: { internal_comment: note, orderflik: flik, counts_in_stats: stat } }) })
      setSaved(r.ok ? "Sparat ✓" : "Kunde inte spara")
    } catch { setSaved("Kunde inte spara") }
    setTimeout(() => setSaved(""), 3000)
  }

  return (
    <div style={{ flex: 1, minWidth: 0, padding: "16px 20px", fontFamily: WF, display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
      {/* CENTER: order */}
      <div style={{ flex: "0 0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <span style={{ fontSize: "26px" }}>📊</span>
          <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>Order {wid}</h1>
          <span style={{ fontSize: "12px", marginLeft: "8px", color: paid ? "#161" : "#a00", fontWeight: 700 }}>{payText(o.payment_status)}</span>
        </div>

        <table style={tbl}><tbody>
          <SectionRow title="Beställare" />
          <KV k="Namn" v={`${sa.first_name || ""} ${sa.last_name || ""}`.trim()} />
          <KV k="Gatuadress" v={sa.address_1 || ""} />
          <KV k="Postnr och Ort" v={`${sa.postal_code || ""} ${sa.city || ""}`.trim()} />
          <KV k="Land" v={(sa.country_code || "").toUpperCase() === "SE" ? "Sverige" : (sa.country_code || "").toUpperCase()} />
          <KV k="Mobil" v={sa.phone || m.cell_phone || m.phone || ""} />
          <KV k="E-mail" v={<a href={`mailto:${o.email}`} style={{ color: "#06c" }}>{o.email}</a>} />
        </tbody></table>

        <table style={tbl}><tbody>
          <SectionRow title="Leverans" />
          <KV k="Meddelande" v={m.customer_message || ""} />
          <KV k="Leveransmetod" v={<span><b>{(sm && sm.name) || m.wiki_shipping_method || "Standard"}</b></span>} />
        </tbody></table>

        <table style={tbl}><tbody>
          <SectionRow title="Övrig information" />
          <KV k="Totalvikt" v={`${m.order_weight_g ?? 0}g`} />
          <KV k="IP-adress vid beställning" v={m.ip_address || "—"} />
          <KV k="Beställd via" v={m.ordered_via || "—"} />
          <KV k="Tidpunkt vid beställning" v={dt(when)} />
          <KV k="Betalningstatus:" v={<span>{m.payment_method || ""}{m.payment_method ? " · " : ""}<span style={{ color: paid ? "#161" : "#a00" }}>{paid ? "Betald" : payText(o.payment_status)}</span></span>} />
          <KV k="Språk / Valuta:" v={`Svenska / ${(o.currency_code || "SEK").toUpperCase()}`} />
        </tbody></table>

        <table style={{ ...tbl }}><tbody>
          <tr><td style={secTd} colSpan={6}>Beställda varor</td></tr>
          <tr>
            <td style={thTd}>Artikelnr</td><td style={thTd}>Produkt</td>
            <td style={{ ...thTd, textAlign: "right" }}>Pris exkl. moms</td>
            <td style={{ ...thTd, textAlign: "right" }}>Pris inkl. moms</td>
            <td style={{ ...thTd, textAlign: "center" }}>Antal</td>
            <td style={{ ...thTd, textAlign: "right" }}>Summa inkl. moms</td>
          </tr>
          {(o.items || []).map((it: any) => {
            const vat = it.tax_lines && it.tax_lines[0] ? Number(it.tax_lines[0].rate) : 25
            const pi = incl(it.unit_price, vat)
            return (
              <tr key={it.id}>
                <td style={cellTd}>{it.variant_sku || (it.metadata && it.metadata.sku) || "—"}</td>
                <td style={cellTd}>{it.title}{it.subtitle ? ` · ${it.subtitle}` : ""}</td>
                <td style={{ ...cellTd, textAlign: "right" }}>{sek(it.unit_price)}</td>
                <td style={{ ...cellTd, textAlign: "right" }}>{sek(pi)}</td>
                <td style={{ ...cellTd, textAlign: "center" }}>{it.quantity} st.</td>
                <td style={{ ...cellTd, textAlign: "right" }}>{sek(pi * Number(it.quantity))}</td>
              </tr>
            )
          })}
          <tr><td style={{ ...cellTd, textAlign: "right", background: "#f7f7f7" }} colSpan={5}>Summa exkl. 25% moms »</td><td style={{ ...cellTd, textAlign: "right", background: "#f7f7f7" }}>{sek(itemsExcl)}</td></tr>
          {shipExcl > 0 && <tr><td style={{ ...cellTd, textAlign: "right", background: "#f7f7f7" }} colSpan={5}>Frakt exkl. moms »</td><td style={{ ...cellTd, textAlign: "right", background: "#f7f7f7" }}>{sek(shipExcl)}</td></tr>}
          <tr><td style={{ ...cellTd, textAlign: "right", background: "#f7f7f7", fontWeight: 700 }} colSpan={5}>Totalt exkl. moms »</td><td style={{ ...cellTd, textAlign: "right", background: "#f7f7f7", fontWeight: 700 }}>{sek(totalExcl)}</td></tr>
          <tr><td style={{ ...cellTd, textAlign: "right", background: "#f7f7f7", fontWeight: 700 }} colSpan={5}>Totalt inkl. moms »</td><td style={{ ...cellTd, textAlign: "right", background: "#f7f7f7", fontWeight: 700 }}>{sek(grand)}</td></tr>
          <tr><td style={{ ...cellTd, textAlign: "right", background: "#f7f7f7" }} colSpan={5}>Varav moms (25%) »</td><td style={{ ...cellTd, textAlign: "right", background: "#f7f7f7" }}>{sek(taxTotal)}</td></tr>
        </tbody></table>

        <div style={{ marginTop: "4px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>Meddelanden/loggar från ändringar</div>
          <div style={{ fontSize: "11px", color: "#0a0", fontStyle: "italic", lineHeight: 1.7 }}>
            <div>{dt(o.created_at)}<br />Ordern lades.{m.payment_method ? ` Betalsätt: ${m.payment_method}.` : ""}</div>
            {paid && <div>{dt(o.created_at)}<br />Betalning registrerad ({sek(grand)}).</div>}
            {m.wiki_order_id && <div>Importerad från Wikinggruppen · Wiki-ordernr {m.wiki_order_id}.</div>}
          </div>
        </div>
      </div>

      {/* RIGHT: prev/next + Hantera order */}
      <div style={{ width: "230px", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          {nav.prev
            ? <a href={`${ADMIN}/ordrar?id=${nav.prev.id}`} style={{ flex: 1, textAlign: "center", padding: "8px 4px", fontSize: "11px", border: "1px solid #bbb", background: "#fafafa", textDecoration: "none", color: "#000", borderRadius: "3px" }}>Order<br />{nav.prev.metadata?.wiki_order_id || nav.prev.display_id}</a>
            : <span style={{ flex: 1 }} />}
          {nav.next
            ? <a href={`${ADMIN}/ordrar?id=${nav.next.id}`} style={{ flex: 1, textAlign: "center", padding: "8px 4px", fontSize: "11px", border: "1px solid #bbb", background: "#fafafa", textDecoration: "none", color: "#000", borderRadius: "3px" }}>Order<br />{nav.next.metadata?.wiki_order_id || nav.next.display_id}</a>
            : <span style={{ flex: 1 }} />}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: WF }}><tbody>
          <tr><td style={secTd}>Hantera order</td></tr>
          <tr><td style={{ ...valTd, background: "#fff" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "4px" }}>Intern kommentar</div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} style={{ width: "100%", boxSizing: "border-box", height: "70px", fontSize: "11px", fontFamily: WF, border: "1px solid #bbb", padding: "4px" }} />
            <div style={{ fontSize: "11px", fontWeight: 700, margin: "8px 0 4px" }}>Orderflik</div>
            <select value={flik} onChange={(e) => setFlik(e.target.value)} style={{ fontSize: "11px", fontFamily: WF, padding: "3px", border: "1px solid #bbb" }}>
              <option value="nya">Nya</option><option value="makulerade">Makulerade</option><option value="arkiverade">Arkiverade</option>
            </select>
            <div style={{ fontSize: "11px", fontWeight: 700, margin: "8px 0 4px" }}>Räknas i statistiken</div>
            <label style={{ fontSize: "11px" }}><input type="checkbox" checked={stat} onChange={(e) => setStat(e.target.checked)} /> Ja</label>
            <Btn onClick={save}>Spara ovanstående</Btn>
            {saved && <div style={{ fontSize: "11px", color: "#161", textAlign: "center" }}>{saved}</div>}
            <div style={{ borderTop: "1px solid #ddd", margin: "8px 0" }} />
            <Btn onClick={() => window.print()}>🧾 Visa följesedel</Btn>
            <Btn onClick={() => window.print()}>🖨 Skriv ut order</Btn>
            <Btn href={`mailto:${o.email}`}>✉ Skicka e-post</Btn>
            <Btn onClick={() => setSaved("SMS-modul under uppbyggnad")}>📱 Skicka SMS</Btn>
            <Btn onClick={() => setSaved("Uppföljningsmodul under uppbyggnad")}>⭐ Uppföljningsmail</Btn>
            <div style={{ borderTop: "1px solid #ddd", margin: "8px 0" }} />
            <Btn href={`${ADMIN}/orders/${o.id}`}>📝 Redigera order</Btn>
            <div style={{ fontSize: "11px", marginTop: "10px" }}>
              <a onClick={onBack} style={{ color: "#06c", cursor: "pointer" }}>« Tillbaka till orderlistan</a>
            </div>
            <div style={{ fontSize: "11px", marginTop: "4px" }}>
              <a href={`${ADMIN}/kontrollpanel`} style={{ color: "#06c" }}>« Till kontrollpanelen</a>
            </div>
          </td></tr>
        </tbody></table>
      </div>
    </div>
  )
}

function OrdrarPage() {
  const [id, setId] = useState<string | null>(currentId)
  const [meta, setMeta] = useState({ unread: 0, products: 0 })

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
    const onPop = () => setId(currentId())
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const [o, p] = await Promise.all([
          fetch("/admin/orders?limit=1", { credentials: "include" }).then((r) => r.json()),
          fetch("/admin/products?limit=1", { credentials: "include" }).then((r) => r.json()),
        ])
        setMeta({ unread: o.count || 0, products: p.count || 0 })
      } catch { /* ignore */ }
    })()
  }, [])

  const open = (oid: string) => {
    setId(oid)
    try { const u = new URL(window.location.href); u.searchParams.set("id", oid); window.history.pushState({}, "", u.toString()) } catch { /* ignore */ }
    window.scrollTo(0, 0)
  }
  const back = () => {
    setId(null)
    try { const u = new URL(window.location.href); u.searchParams.delete("id"); window.history.pushState({}, "", u.toString()) } catch { /* ignore */ }
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px" }}>
      <Snabbmeny unread={meta.unread} products={meta.products} />
      {id ? <OrderDetail key={id} id={id} onBack={back} /> : <OrderList onOpen={open} />}
    </div>
  )
}

export const config = defineRouteConfig({ label: "Visa ordrar", icon: OrdersIcon })
export default OrdrarPage
