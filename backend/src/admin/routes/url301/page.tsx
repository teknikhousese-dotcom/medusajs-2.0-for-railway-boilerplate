import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

const OUTER: any = { display: "flex", flexDirection: "row", alignItems: "flex-start", fontFamily: WF, background: "#f3f3f3", minHeight: "100vh" }
const INNER: any = { flex: 1, padding: "0 0 40px" }
const HEAD: any = { display: "flex", alignItems: "center", gap: "8px", padding: "16px 18px 4px" }
const BAR: any = { background: "#dddddd", padding: "7px 12px", fontWeight: 700, fontSize: "13px", borderTop: "1px solid #cfcfcf" }
const BODY: any = { background: "#fff", padding: "12px", border: "1px solid #e3e3e3", borderTop: "none" }
const TH: any = { textAlign: "left", fontSize: "12px", color: "#555", fontWeight: 700, padding: "4px 6px" }
const TD: any = { padding: "3px 6px", verticalAlign: "middle" }
const INP: any = { width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "1px solid #c9c9c9", borderRadius: "4px", fontSize: "13px", fontFamily: WF }
const BTN: any = { padding: "7px 14px", background: "#2f6f4f", color: "#fff", border: "none", borderRadius: "5px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }
const BTN2: any = { padding: "6px 12px", background: "#fff", color: "#333", border: "1px solid #c9c9c9", borderRadius: "5px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }
const XBTN: any = { padding: "4px 9px", background: "#fff", color: "#b12", border: "1px solid #e0b6b6", borderRadius: "5px", fontWeight: 700, cursor: "pointer" }
const SECT: any = { margin: "14px 18px 0" }

const Page = () => {
  const [rows, setRows] = useState<any[]>([{ from: "", to: "" }])
  const [bulk, setBulk] = useState("")
  const [msg, setMsg] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch("/admin/url301", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        const rules = Array.isArray(j.rules) ? j.rules : []
        setRows(rules.length ? rules.concat([{ from: "", to: "" }]) : [{ from: "", to: "" }])
      })
      .catch(() => {})
  }, [])

  const setCell = (i: number, key: string, val: string) => {
    setRows((prev) => {
      const next = prev.slice()
      next[i] = Object.assign({}, next[i], { [key]: val })
      return next
    })
  }
  const addRow = () => setRows((prev) => prev.concat([{ from: "", to: "" }]))
  const delRow = (i: number) => setRows((prev) => prev.filter((r, k) => k !== i))

  const importBulk = () => {
    const lines = bulk.split("\n")
    const add: any[] = []
    for (const raw of lines) {
      const line = raw.trim()
      if (!line) continue
      let parts = line.split("\t")
      if (parts.length < 2) parts = line.split(",")
      if (parts.length < 2) parts = line.split(";")
      if (parts.length < 2) parts = line.split(" ")
      const from = (parts[0] || "").trim()
      const to = (parts.slice(1).join(" ") || "").trim()
      if (from && to) add.push({ from, to })
    }
    if (add.length) {
      setRows((prev) => prev.filter((r) => r.from || r.to).concat(add).concat([{ from: "", to: "" }]))
      setBulk("")
      setMsg("La till " + add.length + " rader. Klicka SPARA for att aktivera.")
    } else {
      setMsg("Hittade inga giltiga rader. Format: gammal-url, ny-url (en per rad).")
    }
  }

  const save = async () => {
    setBusy(true); setMsg("")
    const clean = rows.filter((r) => (r.from || "").trim() && (r.to || "").trim())
    try {
      const r = await fetch("/admin/url301", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: clean }),
      })
      const j = await r.json()
      if (r.ok) {
        const saved = Array.isArray(j.rules) ? j.rules : clean
        setRows(saved.concat([{ from: "", to: "" }]))
        setMsg("Sparat! " + (j.count != null ? j.count : saved.length) + " aktiva omdirigeringar. Slar igenom inom en minut.")
      } else {
        setMsg("Kunde inte spara.")
      }
    } catch (e) {
      setMsg("Kunde inte spara (natverksfel).")
    }
    setBusy(false)
  }

  return (
    <div style={OUTER}>
      <Snabbmeny active="Hantera gamla URLer" />
      <div style={INNER}>
        <div style={HEAD}>
          <span style={{ fontSize: "20px" }}>↪️</span>
          <h1 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>Hantera gamla URLer (301)</h1>
        </div>
        <p style={{ color: "#888", margin: 0, padding: "0 18px 6px", fontSize: "12px" }}>
          301-omdirigeringar - varje gammal Wiki-adress pekas om till sin nya sida sa att Google-rankingen och gamla lankar bevaras. Motsvarar Wikinggruppens 301-verktyg.
        </p>

        <div style={SECT}>
          <div style={BAR}>Omdirigeringar - Gammal URL till Ny URL</div>
          <div style={BODY}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH}>Gammal URL (sokvag)</th>
                  <th style={TH}>Ny URL (sokvag eller fullstandig)</th>
                  <th style={{ width: "44px" }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td style={TD}><input style={INP} value={row.from || ""} placeholder="/gammal-sida.php" onChange={(e) => setCell(i, "from", e.target.value)} /></td>
                    <td style={TD}><input style={INP} value={row.to || ""} placeholder="/ny-sida" onChange={(e) => setCell(i, "to", e.target.value)} /></td>
                    <td style={TD}><button style={XBTN} onClick={() => delRow(i)} title="Ta bort rad">x</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: "10px", display: "flex", gap: "8px", alignItems: "center" }}>
              <button style={BTN2} onClick={addRow}>+ Fler rader</button>
              <button style={BTN} onClick={save} disabled={busy}>{busy ? "Sparar..." : "SPARA"}</button>
              {msg ? <span style={{ fontSize: "12px", color: "#2f6f4f", marginLeft: "6px" }}>{msg}</span> : null}
            </div>
          </div>
        </div>

        <div style={SECT}>
          <div style={BAR}>Importera lista (klistra in)</div>
          <div style={BODY}>
            <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#666" }}>
              En rad per omdirigering. Format: gammal-url, ny-url (komma, semikolon, tab eller mellanslag mellan). Klicka Importera och darefter SPARA.
            </p>
            <textarea style={Object.assign({}, INP, { height: "120px", fontFamily: "monospace" })} value={bulk} placeholder="/gammal.php, /ny-sida" onChange={(e) => setBulk(e.target.value)} />
            <div style={{ marginTop: "8px" }}>
              <button style={BTN2} onClick={importBulk}>Importera till listan</button>
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 18px", fontSize: "11px", color: "#999" }}>
          Omdirigeringarna ar permanenta (HTTP 301) och galler direkt pa webbplatsen. Ange sokvag med inledande snedstreck. Ny URL kan vara en sokvag (/ny-sida) eller fullstandig adress.
        </div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Hantera gamla URLer (301)" })

export default Page
