import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"

/**
 * Teknikhouse.se — Redigerbara sidor (1:1 mirror of Wikinggruppen editable_areas.php)
 * CMS: editable pages (Sidor) + fixed content blocks (Ytor). Raw-SQL tables
 * editable_page / editable_area under /admin/editable. HTML editor per page/area.
 */
const ADMIN = "/app"
const WF = "Verdana, Tahoma, Arial, sans-serif"
const PageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
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

function RedigerbaraSidorPage() {
  const [meta, setMeta] = useState<{ online: number | null; unread: number }>({ online: null, unread: 0 })
  const [pages, setPages] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [note, setNote] = useState("")
  const [newName, setNewName] = useState("")
  const [edit, setEdit] = useState<any>(null) // { type:'page'|'area', ...row }

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
    try { const d = await jget("/admin/editable"); setPages(d.pages || []); setAreas(d.areas || []) } catch {}
  }
  useEffect(() => { load() }, [])

  const createPage = async () => {
    if (!newName.trim()) { setNote("Ange ett namn."); return }
    const r = await jsend("/admin/editable", "POST", { kind: "page-new", name: newName })
    if (r.page) { setNewName(""); setNote("Sida skapad."); load(); setEdit({ type: "page", ...r.page }) }
  }
  const savePage = async () => {
    const r = await jsend("/admin/editable", "POST", { kind: "page-update", id: edit.id, name: edit.name, slug: edit.slug, content: edit.content, show_in_footer: edit.show_in_footer })
    if (r.page) { setNote("Sida sparad."); setEdit(null); load() }
  }
  const saveArea = async () => {
    const r = await jsend("/admin/editable", "POST", { kind: "area-update", id: edit.id, content: edit.content })
    if (r.area) { setNote("Ytan sparad."); setEdit(null); load() }
  }
  const delPage = async (p: any) => { if (p.protected) { setNote("Denna sida kan inte tas bort."); return } if (!confirm(`Ta bort sidan "${p.name}"?`)) return; await jsend("/admin/editable", "POST", { kind: "page-delete", id: p.id }); load() }
  const toggleFooter = async (p: any) => { await jsend("/admin/editable", "POST", { kind: "page-update", id: p.id, show_in_footer: !p.show_in_footer }); load() }

  const btn: any = { fontFamily: WF, fontSize: "12px", padding: "5px 16px", border: "1px solid #999", borderRadius: "3px", background: "#f0f0f0", cursor: "pointer" }
  const inp: any = { fontFamily: WF, fontSize: "12px", padding: "4px 6px", border: "1px solid #bbb", borderRadius: "2px" }
  const th: any = { border: "1px solid #bbb", padding: "6px 8px", fontWeight: 700, fontSize: "11px", textAlign: "left", background: "#cccccc" }
  const td: any = { border: "1px solid #e2e2e2", padding: "5px 8px", fontSize: "12px" }
  const H: any = { fontWeight: 700, fontSize: "13px", background: "#e2e2e2", padding: "5px 10px", borderRadius: "3px", margin: "16px 0 6px" }

  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny online={meta.online} unread={meta.unread} active="Redigerbara sidor" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px" }}>
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>📄</span>
          <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>REDIGERBARA SIDOR</span>
        </div>
        {note && <div style={{ fontSize: "12px", color: "#036", marginBottom: "10px", textAlign: "center" }}>{note}</div>}

        {edit ? (
          <div style={{ maxWidth: "760px", margin: "0 auto" }}>
            <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "10px" }}>
              {edit.type === "page" ? "Ändra sidan" : "Ändra ytan"}: {edit.name}
            </div>
            {edit.type === "page" && (
              <table style={{ borderCollapse: "collapse", marginBottom: "8px" }}><tbody>
                <tr><td style={{ ...td, border: "none", textAlign: "right", paddingRight: "10px" }}>Namn</td><td style={{ ...td, border: "none" }}><input style={{ ...inp, width: "300px" }} value={edit.name || ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></td></tr>
                <tr><td style={{ ...td, border: "none", textAlign: "right", paddingRight: "10px" }}>URL (slug)</td><td style={{ ...td, border: "none" }}><input style={{ ...inp, width: "300px" }} value={edit.slug || ""} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} /></td></tr>
                <tr><td style={{ ...td, border: "none", textAlign: "right", paddingRight: "10px" }}>Visas under "Övrigt"</td><td style={{ ...td, border: "none" }}><input type="checkbox" checked={!!edit.show_in_footer} onChange={(e) => setEdit({ ...edit, show_in_footer: e.target.checked })} /></td></tr>
              </tbody></table>
            )}
            <div style={{ fontSize: "12px", fontWeight: 700, margin: "4px 0" }}>Innehåll (HTML)</div>
            <textarea style={{ ...inp, width: "100%", height: "320px", boxSizing: "border-box", fontFamily: "Menlo, Consolas, monospace" }} value={edit.content || ""} onChange={(e) => setEdit({ ...edit, content: e.target.value })} />
            <div style={{ marginTop: "10px" }}>
              <button style={btn} onClick={() => edit.type === "page" ? savePage() : saveArea()}>Spara</button>
              <button style={{ ...btn, marginLeft: "8px", background: "#fff" }} onClick={() => { setEdit(null); setNote("") }}>Avbryt</button>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: "760px", margin: "0 auto" }}>
            {/* Redigerbara sidor */}
            <div style={H}>Redigerbara sidor</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Sida</th><th style={{ ...th, width: "110px" }}>Ändra</th><th style={{ ...th, width: "150px", textAlign: "center" }}>Visas under "Övrigt"</th><th style={{ ...th, width: "90px" }}></th></tr></thead>
              <tbody>{pages.length === 0 ? <tr><td colSpan={4} style={{ ...td, textAlign: "center", color: "#666" }}>Inga sidor ännu.</td></tr> :
                pages.map((p) => (<tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={td}>{p.name}</td>
                  <td style={td}><a href="#" onClick={(e) => { e.preventDefault(); setEdit({ type: "page", ...p }) }} style={{ color: "#0060cc" }}>Ändra sidan</a></td>
                  <td style={{ ...td, textAlign: "center" }}><input type="checkbox" checked={!!p.show_in_footer} onChange={() => toggleFooter(p)} /></td>
                  <td style={td}>{p.protected ? <span style={{ color: "#999" }}>Kan inte ta bort</span> : <a href="#" onClick={(e) => { e.preventDefault(); delPage(p) }} style={{ color: "#a00" }}>Ta bort</a>}</td>
                </tr>))}</tbody>
            </table>
            <div style={{ marginTop: "10px", display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: 700 }}>Ny sida —</span>
              <span style={{ fontSize: "12px" }}>Namn:</span>
              <input style={{ ...inp, width: "220px" }} value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") createPage() }} />
              <button style={btn} onClick={createPage}>Skapa</button>
            </div>

            {/* Redigerbara ytor */}
            <div style={H}>Redigerbara ytor</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Yta</th><th style={{ ...th, width: "110px" }}>Ändra</th></tr></thead>
              <tbody>{areas.map((a) => (<tr key={a.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={td}>{a.name}{a.content ? "" : <span style={{ color: "#bbb" }}> (tom)</span>}</td>
                <td style={td}><a href="#" onClick={(e) => { e.preventDefault(); setEdit({ type: "area", ...a }) }} style={{ color: "#0060cc" }}>Ändra ytan</a></td>
              </tr>))}</tbody>
            </table>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "12px" }}>
          <a href={`${ADMIN}/kontrollpanel`} style={{ color: "#0060cc" }}>◄ Till kontrollpanelen</a>
        </div>
      </div>
    </div>
  )
}
export const config = defineRouteConfig({ label: "Redigerbara sidor", icon: PageIcon })
export default RedigerbaraSidorPage
