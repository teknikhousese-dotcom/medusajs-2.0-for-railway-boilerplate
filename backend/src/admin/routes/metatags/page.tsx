import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { WF, Snabbmeny } from "../../lib/butikadmin"

const OUTER: any = { display: "flex", minHeight: "600px", background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden" }
const INNER: any = { flex: 1, fontFamily: WF, fontSize: "12px", color: "#222", padding: "0 0 60px", minWidth: 0 }
const HEAD: any = { padding: "16px 18px 2px" }
const BAR: any = { background: "#dddddd", padding: "5px 14px", fontWeight: 700, fontSize: "12.5px", color: "#000", marginTop: 16, borderTop: "1px solid #cfcfcf", borderBottom: "1px solid #cfcfcf" }
const BODY: any = { padding: "4px 18px" }
const ROW: any = { display: "grid", gridTemplateColumns: "170px 1fr", alignItems: "start", padding: "6px 0", borderBottom: "1px solid #f2f2f2" }
const LBL: any = { fontSize: "12px", color: "#333", paddingTop: 5, paddingRight: 12, lineHeight: 1.4 }
const HINT: any = { color: "#aaa", fontSize: "11px" }
const INP: any = { width: "100%", maxWidth: 540, padding: "4px 7px", border: "1px solid #bcbcbc", borderRadius: 2, fontFamily: WF, fontSize: "12px", boxSizing: "border-box", background: "#fff", color: "#111" }
const TA: any = { ...INP, minHeight: 58 }
const LINK: any = { color: "#2b6cb0", textDecoration: "none" }

function Section(props: any) {
  return (<div><div style={BAR}>{props.title}</div><div style={BODY}>{props.children}</div></div>)
}

const Page = () => {
  const [f, setF] = useState<any>({})
  const [msg, setMsg] = useState("")
  useEffect(() => {
    fetch("/admin/wiki-settings?group=metatags", { credentials: "include" })
      .then((r) => r.json()).then((j) => setF(j.data || {})).catch(() => {})
  }, [])
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }))
  const save = async () => {
    setMsg("Sparar...")
    const r = await fetch("/admin/wiki-settings", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ group: "metatags", data: f }) })
    setMsg(r.ok ? "Meta-data sparades." : "Kunde inte spara.")
    setTimeout(() => setMsg(""), 3500)
  }
  const len = (name: string) => (f[name] || "").length
  const Title = (name: string) => (
    <div style={ROW}>
      <div style={LBL}>SEO-titel <span style={HINT}>{len(name)}/60</span></div>
      <div><input style={INP} value={f[name] || ""} onChange={(e) => set(name, e.target.value)} /></div>
    </div>
  )
  const Desc = (name: string) => (
    <div style={ROW}>
      <div style={LBL}>Meta-beskrivning <span style={HINT}>{len(name)}/160</span></div>
      <div><textarea style={TA} value={f[name] || ""} onChange={(e) => set(name, e.target.value)} /></div>
    </div>
  )

  return (
    <div style={OUTER}>
      <Snabbmeny active="Grundinställningar" />
      <div style={INNER}>
        <div style={HEAD}>
          <h1 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>Meta-data för statiska sidor</h1>
          <p style={{ margin: "4px 0 0" }}><a href="/app/grundinstallningar" style={LINK}>« Tillbaka till Grundinställningar</a></p>
        </div>

        <Section title="Startsidan">{Title("title_startpage_sv")}{Desc("description_startpage_sv")}</Section>
        <Section title="Kontakt">{Title("title_contact_sv")}{Desc("description_contact_sv")}</Section>
        <Section title="Länkar">
          {Title("title_links_sv")}{Desc("description_links_sv")}
          <div style={ROW}>
            <div style={LBL}>Nofollow</div>
            <div style={{ paddingTop: 4 }}><label style={{ cursor: "pointer" }}><input type="checkbox" checked={!!f["linksNoFollow"] && f["linksNoFollow"] !== "0"} onChange={(e) => set("linksNoFollow", e.target.checked ? "1" : "0")} /> Sätt nofollow på utgående länkar</label></div>
          </div>
        </Section>
        <Section title="Nyheter">{Title("title_news_sv")}{Desc("description_news_sv")}</Section>
        <Section title="Nyhetsbrev">{Title("title_newsletter_sv")}{Desc("description_newsletter_sv")}</Section>

        <div style={{ padding: "18px", display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={save} style={{ background: "#c00", color: "#fff", border: "none", padding: "9px 22px", fontWeight: 700, borderRadius: 3, cursor: "pointer", fontFamily: WF, fontSize: "12px" }}>Spara meta-data</button>
          {msg ? <span style={{ color: "#127b12", fontWeight: 700 }}>{msg}</span> : null}
        </div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Metataggar" })
export default Page
