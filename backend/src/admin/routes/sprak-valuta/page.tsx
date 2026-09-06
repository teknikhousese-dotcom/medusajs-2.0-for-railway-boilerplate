import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

const CURRENCIES = ["SEK", "EUR", "USD", "GBP", "DKK", "NOK", "AUD", "CAD"]
const ROUNDING = ["Exakt", "Heltal", "Övre nia", "Övre tia"]
const LANGS: [string, string][] = [["1", "Svenska"], ["2", "English"], ["3", "Deutsch"], ["4", "Suomi"], ["5", "Norsk"], ["6", "Dansk"], ["7", "Español"]]

function SprakPage() {
  const [cur, setCur] = useState<any>({})
  const [langActive, setLangActive] = useState<any>({ "1": "1" })
  const [defLang, setDefLang] = useState<string>("1")
  const [msg, setMsg] = useState("")

  useEffect(() => {
    fetch("/admin/wiki-settings?group=languages", { credentials: "include" }).then((r) => r.json()).then((j) => {
      const d = (j && j.data) || {}
      setCur(d.currencies || {})
      setLangActive(d.languages || { "1": "1" })
      setDefLang(d.defaultLanguage || "1")
    }).catch(() => {})
  }, [])
  const save = async () => {
    setMsg("Sparar…")
    const r = await fetch("/admin/wiki-settings", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ group: "languages", data: { currencies: cur, languages: langActive, defaultLanguage: defLang } }) })
    const j = await r.json(); setMsg(j.ok ? "✔ Språk och valuta sparade." : "Fel: " + (j.error || ""))
  }
  const g = (c: string, k: string) => (cur[c] || {})[k] || ""
  const setC = (c: string, k: string, v: any) => setCur((p: any) => ({ ...p, [c]: { ...(p[c] || {}), [k]: v } }))

  const inp: any = { padding: "4px 6px", border: "1px solid #bbb", borderRadius: "3px", fontSize: "12px", fontFamily: WF, boxSizing: "border-box" }
  const btn: any = { padding: "8px 20px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "13px", fontWeight: 700 }
  const card: any = { background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", margin: "0 0 12px" }
  const th: any = { textAlign: "left", padding: "6px 8px", borderBottom: "2px solid #ccc", fontSize: "11px", background: "#eee" }
  const td: any = { padding: "5px 8px", borderBottom: "1px solid #eee", fontSize: "12px" }

  return (
    <div style={{ display: "flex", fontFamily: WF }}>
      <Snabbmeny active="Språk och valuta" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={card}>
          <div style={{ background: "#f4f4f4", borderBottom: "1px solid #ddd", padding: "10px 16px", fontWeight: 700, fontSize: "14px" }}>🌐 Språk</div>
          <div style={{ padding: "16px" }}>
            {msg && <div style={{ padding: "8px 10px", marginBottom: "10px", borderRadius: "3px", background: msg.startsWith("Fel") ? "#fdecea" : "#e8f5e9", color: msg.startsWith("Fel") ? "#a00" : "#256029", fontSize: "12px" }}>{msg}</div>}
            <div style={{ fontSize: "12px", color: "#444", marginBottom: "10px" }}>Aktivera de språk butiken ska finnas på och välj standardspråk.</div>
            <table style={{ borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Språk</th><th style={th}>Aktivt</th><th style={th}>Standard</th></tr></thead>
              <tbody>
                {LANGS.map(([id, name]) => (
                  <tr key={id}>
                    <td style={{ ...td, fontWeight: 700 }}>{name}</td>
                    <td style={td}><input type="checkbox" checked={langActive[id] === "1" || defLang === id} disabled={defLang === id} onChange={(e) => setLangActive({ ...langActive, [id]: e.target.checked ? "1" : "" })} /></td>
                    <td style={td}><input type="radio" name="defLang" checked={defLang === id} onChange={() => setDefLang(id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={card}>
          <div style={{ background: "#f4f4f4", borderBottom: "1px solid #ddd", padding: "10px 16px", fontWeight: 700, fontSize: "14px" }}>💱 Valuta</div>
          <div style={{ padding: "16px" }}>
            <div style={{ fontSize: "12px", color: "#444", marginBottom: "10px" }}>Aktivera de valutor kunden ska kunna välja. Du kan sätta en fast växelkurs (Åsidosätt), en påslagsfaktor och avrundningsmetod per valuta.</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={th}>Valuta</th><th style={th}>Valbar</th><th style={th}>Åsidosätt kurs</th><th style={th}>Kurs</th><th style={th}>Påslag (×)</th><th style={th}>Avrundning</th><th style={th}>Egna priser</th>
              </tr></thead>
              <tbody>
                {CURRENCIES.map((c) => (
                  <tr key={c}>
                    <td style={{ ...td, fontWeight: 700 }}>{c}</td>
                    <td style={td}><input type="checkbox" checked={g(c, "isSelectable") === "1"} onChange={(e) => setC(c, "isSelectable", e.target.checked ? "1" : "")} /></td>
                    <td style={td}><input type="checkbox" checked={g(c, "doOveride") === "1"} onChange={(e) => setC(c, "doOveride", e.target.checked ? "1" : "")} /></td>
                    <td style={td}><input style={{ ...inp, width: "80px" }} value={g(c, "override")} onChange={(e) => setC(c, "override", e.target.value)} /></td>
                    <td style={td}><input style={{ ...inp, width: "70px" }} value={g(c, "extraMultiplication")} onChange={(e) => setC(c, "extraMultiplication", e.target.value)} placeholder="1.0" /></td>
                    <td style={td}>
                      <select style={{ ...inp, width: "110px" }} value={g(c, "roundingMethod") || "Exakt"} onChange={(e) => setC(c, "roundingMethod", e.target.value)}>
                        {ROUNDING.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td style={td}><input type="checkbox" checked={g(c, "useCustomPrices") === "1"} onChange={(e) => setC(c, "useCustomPrices", e.target.checked ? "1" : "")} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: "16px" }}><button style={btn} onClick={save}>Spara språk och valuta</button></div>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: "12px" }}><a href={`${ADMIN}/kontrollpanel`} style={{ color: "#06c" }}>◄ Till kontrollpanelen</a></div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Språk och valuta (Wiki)", icon: GlobeIcon })
export default SprakPage
