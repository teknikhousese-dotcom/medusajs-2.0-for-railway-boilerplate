import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

const BlogIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

function BloggPage() {
  const [rows, setRows] = useState<any[]>([])
  const [edit, setEdit] = useState<any>(null)
  const [ny, setNy] = useState("")
  const [msg, setMsg] = useState("")

  const load = async () => {
    const r = await fetch("/admin/blog", { credentials: "include" }).then((x) => x.json()).catch(() => ({ posts: [] }))
    setRows(r.posts || [])
  }
  useEffect(() => { load() }, [])

  const post = async (p: any) => { await fetch("/admin/blog", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) }) }
  const save = async () => { await post({ kind: "update", id: edit.id, title: edit.title, slug: edit.slug, body_html: edit.body_html, is_published: edit.is_published }); setMsg("Inlägget sparat."); setEdit(null); await load() }
  const skapa = async () => { const t = ny.trim(); if (!t) return; await post({ kind: "new", title: t }); setNy(""); await load() }
  const remove = async (id: string) => { if (!confirm("Ta bort inlägget?")) return; await post({ kind: "delete", id }); await load() }
  const fmt = (d: any) => { try { return new Date(d).toLocaleString("sv-SE") } catch { return d } }

  const th: any = { textAlign: "left", padding: "6px 10px", borderBottom: "2px solid #ccc", fontSize: "12px" }
  const td: any = { padding: "6px 10px", borderBottom: "1px solid #eee", fontSize: "12px" }
  const inp: any = { padding: "5px 7px", border: "1px solid #bbb", borderRadius: "3px", fontSize: "12px", fontFamily: WF }
  const btn: any = { padding: "5px 12px", background: "#4a90d9", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "12px" }
  const lnk: any = { color: "#06c", cursor: "pointer", marginRight: "10px" }

  return (
    <div style={{ display: "flex", fontFamily: WF }}>
      <Snabbmeny active="Blogg" />
      <div style={{ flex: 1 }}>
        <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", margin: "0 0 12px" }}>
          <div style={{ background: "#f4f4f4", borderBottom: "1px solid #ddd", padding: "10px 16px", fontWeight: 700, fontSize: "14px" }}>📝 Blogg – Alla blogginlägg</div>
          <div style={{ padding: "16px" }}>
            {msg && <div style={{ color: "#036", fontSize: "12px", marginBottom: "8px" }}>{msg}</div>}
            <div style={{ marginBottom: "12px" }}>
              <input style={{ ...inp, width: "300px" }} placeholder="Rubrik på nytt inlägg" value={ny} onChange={(e) => setNy(e.target.value)} />
              <button style={{ ...btn, marginLeft: "8px" }} onClick={skapa}>Nytt inlägg</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={{ ...th, width: "170px" }}>Publicerad</th><th style={th}>Rubrik</th><th style={{ ...th, width: "150px" }}>Åtgärd</th></tr></thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={3} style={{ ...td, textAlign: "center", color: "#999" }}>Inga inlägg ännu.</td></tr>
                ) : (
                  rows.map((p) => (
                    <tr key={p.id}>
                      <td style={td}>{fmt(p.published_at)}{p.is_published === false ? <span style={{ color: "#a80", fontSize: "11px" }}> (utkast)</span> : ""}</td>
                      <td style={td}>{p.title}</td>
                      <td style={td}>
                        <a style={lnk} onClick={() => { setEdit({ ...p }); setMsg("") }}>Ändra</a>
                        <a style={{ ...lnk, color: "#a00" }} onClick={() => remove(p.id)}>Ta bort</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {edit && (
              <div style={{ marginTop: "16px", border: "1px solid #ddd", borderRadius: "4px", padding: "12px", background: "#fafafa" }}>
                <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "8px" }}>Redigera inlägg</div>
                <div style={{ marginBottom: "8px" }}><div style={{ fontSize: "11px", color: "#666" }}>Rubrik</div><input style={{ ...inp, width: "100%", boxSizing: "border-box" }} value={edit.title || ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
                <div style={{ marginBottom: "8px" }}><div style={{ fontSize: "11px", color: "#666" }}>URL (slug)</div><input style={{ ...inp, width: "100%", boxSizing: "border-box" }} value={edit.slug || ""} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} /></div>
                <div style={{ marginBottom: "8px" }}><div style={{ fontSize: "11px", color: "#666" }}>Innehåll (HTML)</div><textarea style={{ ...inp, width: "100%", height: "240px", boxSizing: "border-box", fontFamily: "monospace" }} value={edit.body_html || ""} onChange={(e) => setEdit({ ...edit, body_html: e.target.value })} /></div>
                <label style={{ fontSize: "12px", display: "block", marginBottom: "8px" }}><input type="checkbox" checked={edit.is_published !== false} onChange={(e) => setEdit({ ...edit, is_published: e.target.checked })} /> Publicerad</label>
                <button style={btn} onClick={save}>Spara inlägg</button>
                <a style={{ ...lnk, marginLeft: "10px" }} onClick={() => setEdit(null)}>Avbryt</a>
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: "12px" }}><a href={`${ADMIN}/kontrollpanel`} style={{ color: "#06c" }}>◄ Till kontrollpanelen</a></div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Blogg", icon: BlogIcon })
export default BloggPage
