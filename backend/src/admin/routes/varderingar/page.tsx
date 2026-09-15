import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Fragment, useEffect, useState } from "react"
import { WF, Snabbmeny } from "../../lib/butikadmin"

const TagIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><circle cx="7" cy="7" r="1.5" />
  </svg>
)

const STATUSES = ["ny", "budskickat", "avslutad", "avbruten"]

function VarderingarPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try { const d = await fetch("/admin/valuations", { credentials: "include" }).then((r) => r.json()); setRows(d.valuations || []) } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const setStatus = async (id: string, status: string) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)))
    try { await fetch("/admin/valuations", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) }) } catch {}
  }

  const th: any = { border: "1px solid #bbb", padding: "6px 8px", fontWeight: 700, fontSize: "11px", textAlign: "left", background: "#ccc" }
  const td: any = { border: "1px solid #e2e2e2", padding: "5px 8px", fontSize: "12px", verticalAlign: "top" }

  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny active="Sälj din enhet" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px" }}>
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>💰</span>
          <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>VÄRDERINGAR — SÄLJ DIN ENHET</span>
        </div>
        <div style={{ fontSize: "12px", color: "#555", marginBottom: "10px", textAlign: "center" }}>
          Inkomna värderingsförfrågningar från kunder. {loading ? "Laddar…" : rows.length + " st"}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={th}>Referens</th><th style={th}>Datum</th><th style={th}>Enhet</th><th style={th}>Skick</th><th style={th}>Kund</th><th style={{ ...th, width: "130px" }}>Status</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && !loading ? <tr><td colSpan={6} style={{ ...td, textAlign: "center", color: "#777" }}>Inga värderingar ännu.</td></tr> :
              rows.map((r) => (
                <Fragment key={r.id}>
                  <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={td}><a href="#" onClick={(e) => { e.preventDefault(); setOpen(open === r.id ? null : r.id) }} style={{ color: "#0060cc" }}>{r.reference}</a></td>
                    <td style={td}>{r.created_at ? new Date(r.created_at).toLocaleString("sv-SE") : ""}</td>
                    <td style={td}>{r.device_type} {r.model}{r.storage ? " " + r.storage : ""}</td>
                    <td style={td}>{r.condition || "-"}</td>
                    <td style={td}>{r.name}<div style={{ color: "#888" }}>{r.email}{r.phone ? " · " + r.phone : ""}</div></td>
                    <td style={td}>
                      <select value={r.status || "ny"} onChange={(e) => setStatus(r.id, e.target.value)} style={{ fontFamily: WF, fontSize: "12px", padding: "3px 4px" }}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                  {open === r.id && (
                    <tr><td colSpan={6} style={{ ...td, background: "#fafafa" }}>
                      <div style={{ fontSize: "12px", lineHeight: 1.7 }}>
                        {Array.isArray(r.issues) && r.issues.length ? <div><b>Fel/anmärkningar:</b> {r.issues.join(", ")}</div> : null}
                        {r.accessories ? <div><b>Tillbehör:</b> {r.accessories}</div> : null}
                        {r.message ? <div><b>Meddelande:</b> {r.message}</div> : null}
                        <div><b>E-post:</b> <a href={"mailto:" + r.email} style={{ color: "#0060cc" }}>{r.email}</a>{r.phone ? " · " + r.phone : ""}</div>
                      </div>
                    </td></tr>
                  )}
                </Fragment>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Värderingar", icon: TagIcon })
export default VarderingarPage
