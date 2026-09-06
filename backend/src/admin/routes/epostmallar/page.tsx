import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" />
  </svg>
)

function EpostmallarPage() {
  const [rows, setRows] = useState<any[]>([])
  const [edit, setEdit] = useState<any>(null)
  const [nyNamn, setNyNamn] = useState("")
  const [msg, setMsg] = useState("")

  const load = async () => {
    const r = await fetch("/admin/email-templates", { credentials: "include" }).then((x) => x.json()).catch(() => ({ templates: [] }))
    setRows(r.templates || [])
  }
  useEffect(() => { load() }, [])

  const post = async (payload: any) => {
    await fetch("/admin/email-templates", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
  }
  const save = async () => { await post({ kind: "update", id: edit.id, subject: edit.subject, body_html: edit.body_html }); setMsg("Mallen sparad."); setEdit(null); await load() }
  const skapa = async () => { const n = nyNamn.trim(); if (!n) return; await post({ kind: "new", name: n }); setNyNamn(""); await load() }
  const remove = async (id: string) => { if (!confirm("Ta bort mallen?")) return; await post({ kind: "delete", id }); await load() }

  const th: any = { textAlign: "left", padding: "6px 10px", borderBottom: "2px solid #ccc", fontSize: "12px" }
  const td: any = { padding: "6px 10px", borderBottom: "1px solid #eee", fontSize: "12px" }
  const inp: any = { padding: "5px 7px", border: "1px solid #bbb", borderRadius: "3px", fontSize: "12px", fontFamily: WF }
  const btn: any = { padding: "5px 12px", background: "#4a90d9", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "12px" }
  const lnk: any = { color: "#06c", cursor: "pointer", marginRight: "10px" }

  return (
    <div style={{ display: "flex", fontFamily: WF }}>
      <Snabbmeny active="E-postmallar" />
      <div style={{ flex: 1 }}>
        <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", margin: "0 0 12px" }}>
          <div style={{ background: "#f4f4f4", borderBottom: "1px solid #ddd", padding: "10px 16px", fontWeight: 700, fontSize: "14px" }}>📧 Redigera E-postmallar</div>
          <div style={{ padding: "16px" }}>
            <p style={{ fontSize: "12px", color: "#666", margin: "0 0 12px" }}>Obs! Endast de mallar du skapar själv kan tas bort.</p>
            {msg && <div style={{ color: "#036", fontSize: "12px", marginBottom: "8px" }}>{msg}</div>}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Mall</th><th style={{ ...th, width: "160px" }}>Åtgärd</th></tr></thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={2} style={{ ...td, textAlign: "center", color: "#999" }}>Laddar…</td></tr>
                ) : (
                  rows.map((t) => (
                    <tr key={t.id}>
                      <td style={td}>{t.name}{t.is_system ? "" : <span style={{ color: "#999", fontSize: "11px" }}> (egen)</span>}</td>
                      <td style={td}>
                        <a style={lnk} onClick={() => { setEdit({ ...t }); setMsg("") }}>Ändra</a>
                        {!t.is_system && <a style={{ ...lnk, color: "#a00" }} onClick={() => remove(t.id)}>Ta bort</a>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {edit && (
              <div style={{ marginTop: "16px", border: "1px solid #ddd", borderRadius: "4px", padding: "12px", background: "#fafafa" }}>
                <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "8px" }}>Redigera: {edit.name}</div>
                <div style={{ marginBottom: "8px" }}>
                  <div style={{ fontSize: "11px", color: "#666" }}>Ämne</div>
                  <input style={{ ...inp, width: "100%", boxSizing: "border-box" }} value={edit.subject || ""} onChange={(e) => setEdit({ ...edit, subject: e.target.value })} />
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <div style={{ fontSize: "11px", color: "#666" }}>HTML-innehåll</div>
                  <textarea style={{ ...inp, width: "100%", height: "220px", boxSizing: "border-box", fontFamily: "monospace" }} value={edit.body_html || ""} onChange={(e) => setEdit({ ...edit, body_html: e.target.value })} />
                </div>
                <button style={btn} onClick={save}>Spara mall</button>
                <a style={{ ...lnk, marginLeft: "10px" }} onClick={() => setEdit(null)}>Avbryt</a>
              </div>
            )}

            <div style={{ marginTop: "18px", borderTop: "1px solid #eee", paddingTop: "12px" }}>
              <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "6px" }}>Ny e-postmall</div>
              <input style={{ ...inp, width: "240px" }} placeholder="Benämning" value={nyNamn} onChange={(e) => setNyNamn(e.target.value)} />
              <button style={{ ...btn, marginLeft: "8px" }} onClick={skapa}>Skapa</button>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: "12px" }}><a href={`${ADMIN}/kontrollpanel`} style={{ color: "#06c" }}>◄ Till kontrollpanelen</a></div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "E-postmallar", icon: MailIcon })
export default EpostmallarPage
