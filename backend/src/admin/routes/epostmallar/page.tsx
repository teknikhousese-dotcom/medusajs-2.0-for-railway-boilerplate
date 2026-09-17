import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { WF, Snabbmeny } from "../../lib/butikadmin"
import RichText from "../../components/RichText"

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" />
  </svg>
)

const OUTER: any = { display: "flex", minHeight: "600px", background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden" }
const INNER: any = { flex: 1, fontFamily: WF, fontSize: "12px", color: "#222", padding: "0 0 60px", minWidth: 0 }
const HEAD: any = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 8px", flexWrap: "wrap", gap: 10 }
const BAR: any = { background: "#dddddd", padding: "5px 14px", fontWeight: 700, fontSize: "12.5px", color: "#000", marginTop: 12, borderTop: "1px solid #cfcfcf", borderBottom: "1px solid #cfcfcf" }
const BODY: any = { padding: "0 18px" }
const TABLE: any = { width: "100%", borderCollapse: "collapse", fontSize: "12px" }
const TH: any = { textAlign: "left", padding: "7px 10px", background: "#f4f4f4", borderBottom: "1px solid #e0e0e0", fontWeight: 700, color: "#555" }
const TD: any = { padding: "7px 10px", borderBottom: "1px solid #f0f0f0" }
const AEDIT: any = { color: "#2b6cb0", textDecoration: "none", cursor: "pointer", fontWeight: 600 }
const ADEL: any = { color: "#c00", textDecoration: "none", cursor: "pointer" }
const INP: any = { width: "100%", maxWidth: 560, padding: "5px 8px", border: "1px solid #bcbcbc", borderRadius: 2, fontFamily: WF, fontSize: "12px", boxSizing: "border-box", background: "#fff", color: "#111" }
const BTN: any = { background: "#c00", color: "#fff", border: "none", padding: "9px 22px", fontWeight: 700, borderRadius: 3, cursor: "pointer", fontFamily: WF, fontSize: "12px" }
const BTN2: any = { background: "#f3f3f3", color: "#333", border: "1px solid #bbb", padding: "7px 16px", fontWeight: 700, borderRadius: 3, cursor: "pointer", fontFamily: WF, fontSize: "12px" }
const CHIP: any = { display: "inline-block", background: "#eef2f7", border: "1px solid #d6dfea", borderRadius: 3, padding: "2px 6px", margin: "0 5px 5px 0", fontFamily: "monospace", fontSize: "11px", color: "#2b4a6f", cursor: "pointer" }
const LBL: any = { display: "block", fontWeight: 700, margin: "14px 0 5px" }
const LINK: any = { color: "#2b6cb0", textDecoration: "none", cursor: "pointer" }

const VARS = ["%orderID%", "%orderNumber%", "%firstName%", "%lastName%", "%customerName%", "%order%", "%orderRows%", "%orderTotal%", "%email%", "%address%", "%deliveryAddress%", "%trackingID%", "%shopName%", "%shopURL%"]

function Section(props: any) {
  return (<div><div style={BAR}>{props.title}</div><div style={BODY}>{props.children}</div></div>)
}

const Page = () => {
  const [rows, setRows] = useState<any[]>([])
  const [sel, setSel] = useState<any>(null)
  const [subject, setSubject] = useState("")
  const [html, setHtml] = useState("")
  const [msg, setMsg] = useState("")
  const [testTo, setTestTo] = useState("")
  const [testMsg, setTestMsg] = useState<any>(null)
  const load = () => fetch("/admin/email-templates", { credentials: "include" }).then((r) => r.json()).then((j) => setRows(j.templates || [])).catch(() => {})
  useEffect(() => { load() }, [])
  const post = (b: any) => fetch("/admin/email-templates", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) })
  const openEdit = (t: any) => { setSel(t); setSubject(t.subject || ""); setHtml(t.body_html || ""); setMsg(""); setTestMsg(null); setTestTo("") }
  const back = () => { setSel(null); load() }
  const save = async () => {
    setMsg("Sparar...")
    const r = await post({ kind: "update", id: sel.id, subject, body_html: html })
    setMsg(r.ok ? "Mallen sparades." : "Kunde inte spara.")
    setTimeout(() => setMsg(""), 3000)
  }
  const sendTest = async () => {
    if (!testTo) { setTestMsg({ ok: false, message: "Ange en e-postadress" }); return }
    setTestMsg({ ok: true, message: "Skickar..." })
    const r = await post({ kind: "test", to: testTo, subject, body_html: html }).then((x: any) => x.json()).catch(() => ({ ok: false, message: "Nätverksfel" }))
    setTestMsg(r)
  }
  const del = async (t: any) => {
    if (!window.confirm("Ta bort mallen: " + t.name + " ?")) return
    await post({ kind: "delete", id: t.id }); load()
  }
  const addNew = async () => {
    const name = window.prompt("Namn på ny mall:")
    if (!name) return
    const j = await post({ kind: "new", name }).then((r) => r.json())
    await load()
    if (j && j.id) openEdit({ id: j.id, name, subject: "", body_html: "", is_system: false })
  }

  if (!sel) {
    const sys = rows.filter((t) => t.is_system)
    const custom = rows.filter((t) => !t.is_system)
    const rowEl = (t: any) => (
      <tr key={t.id}>
        <td style={TD}>{t.name}</td>
        <td style={{ ...TD, width: 90 }}><a style={AEDIT} onClick={() => openEdit(t)}>Ändra</a></td>
        <td style={{ ...TD, width: 90 }}>{t.is_system ? <span style={{ color: "#bbb" }}>—</span> : <a style={ADEL} onClick={() => del(t)}>Ta bort</a>}</td>
      </tr>
    )
    return (
      <div style={OUTER}>
        <Snabbmeny active="E-postmallar" />
        <div style={INNER}>
          <div style={HEAD}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><MailIcon /><h1 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>E-postmallar</h1></div>
            <button style={BTN} onClick={addNew}>+ Ny mall</button>
          </div>
          <p style={{ color: "#888", margin: 0, padding: "0 18px 4px", fontSize: "12px" }}>Klicka på Ändra för att redigera ämne och innehåll. Systemmallar kan inte tas bort.</p>
          <Section title="Systemmallar">
            <table style={TABLE}><thead><tr><th style={TH}>Mall</th><th style={{ ...TH, width: 90 }}>Ändra</th><th style={{ ...TH, width: 90 }}>Ta bort</th></tr></thead><tbody>{sys.map(rowEl)}</tbody></table>
          </Section>
          <Section title="Egna mallar">
            <table style={TABLE}><thead><tr><th style={TH}>Mall</th><th style={{ ...TH, width: 90 }}>Ändra</th><th style={{ ...TH, width: 90 }}>Ta bort</th></tr></thead><tbody>{custom.length ? custom.map(rowEl) : (<tr><td style={TD} colSpan={3}><span style={{ color: "#999" }}>Inga egna mallar ännu.</span></td></tr>)}</tbody></table>
          </Section>
        </div>
      </div>
    )
  }

  return (
    <div style={OUTER}>
      <Snabbmeny active="E-postmallar" />
      <div style={INNER}>
        <div style={{ padding: "16px 18px 2px" }}>
          <p style={{ margin: 0 }}><a style={LINK} onClick={back}>« Tillbaka till mallar</a></p>
          <h1 style={{ fontSize: "17px", fontWeight: 700, margin: "6px 0 0" }}>{sel.name}{sel.is_system ? <span style={{ fontSize: "11px", color: "#999", fontWeight: 400 }}> (systemmall)</span> : null}</h1>
        </div>
        <div style={{ padding: "0 18px" }}>
          <label style={LBL}>Ämne (subject)</label>
          <input style={INP} value={subject} onChange={(e) => setSubject(e.target.value)} />

          <label style={LBL}>Innehåll</label>
          <RichText value={html} onChange={(h: any) => setHtml(h)} minHeight={320} />

          <div style={{ marginTop: 12, background: "#fafafa", border: "1px solid #eee", borderRadius: 4, padding: "8px 10px" }}>
            <div style={{ fontWeight: 700, marginBottom: 5, color: "#555" }}>Variabler (klicka för att kopiera):</div>
            {VARS.map((v) => <span key={v} style={CHIP} onClick={() => { try { navigator.clipboard.writeText(v) } catch (e) {} }}>{v}</span>)}
          </div>

          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 14 }}>
            <button style={BTN} onClick={save}>Spara mall</button>
            <button style={BTN2} onClick={back}>Avbryt</button>
            {msg ? <span style={{ color: "#127b12", fontWeight: 700 }}>{msg}</span> : null}
          </div>

          <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid #eee" }}>
            <label style={LBL}>Skicka testmejl</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <input style={{ ...INP, maxWidth: 280 }} type="email" placeholder="din@epost.se" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
              <button style={BTN2} onClick={sendTest}>Skicka test</button>
              {testMsg ? <span style={{ color: testMsg.ok ? "#127b12" : "#c0392b", fontWeight: 700 }}>{testMsg.message}</span> : null}
            </div>
            <div style={{ color: "#999", fontSize: 11, marginTop: 5 }}>Skickar mallens ämne och innehåll som ett riktigt mejl till adressen ovan.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "E-postmallar", icon: MailIcon })
export default Page
