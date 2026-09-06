import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"

/**
 * Teknikhouse.se — Länkar (1:1 mirror of Wikinggruppen links.php)
 * External-link manager: list + add/edit (URL, title, description).
 * Raw-SQL table external_link under /admin/links (single dispatch route).
 */
const ADMIN = "/app"
const WF = "Verdana, Tahoma, Arial, sans-serif"
const LinkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
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
  { emo: "✉️", lab: "Nyhetsbrev", href: `${ADMIN}/nyhetsbrev` },
  { emo: "📱", lab: "SMS-utskick", href: `${ADMIN}/sms-utskick` },
  { emo: "🤝", lab: "Avtalskunder", href: `${ADMIN}/avtalskunder` },
  { emo: "🧰", lab: "Hantera produkter", href: `${ADMIN}/hantera-produkter` },
  { emo: "💡", lab: "Rekommendationer", href: `${ADMIN}/rekommendationer` },
  { emo: "🗂️", lab: "Hantera Varugrupper", href: `${ADMIN}/categories` },
  { emo: "🏷️", lab: "Rabattkoder", href: `${ADMIN}/promotions` },
  { emo: "🎁", lab: "Köp X betala för Y", href: `${ADMIN}/promotions` },
  { emo: "🚚", lab: "Fraktinställningar", href: `${ADMIN}/settings/locations` },
  { emo: "💳", lab: "Betalningsalternativ", href: `${ADMIN}/settings` },
  { emo: "📄", lab: "Redigerbara sidor", href: `${ADMIN}/redigerbara-sidor` },
  { emo: "📰", lab: "Nyheter", href: `${ADMIN}/nyheter` },
  { emo: "🔗", lab: "Länkar", href: `${ADMIN}/lankar` },
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

function LankarPage() {
  const [meta, setMeta] = useState<{ online: number | null; unread: number }>({ online: null, unread: 0 })
  const [links, setLinks] = useState<any[]>([])
  const [note, setNote] = useState("")
  const [nf, setNf] = useState({ url: "", title: "", description: "" })
  const [edit, setEdit] = useState<any>(null)

  useEffect(() => {
    const el = Array.from(document.querySelectorAll("div")).find((d) => {
      const c = typeof d.className === "string" ? d.className : ""
      return c.includes("w-[220px]") && c.includes("lg:flex") && c.includes("border-e")
    }) as HTMLElement | undefined
    const prev = el ? el.style.display : ""
    if (el) el.style.display = "none"
    return () => { if (el) el.style.display = prev }
  }, [])
  const load = async () => {
    try { const o = await jget("/admin/orders?limit=1"); setMeta((s) => ({ ...s, unread: o.count || 0 })) } catch {}
    try { const d = await jget("/admin/links"); setLinks(d.links || []) } catch {}
  }
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!nf.url.trim()) { setNote("Ange en adress (URL)."); return }
    const r = await jsend("/admin/links", "POST", { kind: "new", ...nf })
    if (r.link) { setNf({ url: "", title: "", description: "" }); setNote("Länk tillagd."); load() }
  }
  const saveEdit = async () => {
    const r = await jsend("/admin/links", "POST", { kind: "update", id: edit.id, url: edit.url, title: edit.title, description: edit.description })
    if (r.link) { setNote("Länk sparad."); setEdit(null); load() }
  }
  const del = async (l: any) => { if (!confirm(`Ta bort länken "${l.title || l.url}"?`)) return; await jsend("/admin/links", "POST", { kind: "delete", id: l.id }); load() }

  const btn: any = { fontFamily: WF, fontSize: "12px", padding: "5px 16px", border: "1px solid #999", borderRadius: "3px", background: "#f0f0f0", cursor: "pointer" }
  const inp: any = { fontFamily: WF, fontSize: "12px", padding: "4px 6px", border: "1px solid #bbb", borderRadius: "2px" }
  const th: any = { border: "1px solid #bbb", padding: "6px 8px", fontWeight: 700, fontSize: "11px", textAlign: "left", background: "#cccccc" }
  const td: any = { border: "1px solid #e2e2e2", padding: "5px 8px", fontSize: "12px", verticalAlign: "top" }

  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny online={meta.online} unread={meta.unread} active="Länkar" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px" }}>
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>🔗</span>
          <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>LÄNKAR</span>
        </div>
        <p style={{ fontSize: "12px", color: "#333", margin: "0 0 10px", maxWidth: "720px" }}>Här kan du skapa och hantera externa länkar (till andra webbplatser).</p>
        {note && <div style={{ fontSize: "12px", color: "#036", marginBottom: "10px" }}>{note}</div>}

        <div style={{ maxWidth: "760px" }}>
          {/* Lägg till ny länk */}
          <div style={{ fontWeight: 700, fontSize: "13px", background: "#e2e2e2", padding: "5px 10px", borderRadius: "3px", margin: "6px 0" }}>Lägg till ny länk</div>
          <table style={{ borderCollapse: "collapse", marginBottom: "6px" }}><tbody>
            <tr><td style={{ ...td, border: "none", textAlign: "right", paddingRight: "10px" }}>Adress (URL)</td><td style={{ ...td, border: "none" }}><input style={{ ...inp, width: "420px" }} value={nf.url} onChange={(e) => setNf({ ...nf, url: e.target.value })} placeholder="https://..." /></td></tr>
            <tr><td style={{ ...td, border: "none", textAlign: "right", paddingRight: "10px" }}>Rubrik</td><td style={{ ...td, border: "none" }}><input style={{ ...inp, width: "420px" }} value={nf.title} onChange={(e) => setNf({ ...nf, title: e.target.value })} /></td></tr>
            <tr><td style={{ ...td, border: "none", textAlign: "right", paddingRight: "10px", verticalAlign: "top" }}>Beskrivning</td><td style={{ ...td, border: "none" }}><textarea style={{ ...inp, width: "420px", height: "54px" }} value={nf.description} onChange={(e) => setNf({ ...nf, description: e.target.value })} /></td></tr>
          </tbody></table>
          <div style={{ marginBottom: "16px" }}><button style={btn} onClick={add}>Lägg till länk</button></div>

          {/* Befintliga länkar */}
          <div style={{ fontWeight: 700, fontSize: "13px", background: "#e2e2e2", padding: "5px 10px", borderRadius: "3px", margin: "6px 0" }}>Befintliga länkar</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={th}>Adress</th><th style={th}>Rubrik</th><th style={th}>Beskrivning</th><th style={{ ...th, width: "120px" }}></th></tr></thead>
            <tbody>{links.length === 0 ? <tr><td colSpan={4} style={{ ...td, textAlign: "center", color: "#666" }}>Inga länkar ännu.</td></tr> :
              links.map((l) => edit && edit.id === l.id ? (
                <tr key={l.id} style={{ background: "#fffbe6" }}>
                  <td style={td}><input style={{ ...inp, width: "100%", boxSizing: "border-box" }} value={edit.url || ""} onChange={(e) => setEdit({ ...edit, url: e.target.value })} /></td>
                  <td style={td}><input style={{ ...inp, width: "100%", boxSizing: "border-box" }} value={edit.title || ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></td>
                  <td style={td}><textarea style={{ ...inp, width: "100%", height: "44px", boxSizing: "border-box" }} value={edit.description || ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); saveEdit() }} style={{ color: "#0060cc" }}>Spara</a>
                    <span style={{ color: "#bbb" }}> | </span>
                    <a href="#" onClick={(e) => { e.preventDefault(); setEdit(null) }} style={{ color: "#777" }}>Avbryt</a>
                  </td>
                </tr>
              ) : (
                <tr key={l.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={td}><a href={l.url} target="_blank" rel="noreferrer" style={{ color: "#0060cc", wordBreak: "break-all" }}>{l.url}</a></td>
                  <td style={td}>{l.title || "—"}</td>
                  <td style={td}>{l.description || "—"}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setEdit({ ...l }) }} style={{ color: "#0060cc" }}>Redigera</a>
                    <span style={{ color: "#bbb" }}> | </span>
                    <a href="#" onClick={(e) => { e.preventDefault(); del(l) }} style={{ color: "#a00" }}>Ta bort länk</a>
                  </td>
                </tr>
              ))}</tbody>
          </table>
          <div style={{ marginTop: "10px", fontSize: "12px" }}>Totalt: <b>{links.length}</b> länkar.</div>
        </div>

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "12px" }}>
          <a href={`${ADMIN}/kontrollpanel`} style={{ color: "#0060cc" }}>◄ Till kontrollpanelen</a>
        </div>
      </div>
    </div>
  )
}
export const config = defineRouteConfig({ label: "Länkar", icon: LinkIcon })
export default LankarPage
