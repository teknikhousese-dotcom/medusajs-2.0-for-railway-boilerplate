import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

const TagIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
)

function RabattkoderPage() {
  const [rows, setRows] = useState<any[]>([])
  const [msg, setMsg] = useState("")
  const [np, setNp] = useState<any>({ code: "", percentage: "", isonetime: false })
  const [na, setNa] = useState<any>({ code: "", amountSEK: "", type: "flera" })
  const [nf, setNf] = useState<any>({ code: "", isonetime: false })

  const load = async () => {
    const j = await fetch("/admin/wiki-discounts", { credentials: "include" }).then((r) => r.json()).catch(() => ({ discounts: [] }))
    setRows(j.discounts || [])
  }
  useEffect(() => { load() }, [])

  const post = async (payload: any) => {
    const r = await fetch("/admin/wiki-discounts", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    return r.json()
  }
  const addPercent = async () => { const j = await post({ kind: "new_percent", ...np }); if (j.ok) { setMsg("✔ Rabattkod i procent tillagd."); setNp({ code: "", percentage: "", isonetime: false }); await load() } else setMsg("Fel: " + (j.error || "")) }
  const addAmount = async () => { const j = await post({ kind: "new_amount", ...na }); if (j.ok) { setMsg("✔ Rabattkod/presentkort med belopp tillagd."); setNa({ code: "", amountSEK: "", type: "flera" }); await load() } else setMsg("Fel: " + (j.error || "")) }
  const addFree = async () => { const j = await post({ kind: "new_freeship", ...nf }); if (j.ok) { setMsg("✔ Fri frakt-kod tillagd."); setNf({ code: "", isonetime: false }); await load() } else setMsg("Fel: " + (j.error || "")) }
  const save = async (r: any) => { const j = await post({ kind: "update", id: r.id, value: r.value, isonetime: (r.metadata || {}).isonetime === "1", start: (r.metadata || {}).start || "", end: (r.metadata || {}).end || "", amount_type: (r.metadata || {}).amount_type }); if (j.ok) setMsg("✔ Sparad."); else setMsg("Fel: " + (j.error || "")) }
  const remove = async (r: any) => { if (!confirm("Ta bort rabattkoden \"" + r.code + "\"?")) return; const j = await post({ kind: "delete", id: r.id }); if (j.ok) { setMsg("Rabattkod borttagen."); await load() } else setMsg("Fel: " + (j.error || "")) }

  const percent = rows.filter((r) => r.kind === "percent")
  const amount = rows.filter((r) => r.kind === "amount")
  const free = rows.filter((r) => r.kind === "freeship")
  const setField = (id: string, patch: any) => setRows(rows.map((r) => r.id === id ? { ...r, ...patch, metadata: { ...(r.metadata || {}), ...(patch.metadata || {}) } } : r))
  const fmtDate = (d: string) => d ? String(d).slice(0, 10) : ""

  const th: any = { textAlign: "left", padding: "6px 8px", borderBottom: "2px solid #ccc", fontSize: "11px", background: "#eee" }
  const td: any = { padding: "5px 8px", borderBottom: "1px solid #eee", fontSize: "12px" }
  const inp: any = { padding: "4px 6px", border: "1px solid #bbb", borderRadius: "3px", fontSize: "12px", fontFamily: WF, boxSizing: "border-box" }
  const btn: any = { padding: "6px 13px", background: "#4a90d9", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "12px" }
  const lnk: any = { color: "#a00", cursor: "pointer", fontSize: "12px" }
  const card: any = { background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", margin: "0 0 16px" }
  const head: any = { background: "#f4f4f4", borderBottom: "1px solid #ddd", padding: "9px 14px", fontWeight: 700, fontSize: "13px" }
  const body: any = { padding: "12px 14px" }
  const lbl: any = { fontSize: "11px", color: "#666", margin: "0 6px 0 0" }

  const rowEditor = (r: any, withValue: boolean, valueLabel: string) => (
    <tr key={r.id}>
      <td style={{ ...td, fontFamily: "monospace", fontWeight: 700 }}>{r.code}</td>
      {withValue && <td style={td}><input style={{ ...inp, width: "70px" }} value={r.value} onChange={(e) => setField(r.id, { value: e.target.value })} /></td>}
      {r.kind === "amount" && <td style={td}>
        <select style={{ ...inp, width: "160px" }} value={(r.metadata || {}).amount_type || "flera"} onChange={(e) => setField(r.id, { metadata: { amount_type: e.target.value } })}>
          <option value="flera">Rabatt till flera kunder</option><option value="enskild">Rabatt till enskild kund</option><option value="presentkort">Presentkort</option>
        </select></td>}
      {(r.kind === "percent" || r.kind === "freeship") && <td style={td}><input type="checkbox" checked={(r.metadata || {}).isonetime === "1"} onChange={(e) => setField(r.id, { metadata: { isonetime: e.target.checked ? "1" : "" } })} /></td>}
      <td style={td}>{fmtDate(r.created_at)}</td>
      <td style={td}><span style={{ color: "#06c" }}>Alla</span></td>
      <td style={td}><input style={{ ...inp, width: "120px" }} placeholder="ÅÅÅÅ-MM-DD" value={(r.metadata || {}).start || ""} onChange={(e) => setField(r.id, { metadata: { start: e.target.value } })} /></td>
      <td style={td}><input style={{ ...inp, width: "120px" }} placeholder="ÅÅÅÅ-MM-DD" value={(r.metadata || {}).end || ""} onChange={(e) => setField(r.id, { metadata: { end: e.target.value } })} /></td>
      <td style={td}><a style={{ color: "#06c", cursor: "pointer", marginRight: "8px" }} onClick={() => save(r)}>Spara</a><a style={lnk} onClick={() => remove(r)}>Ta bort</a></td>
    </tr>
  )

  return (
    <div style={{ display: "flex", fontFamily: WF }}>
      <Snabbmeny active="Rabattkoder" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...card }}>
          <div style={head}>🏷️ RABATTKODER</div>
          <div style={{ ...body, fontSize: "12px", color: "#444" }}>
            Rabattkoder är för närvarande <b style={{ color: "#2e7d32" }}>aktiverat</b>. Inaktiverar det gör du under grundinställningar.<br />
            Du kan välja mellan att göra en rabattkod som procentrabatt, fast summa eller fri frakt inom Sverige. Rabattkoden kan knytas till en, flera eller alla produkter.
            {msg && <div style={{ padding: "8px 10px", marginTop: "10px", borderRadius: "3px", background: msg.startsWith("Fel") ? "#fdecea" : "#e8f5e9", color: msg.startsWith("Fel") ? "#a00" : "#256029" }}>{msg}</div>}
          </div>
        </div>

        <div style={card}>
          <div style={head}>Rabattkoder i procent</div>
          <div style={body}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Rabattkod</th><th style={th}>Rabatt (heltal i procent)</th><th style={th}>Engångskod</th><th style={th}>Skapades</th><th style={th}>Produkter</th><th style={th}>Starttid</th><th style={th}>Sluttid</th><th style={th}>Åtgärd</th></tr></thead>
              <tbody>{percent.length === 0 ? <tr><td colSpan={8} style={{ ...td, color: "#999" }}>Inga rabattkoder i procent ännu.</td></tr> : percent.map((r) => rowEditor(r, true, "%"))}</tbody>
            </table>
            <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #ddd" }}>
              <b style={{ fontSize: "12px" }}>Lägg till ny rabattkod i procent</b><br />
              <span style={lbl}>Rabattkod (tomt = slumpas)</span><input style={{ ...inp, width: "120px" }} value={np.code} onChange={(e) => setNp({ ...np, code: e.target.value })} />
              <span style={{ ...lbl, marginLeft: "10px" }}>Procent</span><input style={{ ...inp, width: "60px" }} value={np.percentage} onChange={(e) => setNp({ ...np, percentage: e.target.value })} />
              <label style={{ ...lbl, marginLeft: "10px" }}><input type="checkbox" checked={np.isonetime} onChange={(e) => setNp({ ...np, isonetime: e.target.checked })} /> Engångskod</label>
              <button style={{ ...btn, marginLeft: "10px" }} onClick={addPercent}>Lägg till</button>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={head}>Rabattkoder/Presentkort med belopp</div>
          <div style={body}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Rabattkod</th><th style={th}>Belopp (kr)</th><th style={th}>Typ</th><th style={th}>Skapades</th><th style={th}>Produkter</th><th style={th}>Starttid</th><th style={th}>Sluttid</th><th style={th}>Åtgärd</th></tr></thead>
              <tbody>{amount.length === 0 ? <tr><td colSpan={8} style={{ ...td, color: "#999" }}>Inga rabattkoder med belopp ännu.</td></tr> : amount.map((r) => rowEditor(r, true, "kr"))}</tbody>
            </table>
            <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #ddd" }}>
              <b style={{ fontSize: "12px" }}>Lägg till ny rabattkod/presentkort med belopp</b><br />
              <span style={lbl}>Rabattkod</span><input style={{ ...inp, width: "120px" }} value={na.code} onChange={(e) => setNa({ ...na, code: e.target.value })} />
              <span style={{ ...lbl, marginLeft: "10px" }}>Belopp (kr)</span><input style={{ ...inp, width: "70px" }} value={na.amountSEK} onChange={(e) => setNa({ ...na, amountSEK: e.target.value })} />
              <span style={{ ...lbl, marginLeft: "10px" }}>Typ</span>
              <select style={{ ...inp, width: "170px" }} value={na.type} onChange={(e) => setNa({ ...na, type: e.target.value })}>
                <option value="flera">Rabatt till flera kunder</option><option value="enskild">Rabatt till enskild kund</option><option value="presentkort">Presentkort</option>
              </select>
              <button style={{ ...btn, marginLeft: "10px" }} onClick={addAmount}>Lägg till</button>
              <div style={{ fontSize: "11px", color: "#777", marginTop: "8px" }}><b>Förklaring av typerna:</b> "Rabatt till flera kunder" kan användas obegränsat antal gånger. "Rabatt till enskild kund" är personlig. "Presentkort" drar av beloppet och minskar saldot vid varje köp.</div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={head}>Rabattkoder för fri frakt (inrikes)</div>
          <div style={body}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Rabattkod</th><th style={th}>Engångskod</th><th style={th}>Skapades</th><th style={th}>Produkter</th><th style={th}>Starttid</th><th style={th}>Sluttid</th><th style={th}>Åtgärd</th></tr></thead>
              <tbody>{free.length === 0 ? <tr><td colSpan={7} style={{ ...td, color: "#999" }}>Inga fri frakt-koder ännu.</td></tr> : free.map((r) => rowEditor(r, false, ""))}</tbody>
            </table>
            <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #ddd" }}>
              <b style={{ fontSize: "12px" }}>Lägg till ny rabattkod för fri frakt inrikes</b><br />
              <span style={lbl}>Rabattkod</span><input style={{ ...inp, width: "120px" }} value={nf.code} onChange={(e) => setNf({ ...nf, code: e.target.value })} />
              <label style={{ ...lbl, marginLeft: "10px" }}><input type="checkbox" checked={nf.isonetime} onChange={(e) => setNf({ ...nf, isonetime: e.target.checked })} /> Engångskod</label>
              <button style={{ ...btn, marginLeft: "10px" }} onClick={addFree}>Lägg till</button>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: "12px" }}><a href={`${ADMIN}/kontrollpanel`} style={{ color: "#06c" }}>◄ Till kontrollpanelen</a></div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Rabattkoder (Wiki)", icon: TagIcon })
export default RabattkoderPage
