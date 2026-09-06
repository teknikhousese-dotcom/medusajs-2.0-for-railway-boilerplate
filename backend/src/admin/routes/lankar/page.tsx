import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Shell, jget, jsend } from "../../lib/butikadmin"

/** Teknikhouse.se — Länkar (links.php mirror). Uses shared butikadmin shell. */
const LinkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)

function LankarPage() {
  const [links, setLinks] = useState<any[]>([])
  const [note, setNote] = useState("")
  const [nf, setNf] = useState({ url: "", title: "", description: "" })
  const [edit, setEdit] = useState<any>(null)

  const load = async () => { try { const d = await jget("/admin/links"); setLinks(d.links || []) } catch {} }
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
    <Shell active="Länkar">
      <div style={{ textAlign: "center", marginBottom: "12px" }}>
        <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>🔗</span>
        <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>LÄNKAR</span>
      </div>
      <p style={{ fontSize: "12px", color: "#333", margin: "0 0 10px", maxWidth: "720px" }}>Här kan du skapa och hantera externa länkar (till andra webbplatser).</p>
      {note && <div style={{ fontSize: "12px", color: "#036", marginBottom: "10px" }}>{note}</div>}

      <div style={{ maxWidth: "760px" }}>
        <div style={{ fontWeight: 700, fontSize: "13px", background: "#e2e2e2", padding: "5px 10px", borderRadius: "3px", margin: "6px 0" }}>Lägg till ny länk</div>
        <table style={{ borderCollapse: "collapse", marginBottom: "6px" }}><tbody>
          <tr><td style={{ ...td, border: "none", textAlign: "right", paddingRight: "10px" }}>Adress (URL)</td><td style={{ ...td, border: "none" }}><input style={{ ...inp, width: "420px" }} value={nf.url} onChange={(e) => setNf({ ...nf, url: e.target.value })} placeholder="https://..." /></td></tr>
          <tr><td style={{ ...td, border: "none", textAlign: "right", paddingRight: "10px" }}>Rubrik</td><td style={{ ...td, border: "none" }}><input style={{ ...inp, width: "420px" }} value={nf.title} onChange={(e) => setNf({ ...nf, title: e.target.value })} /></td></tr>
          <tr><td style={{ ...td, border: "none", textAlign: "right", paddingRight: "10px", verticalAlign: "top" }}>Beskrivning</td><td style={{ ...td, border: "none" }}><textarea style={{ ...inp, width: "420px", height: "54px" }} value={nf.description} onChange={(e) => setNf({ ...nf, description: e.target.value })} /></td></tr>
        </tbody></table>
        <div style={{ marginBottom: "16px" }}><button style={btn} onClick={add}>Lägg till länk</button></div>

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
    </Shell>
  )
}
export const config = defineRouteConfig({ label: "Länkar", icon: LinkIcon })
export default LankarPage
