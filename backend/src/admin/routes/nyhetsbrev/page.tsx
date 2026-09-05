import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"

/**
 * Teknikhouse.se — Nyhetsbrev (1:1 mirror of Wikinggruppen newsletter.php)
 * Hub + Visa prenumeranter / Skriv nytt / Hantera skickade / Hantera HTML-mallar.
 * Backed by raw-SQL newsletter tables. Native nav hidden; Wiki Snabbmeny on the left.
 */
const ADMIN = "/app"
const WF = "Verdana, Tahoma, Arial, sans-serif"

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" />
  </svg>
)
const nf = (n: number) => new Intl.NumberFormat("sv-SE").format(Math.round(Number(n || 0)))

type MenuItem = { emo: string; lab: string; href?: string }
const MENU: MenuItem[] = [
  { emo: "🏠", lab: "Start", href: `${ADMIN}/kontrollpanel` },
  { emo: "📋", lab: "Visa ordrar", href: `${ADMIN}/ordrar` },
  { emo: "📊", lab: "Statistik", href: `${ADMIN}/statistik` },
  { emo: "📦", lab: "Inköp / Lager", href: `${ADMIN}/inkop-lager` },
  { emo: "📇", lab: "Kunddatabas", href: `${ADMIN}/kunddatabas` },
  { emo: "🛒", lab: "Kampanjutskick", href: `${ADMIN}/kampanjutskick` },
  { emo: "✉️", lab: "Nyhetsbrev", href: `${ADMIN}/nyhetsbrev` },
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

async function jget(u: string) { return fetch(u, { credentials: "include" }).then((r) => r.json()) }
async function jsend(u: string, m: string, b?: any) { return fetch(u, { method: m, credentials: "include", headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined }).then((r) => r.json()) }

const th: any = { border: "1px solid #bbb", padding: "6px 8px", fontWeight: 700, fontSize: "11px", textAlign: "left", background: "#cccccc" }
const td: any = { border: "1px solid #e2e2e2", padding: "5px 8px", fontSize: "12px" }
const inp: any = { fontFamily: WF, fontSize: "12px", padding: "4px 6px", border: "1px solid #bbb", borderRadius: "2px" }
const btn: any = { fontFamily: WF, fontSize: "12px", padding: "4px 12px", border: "1px solid #999", borderRadius: "3px", background: "#f0f0f0", cursor: "pointer" }
const H2 = ({ children }: { children: any }) => <div style={{ textAlign: "center", fontWeight: 700, fontSize: "13px", margin: "16px 0 12px" }}>{children}</div>

function Hub({ subs, set }: { subs: number; set: (t: string) => void }) {
  const P: any = { fontSize: "12px", color: "#333", lineHeight: 1.6, margin: "0 0 10px" }
  const Li = ({ t, lab }: { t: string; lab: string }) => (
    <li style={{ margin: "8px 0" }}><a href="#" onClick={(e) => { e.preventDefault(); set(t) }} style={{ color: "#0060cc", textDecoration: "underline", fontSize: "13px" }}>{lab}</a></li>
  )
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto" }}>
      <p style={{ ...P, marginBottom: "14px" }}>Välj vad du vill göra…</p>
      <ul style={{ marginLeft: "18px" }}>
        <Li t="subs" lab={`Visa prenumeranter (${nf(subs)} st)`} />
        <Li t="new" lab="Skriv nytt nyhetsbrev" />
        <Li t="sent" lab="Hantera skickade nyhetsbrev" />
        <Li t="tpl" lab="Hantera HTML-mallar" />
      </ul>
      <hr style={{ margin: "16px 0", border: 0, borderTop: "1px solid #ddd" }} />
      <p style={{ ...P, color: "#666" }}>Nyhetsbrevsfunktionen i webbutiken är avsedd för utskick till dina prenumeranter. Vill du kunna skicka till väldigt många mottagare med avancerad statistik och uppföljning kan ett externt system användas. E-postadresser från kunder som önskar nyhetsbrev kan importeras hit.</p>
    </div>
  )
}

function Prenumeranter() {
  const [rows, setRows] = useState<any[]>([]); const [count, setCount] = useState(0)
  const [q, setQ] = useState(""); const [qa, setQa] = useState(""); const [nw, setNw] = useState({ email: "", name: "" })
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("")
  const load = async () => { const d = await jget(`/admin/newsletter/subscribers?limit=200${qa ? `&q=${encodeURIComponent(qa)}` : ""}`); setRows(d.subscribers || []); setCount(d.count || 0) }
  useEffect(() => { load() }, [qa])
  const add = async () => { if (!nw.email.trim()) return; await jsend("/admin/newsletter/subscribers", "POST", nw); setNw({ email: "", name: "" }); load() }
  const importCust = async () => { setBusy(true); setMsg(""); const r = await jsend("/admin/newsletter/subscribers", "POST", { import_customers: true }); setBusy(false); setMsg(`Importerade ${r.imported ?? 0} kunder. Totalt: ${nf(r.count ?? 0)} prenumeranter.`); load() }
  return (
    <div>
      <H2>Prenumeranter</H2>
      <div style={{ textAlign: "center", fontSize: "12px", marginBottom: "10px" }}>Antal prenumeranter: <b>{nf(count)}</b> st</div>
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <input style={{ ...inp, width: "220px" }} placeholder="Sök e-post/namn…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") setQa(q) }} />
        <button style={{ ...btn, marginLeft: "6px" }} onClick={() => setQa(q)}>SÖK</button>
        <button style={{ ...btn, marginLeft: "6px" }} disabled={busy} onClick={importCust}>{busy ? "Importerar…" : "Lägg till alla kunder"}</button>
      </div>
      {msg && <div style={{ textAlign: "center", fontSize: "12px", color: "#036", marginBottom: "8px" }}>{msg}</div>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th style={th}>E-postadress</th><th style={th}>Namn</th><th style={th}>Tillagd</th></tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={3} style={{ ...td, textAlign: "center", color: "#666" }}>Inga prenumeranter ännu. Klicka "Lägg till alla kunder" för att importera.</td></tr> :
            rows.map((s) => (<tr key={s.id} style={{ borderBottom: "1px solid #e2e2e2" }}>
              <td style={td}>{s.email}</td><td style={td}>{s.name || ""}</td>
              <td style={td}>{s.created_at ? new Date(s.created_at).toLocaleDateString("sv-SE") : ""}</td></tr>))}
          <tr style={{ background: "#f7f7f7" }}>
            <td style={td}><input style={{ ...inp, width: "95%" }} placeholder="ny@epost.se" value={nw.email} onChange={(e) => setNw({ ...nw, email: e.target.value })} /></td>
            <td style={td}><input style={{ ...inp, width: "95%" }} placeholder="Namn" value={nw.name} onChange={(e) => setNw({ ...nw, name: e.target.value })} /></td>
            <td style={{ ...td, textAlign: "center" }}><button style={btn} onClick={add}>Lägg till</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function SkrivNytt({ done }: { done: () => void }) {
  const [subject, setSubject] = useState(""); const [html, setHtml] = useState(""); const [msg, setMsg] = useState("")
  const save = async () => { if (!subject.trim()) { setMsg("Ange ett ämne."); return } await jsend("/admin/newsletter/campaigns", "POST", { subject, html }); setMsg("Sparat som utkast."); setSubject(""); setHtml(""); done() }
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto" }}>
      <H2>Skriv nytt nyhetsbrev</H2>
      <div style={{ marginBottom: "10px" }}><div style={{ fontSize: "12px", marginBottom: "3px" }}>Ämne</div><input style={{ ...inp, width: "100%", boxSizing: "border-box" }} value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
      <div style={{ marginBottom: "10px" }}><div style={{ fontSize: "12px", marginBottom: "3px" }}>HTML-innehåll</div><textarea style={{ ...inp, width: "100%", height: "220px", boxSizing: "border-box", fontFamily: "monospace" }} value={html} onChange={(e) => setHtml(e.target.value)} /></div>
      <div style={{ textAlign: "center" }}>
        <button style={btn} onClick={save}>Spara utkast</button>
        <button style={{ ...btn, marginLeft: "8px" }} title="Kräver e-posttjänst" onClick={() => setMsg("Utskick via e-posttjänst (Resend) kopplas in senare.")}>Skicka…</button>
      </div>
      {msg && <div style={{ textAlign: "center", fontSize: "12px", color: "#036", marginTop: "8px" }}>{msg}</div>}
    </div>
  )
}

function Skickade({ bump }: { bump: number }) {
  const [rows, setRows] = useState<any[]>([])
  useEffect(() => { (async () => { const d = await jget("/admin/newsletter/campaigns"); setRows(d.campaigns || []) })() }, [bump])
  return (
    <div>
      <H2>Skickade / sparade nyhetsbrev</H2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th style={th}>Ämne</th><th style={th}>Status</th><th style={{ ...th, textAlign: "right" }}>Mottagare</th><th style={th}>Skapad</th></tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={4} style={{ ...td, textAlign: "center", color: "#666" }}>Inga nyhetsbrev ännu.</td></tr> :
            rows.map((c) => (<tr key={c.id} style={{ borderBottom: "1px solid #e2e2e2" }}>
              <td style={td}>{c.subject}</td><td style={td}>{c.status}</td>
              <td style={{ ...td, textAlign: "right" }}>{c.recipients || 0}</td>
              <td style={td}>{c.created_at ? new Date(c.created_at).toLocaleDateString("sv-SE") : ""}</td></tr>))}
        </tbody>
      </table>
    </div>
  )
}

function Mallar() {
  const [rows, setRows] = useState<any[]>([]); const [nw, setNw] = useState({ name: "", html: "" })
  const load = async () => { const d = await jget("/admin/newsletter/templates"); setRows(d.templates || []) }
  useEffect(() => { load() }, [])
  const add = async () => { if (!nw.name.trim()) return; await jsend("/admin/newsletter/templates", "POST", nw); setNw({ name: "", html: "" }); load() }
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto" }}>
      <H2>Hantera HTML-mallar</H2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "14px" }}>
        <thead><tr><th style={th}>Mallnamn</th><th style={th}>Skapad</th></tr></thead>
        <tbody>{rows.length === 0 ? <tr><td colSpan={2} style={{ ...td, textAlign: "center", color: "#666" }}>Inga mallar ännu.</td></tr> :
          rows.map((t) => (<tr key={t.id} style={{ borderBottom: "1px solid #e2e2e2" }}><td style={td}>{t.name}</td><td style={td}>{t.created_at ? new Date(t.created_at).toLocaleDateString("sv-SE") : ""}</td></tr>))}</tbody>
      </table>
      <div style={{ fontSize: "12px", marginBottom: "3px" }}>Ny mall — namn</div>
      <input style={{ ...inp, width: "100%", boxSizing: "border-box", marginBottom: "8px" }} value={nw.name} onChange={(e) => setNw({ ...nw, name: e.target.value })} />
      <div style={{ fontSize: "12px", marginBottom: "3px" }}>HTML</div>
      <textarea style={{ ...inp, width: "100%", height: "150px", boxSizing: "border-box", fontFamily: "monospace", marginBottom: "8px" }} value={nw.html} onChange={(e) => setNw({ ...nw, html: e.target.value })} />
      <div style={{ textAlign: "center" }}><button style={btn} onClick={add}>Spara mall</button></div>
    </div>
  )
}

function NyhetsbrevPage() {
  const [tab, setTab] = useState("hub")
  const [meta, setMeta] = useState<{ online: number | null; unread: number }>({ online: null, unread: 0 })
  const [subs, setSubs] = useState(0); const [bump, setBump] = useState(0)

  useEffect(() => {
    const el = Array.from(document.querySelectorAll("div")).find((d) => {
      const c = typeof d.className === "string" ? d.className : ""
      return c.includes("w-[220px]") && c.includes("lg:flex") && c.includes("border-e")
    }) as HTMLElement | undefined
    const prev = el ? el.style.display : ""
    if (el) el.style.display = "none"
    return () => { if (el) el.style.display = prev }
  }, [])
  useEffect(() => { (async () => {
    try { const o = await jget("/admin/orders?limit=1"); setMeta((s) => ({ ...s, unread: o.count || 0 })) } catch {}
    try { const d = await jget("/admin/newsletter/subscribers?limit=1"); setSubs(d.count || 0) } catch {}
  })() }, [tab])

  const tb = (active: boolean): any => ({ padding: "6px 14px", margin: "0 4px", fontSize: "12px", fontFamily: WF, cursor: "pointer",
    border: "1px solid #9bb", borderRadius: "4px", background: active ? "#cfe3f5" : "#eef5fb", color: "#036", fontWeight: active ? 700 : 400 })

  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny online={meta.online} unread={meta.unread} active="Nyhetsbrev" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px" }}>
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>✉️</span>
          <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>NYHETSBREV</span>
        </div>
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <button style={tb(tab === "hub")} onClick={() => setTab("hub")}>Översikt</button>
          <button style={tb(tab === "subs")} onClick={() => setTab("subs")}>Visa prenumeranter</button>
          <button style={tb(tab === "new")} onClick={() => setTab("new")}>Skriv nytt</button>
          <button style={tb(tab === "sent")} onClick={() => setTab("sent")}>Hantera skickade</button>
          <button style={tb(tab === "tpl")} onClick={() => setTab("tpl")}>HTML-mallar</button>
        </div>
        {tab === "hub" && <Hub subs={subs} set={setTab} />}
        {tab === "subs" && <Prenumeranter />}
        {tab === "new" && <SkrivNytt done={() => setBump((b) => b + 1)} />}
        {tab === "sent" && <Skickade bump={bump} />}
        {tab === "tpl" && <Mallar />}
        <div style={{ textAlign: "center", marginTop: "22px", fontSize: "12px" }}>
          <a href={`${ADMIN}/kontrollpanel`} style={{ color: "#0060cc" }}>◄ Till kontrollpanelen</a>
        </div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Nyhetsbrev", icon: MailIcon })
export default NyhetsbrevPage
