import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useMemo, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

/**
 * Teknikhouse.se — Visa ordrar
 * A faithful 1:1 mirror of Wikinggruppen's order_list.php + order_page.php,
 * built on Medusa's order engine. Classic Wiki look (Verdana, grey header bars,
 * bordered tables) with the right-hand "Hantera order" panel. Live data via
 * /admin/orders with the logged-in session cookie. Native order screens hidden.
 */


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


const lhTd: any = { background: "#dddddd", fontSize: "11px", fontWeight: 700, padding: "4px 6px", border: "1px solid #cfcfcf", color: "#000", textAlign: "left" }
const lcTd: any = { fontSize: "11px", padding: "4px 6px", border: "1px solid #e2e2e2", color: "#000", verticalAlign: "middle" }

function payBadge(pm?: string) {
  const map: Record<string, { t: string; bg: string; fg: string }> = {
    KLARNA: { t: "KL", bg: "#ffb3c7", fg: "#17120f" }, KLARNACHECKOUT: { t: "KL", bg: "#ffb3c7", fg: "#17120f" },
    PAYSON: { t: "Pa", bg: "#d9e6ff", fg: "#123" }, PAYSONFAKTURA: { t: "Pa", bg: "#d9e6ff", fg: "#123" },
    SWISH: { t: "Sw", bg: "#d9ffe6", fg: "#161" }, CDON: { t: "CD", bg: "#ffe9cc", fg: "#630" },
  }
  const k = (pm || "").toUpperCase(); const b = map[k] || { t: (k[0] || "?"), bg: "#eee", fg: "#333" }
  return <span title={pm || ""} style={{ display: "inline-block", minWidth: "20px", textAlign: "center", fontSize: "9px", fontWeight: 700, padding: "1px 3px", borderRadius: "3px", background: b.bg, color: b.fg, marginRight: "6px" }}>{b.t}</span>
}
const flikOf = (o: any): string => o.metadata?.orderflik || (o.payment_status === "canceled" ? "makulerade" : "nya")
const deviceOf = (o: any): string => { const v = (o.metadata?.ordered_via || "").toLowerCase(); return /dator|desktop|surf|tablet/.test(v) ? "🖥" : "📱" }

function OrderList({ onOpen }: { onOpen: (id: string) => void }) {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [tab, setTab] = useState("nya")
  const [page, setPage] = useState(1)
  const [sel, setSel] = useState<Record<string, boolean>>({})
  const [moveTo, setMoveTo] = useState("")
  const [busy, setBusy] = useState("")
  const [showTips, setShowTips] = useState(false)
  const PAGE = 50

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch(`/admin/orders?limit=500&order=-display_id&fields=id,display_id,email,total,currency_code,created_at,payment_status,fulfillment_status,*shipping_address,+metadata`, { credentials: "include" })
      const d = await r.json(); setRows(d.orders || [])
    } catch { /* ignore */ }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const inTab = useMemo(() => rows.filter((o) => flikOf(o) === tab), [rows, tab])
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase(); if (!t) return inTab
    return inTab.filter((o) => {
      const nm = o.shipping_address ? `${o.shipping_address.first_name || ""} ${o.shipping_address.last_name || ""}` : ""
      return String(o.display_id).includes(t) || String(o.metadata?.wiki_order_id || "").includes(t) || (o.email || "").toLowerCase().includes(t) || nm.toLowerCase().includes(t) || (o.metadata?.internal_comment || "").toLowerCase().includes(t)
    })
  }, [inTab, q])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const pageRows = filtered.slice((page - 1) * PAGE, page * PAGE)

  const counts = useMemo(() => ({
    nya: rows.filter((o) => flikOf(o) === "nya").length,
    makulerade: rows.filter((o) => flikOf(o) === "makulerade").length,
    arkiverade: rows.filter((o) => flikOf(o) === "arkiverade").length,
  }), [rows])

  const selIds = Object.keys(sel).filter((k) => sel[k])
  const flytta = async () => {
    if (!moveTo || selIds.length === 0) return
    setBusy(`Flyttar ${selIds.length} ordrar…`)
    for (const id of selIds) {
      const o = rows.find((x) => x.id === id); if (!o) continue
      const meta = Object.assign({}, o.metadata, { orderflik: moveTo })
      try { await fetch(`/admin/orders/${id}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ metadata: meta }) }) } catch { /* ignore */ }
    }
    setSel({}); setMoveTo(""); setBusy(""); await load()
  }
  const opna = () => {
    const t = q.trim(); if (!t) return
    const o = rows.find((x) => String(x.metadata?.wiki_order_id) === t || String(x.display_id) === t)
    if (o) onOpen(o.id)
  }

  const tabStyle = (active: boolean): any => ({ display: "inline-block", padding: "4px 16px", marginRight: "4px", fontSize: "12px", fontFamily: WF,
    border: "2px solid #000", background: active ? "#666" : "#c8c8c8", color: active ? "#fff" : "#000", cursor: "pointer", borderRadius: "3px 3px 0 0" })
  const toolBtn: any = { fontSize: "11px", fontFamily: WF, padding: "3px 8px", border: "1px solid #bbb", background: "#fafafa", cursor: "pointer", marginRight: "4px", borderRadius: "3px" }

  return (
    <div style={{ flex: 1, minWidth: 0, padding: "14px 20px", fontFamily: WF }}>
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>📊</span>
        <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>ORDRAR</span>
      </div>

      <div style={{ textAlign: "right", marginBottom: "4px" }}>
        <a onClick={() => setShowTips((v) => !v)} style={{ fontSize: "11px", color: "#06c", cursor: "pointer" }}>ⓘ Hur hanterar jag ordrar?</a>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "6px" }}>
        <div>
          {[["nya", "Nya"], ["makulerade", "Makulerade"], ["arkiverade", "Arkiverade"]].map(([k, lab]) => (
            <span key={k} style={tabStyle(tab === k)} onClick={() => { setTab(k); setPage(1); setSel({}) }}>{lab}{k === "nya" && counts.nya ? ` (${counts.nya})` : ""}</span>
          ))}
        </div>
        <div>
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Sök…"
            style={{ fontSize: "12px", padding: "3px 6px", border: "1px solid #bbb", width: "160px", fontFamily: WF }} />
          <button style={toolBtn} onClick={() => setPage(1)}>SÖK</button>
          <button style={toolBtn} onClick={opna}>ÖPPNA</button>
        </div>
      </div>

      <div style={{ fontSize: "11px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
        <span>Med markerade ordrar:</span>
        <button style={toolBtn} onClick={() => window.print()}>Visa plocklista</button>
        <button style={toolBtn} onClick={() => window.print()}>Skriv ut</button>
        <button style={toolBtn} onClick={() => { const mails = rows.filter((o) => sel[o.id] && o.email).map((o) => o.email); if (!mails.length) { setBusy("Kryssa i minst en order först."); return; } window.location.href = `mailto:?bcc=${encodeURIComponent(mails.join(","))}&subject=${encodeURIComponent("Uppföljning av din order hos Teknikhouse.se")}&body=${encodeURIComponent("Hej,\n\nTack för din order hos Teknikhouse.se! Vi hoppas att allt är till belåtenhet. Hör gärna av dig om du har några frågor.\n\nMed vänliga hälsningar\nTeknikhouse.se")}`; }}>Skicka uppföljningsmail</button>
        <select value={moveTo} onChange={(e) => setMoveTo(e.target.value)} style={{ fontSize: "11px", fontFamily: WF, padding: "2px", border: "1px solid #bbb" }}>
          <option value="">Flytta till…</option><option value="nya">Nya</option><option value="makulerade">Makulerade</option><option value="arkiverade">Arkiverade</option>
        </select>
        <button style={toolBtn} onClick={flytta} disabled={!moveTo || selIds.length === 0}>Flytta</button>
        {busy && <span style={{ color: "#161" }}>{busy}</span>}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: WF }}>
        <thead>
          <tr>
            <td style={{ ...lhTd, width: "22px", textAlign: "center" }}>
              <input type="checkbox" checked={pageRows.length > 0 && pageRows.every((o) => sel[o.id])}
                onChange={(e) => { const n = { ...sel }; pageRows.forEach((o) => { n[o.id] = e.target.checked }); setSel(n) }} />
            </td>
            <td style={lhTd}>ID</td><td style={lhTd}>Kund</td><td style={lhTd}>Tidpunkt</td>
            <td style={{ ...lhTd, width: "24px" }}>🌐</td><td style={{ ...lhTd, width: "20px" }}>●</td>
            <td style={{ ...lhTd, width: "20px" }}>★</td><td style={{ ...lhTd, width: "24px" }}>📱</td>
            <td style={lhTd}>Intern Kommentar</td><td style={{ ...lhTd, width: "90px" }}>Hantera</td>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((o) => {
            const nm = o.shipping_address ? `${o.shipping_address.first_name || ""} ${o.shipping_address.last_name || ""}`.trim() : ""
            const wid = o.metadata?.wiki_order_id || o.display_id
            const when = o.metadata?.order_time || o.created_at
            const paid = o.payment_status === "captured" || o.payment_status === "paid"
            const fulfilled = ["fulfilled", "shipped", "delivered", "partially_fulfilled", "partially_shipped", "partially_delivered"].includes(o.fulfillment_status)
            // Wiki: rött ID = ej slutfört köp (ej betalt); blått ID = måste behandlas (betalt, ej hanterat); annars svart
            const idColor = !paid ? "#cc0000" : (!fulfilled ? "#0060cc" : "#333")
            const unread = o.metadata?.read !== true               // Olästa ordrar i fet stil
            const isMak = flikOf(o) === "makulerade"                // Makulerade ordrar med grå bakgrund
            const baseBg = isMak ? "#e6e6e6" : "#ffffff"
            const dotVal = o.metadata?.status_dot || ""
            const dotColor: Record<string, string> = { gul: "#f2c200", gron: "#2ea92e", rod: "#dd3333", "": "transparent" }
            const followup = o.metadata?.followup_sent === true
            const cycleDot = () => {
              const seq = ["", "gul", "gron", "rod"]; const next = seq[(seq.indexOf(dotVal) + 1) % 4]
              const meta = Object.assign({}, o.metadata, { status_dot: next })
              setRows((rs) => rs.map((x) => x.id === o.id ? { ...x, metadata: meta } : x))
              fetch(`/admin/orders/${o.id}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ metadata: meta }) })
            }
            return (
              <tr key={o.id} style={{ background: baseBg }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#eef4ff")} onMouseLeave={(e) => (e.currentTarget.style.background = baseBg)}>
                <td style={{ ...lcTd, textAlign: "center", background: "transparent" }}><input type="checkbox" checked={!!sel[o.id]} onChange={(e) => setSel({ ...sel, [o.id]: e.target.checked })} /></td>
                <td style={{ ...lcTd, background: "transparent" }}><a onClick={() => onOpen(o.id)} style={{ color: idColor, fontWeight: unread ? 700 : 400, cursor: "pointer" }}>{wid}</a></td>
                <td style={{ ...lcTd, background: "transparent" }}>{payBadge(o.metadata?.payment_method)}<a onClick={() => onOpen(o.id)} style={{ color: "#06c", fontWeight: unread ? 700 : 400, cursor: "pointer" }}>{nm || o.email}</a></td>
                <td style={{ ...lcTd, color: "#444", whiteSpace: "nowrap", background: "transparent", fontWeight: unread ? 700 : 400 }}>{dt(when)}</td>
                <td style={{ ...lcTd, textAlign: "center", background: "transparent" }}>🇸🇪</td>
                <td style={{ ...lcTd, textAlign: "center", background: "transparent" }}>
                  <span title="Egen orderstatus (klicka)" onClick={cycleDot} style={{ display: "inline-block", width: "12px", height: "12px", borderRadius: "50%", cursor: "pointer", background: dotColor[dotVal], border: "1px solid " + (dotVal ? "#0005" : "#bbb") }} />
                </td>
                <td style={{ ...lcTd, textAlign: "center", background: "transparent", color: followup ? "#e0a800" : "#ccc" }} title={followup ? "Uppföljningsmail skickat" : "Inget uppföljningsmail"}>{followup ? "★" : "☆"}</td>
                <td style={{ ...lcTd, textAlign: "center", background: "transparent" }}>{deviceOf(o)}</td>
                <td style={{ ...lcTd, color: "#333", background: "transparent" }}>{o.metadata?.internal_comment || ""}</td>
                <td style={{ ...lcTd, whiteSpace: "nowrap", fontSize: "13px", background: "transparent" }}>
                  <span title="Skriv ut" style={{ cursor: "pointer", marginRight: "4px" }} onClick={() => window.print()}>🖨</span>
                  <span title="Redigera" style={{ cursor: "pointer", marginRight: "4px" }} onClick={() => onOpen(o.id)}>📝</span>
                  <span title="Makulera" style={{ cursor: "pointer" }} onClick={async () => { if (!confirm("Flytta ordern till Makulerade?")) return; const meta = Object.assign({}, o.metadata, { orderflik: "makulerade" }); await fetch(`/admin/orders/${o.id}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ metadata: meta }) }); load() }}>❌</span>
                </td>
              </tr>
            )
          })}
          {!loading && pageRows.length === 0 && (<tr><td style={lcTd} colSpan={10}>Inga ordrar i denna flik.</td></tr>)}
        </tbody>
      </table>

      <div style={{ fontSize: "11px", marginTop: "8px" }}>
        Sida:{" "}
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <span key={p} onClick={() => setPage(p)} style={{ cursor: "pointer", padding: "2px 6px", margin: "0 1px", border: "1px solid #bbb", background: p === page ? "#666" : "#fafafa", color: p === page ? "#fff" : "#06c", borderRadius: "3px" }}>{p}</span>
        ))}
        {page < pages && <span onClick={() => setPage(page + 1)} style={{ cursor: "pointer", padding: "2px 6px", marginLeft: "4px", color: "#06c" }}>Nästa »</span>}
        <span style={{ marginLeft: "10px", color: "#666" }}>{loading ? "Laddar…" : `${filtered.length} ordrar`}</span>
      </div>

      {showTips && (
      <div style={{ marginTop: "14px", border: "1px solid #ccc", borderRadius: "4px", background: "#f7f7f7", padding: "10px 14px", fontSize: "11px", lineHeight: 1.6, maxWidth: "820px" }}>
        <div style={{ fontWeight: 700, fontSize: "12px", marginBottom: "6px" }}>💡 Tips för orderhantering</div>
        <p style={{ margin: "0 0 6px" }}>Du kan kategorisera ordrar i olika flikar. Flikarna har ingen praktisk funktion förutom att underlätta din sortering. Alla nya ordrar hamnar i fliken "Nya". Därefter flyttar du ordern när och som du vill.</p>
        <p style={{ margin: "0 0 6px" }}>För att flytta flera ordrar samtidigt: kryssa för dem i listan, välj ny flik under "Flytta till…" och klicka på Flytta. Med de markerade ordrarna kan du även skapa en plocklista.</p>
        <p style={{ margin: "0 0 6px" }}>Vill du snabbt öppna en order med ett visst ID, skriv in ID-numret i sökrutan till höger och klicka på Öppna. Via den rutan kan du också söka på beställarens namn eller orderns datum.</p>
        <p style={{ margin: "0 0 4px", fontWeight: 700 }}>Så här visar vi ordrarna i listan:</p>
        <ul style={{ margin: "0 0 6px", paddingLeft: "18px" }}>
          <li>Olästa ordrar är listade med <b>fet stil</b>.</li>
          <li>Ej slutförda köp listas med <span style={{ color: "#cc0000", fontWeight: 700 }}>rött ID</span>.</li>
          <li>Ordrar med <span style={{ color: "#0060cc", fontWeight: 700 }}>blått ID</span> måste behandlas.</li>
          <li>Makulerade ordrar har grå bakgrund.</li>
        </ul>
        <p style={{ margin: "0 0 6px" }}>Du kan även markera ordrar i färgerna gult / grönt / rött genom att klicka på bollen i mitten av listan. Dessa bollar fyller ingen funktion förutom just möjligheten att fritt markera enligt egen orderstatus.</p>
        <p style={{ margin: 0 }}>Stjärnorna visar om ett uppföljningsmail skickats för ordern. Uppföljningsmail innebär att kunden får ett mail med uppmaning att lämna betyg och omdöme om sina köpta varor.</p>
      </div>
      )}
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
        if (m.read !== true) { // markera som läst (Olästa = fet stil i listan)
          try { fetch(`/admin/orders/${id}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ metadata: Object.assign({}, m, { read: true }) }) }) } catch { /* ignore */ }
        }
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
            <Btn href={`sms:${((o.shipping_address && o.shipping_address.phone) || o.phone || "").replace(/\s/g, "")}`}>📱 Skicka SMS</Btn>
            <Btn href={`mailto:${o.email}?subject=${encodeURIComponent("Uppföljning av din order hos Teknikhouse.se")}&body=${encodeURIComponent("Hej,\n\nTack för din order hos Teknikhouse.se! Vi hoppas att allt är till belåtenhet. Hör gärna av dig om du har några frågor.\n\nMed vänliga hälsningar\nTeknikhouse.se")}`}>⭐ Uppföljningsmail</Btn>
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
