import { useEffect, useState } from "react"
import { WF, Snabbmeny } from "../../lib/butikadmin"

const OUTER: any = { display: "flex", minHeight: "600px", background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden" }
const INNER: any = { flex: 1, fontFamily: WF, fontSize: "12px", color: "#222", padding: "0 0 60px", minWidth: 0 }
const HEAD: any = { padding: "16px 18px 2px" }
const BAR: any = { background: "#dddddd", padding: "5px 14px", fontWeight: 700, fontSize: "12.5px", color: "#000", marginTop: 16, borderTop: "1px solid #cfcfcf", borderBottom: "1px solid #cfcfcf" }
const BODY: any = { padding: "4px 18px" }
const ROW: any = { display: "grid", gridTemplateColumns: "215px 1fr", alignItems: "start", padding: "6px 0", borderBottom: "1px solid #f2f2f2" }
const LBL: any = { fontSize: "12px", color: "#333", paddingTop: 5, paddingRight: 12, lineHeight: 1.4 }
const INP: any = { width: "100%", maxWidth: 360, padding: "4px 7px", border: "1px solid #bcbcbc", borderRadius: 2, fontFamily: WF, fontSize: "12px", boxSizing: "border-box", background: "#fff", color: "#111" }
const OPT: any = { display: "block", padding: "2px 0", cursor: "pointer", fontSize: "12px" }
const LINK: any = { color: "#2b6cb0", textDecoration: "none" }

function Section(props: any) {
  return (<div><div style={BAR}>{props.title}</div><div style={BODY}>{props.children}</div></div>)
}

const Page = () => {
  const [f, setF] = useState<any>({})
  const [msg, setMsg] = useState("")
  useEffect(() => {
    fetch("/admin/wiki-settings?group=smtp", { credentials: "include" })
      .then((r) => r.json()).then((j) => setF(j.data || {})).catch(() => {})
  }, [])
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }))
  const save = async () => {
    setMsg("Sparar...")
    const r = await fetch("/admin/wiki-settings", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ group: "smtp", data: f }) })
    setMsg(r.ok ? "SMTP-inställningarna sparades." : "Kunde inte spara.")
    setTimeout(() => setMsg(""), 3500)
  }
  const test = async () => {
    setMsg("Skickar testmejl...")
    try {
      const r = await fetch("/admin/smtp-test", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: f["to"] || "" }) })
      setMsg(r.ok ? "Testmejl skickat." : "Kunde inte skicka testmejl (e-postleverantör ej konfigurerad).")
    } catch (e) { setMsg("Kunde inte skicka testmejl.") }
    setTimeout(() => setMsg(""), 4000)
  }

  const Text = (name: string, label: string, type?: string) => (
    <div style={ROW}>
      <div style={LBL}>{label}</div>
      <div><input type={type || "text"} autoComplete="off" style={INP} value={f[name] || ""} onChange={(e) => set(name, e.target.value)} /></div>
    </div>
  )
  const Radio = (name: string, label: string, opts: any[]) => (
    <div style={ROW}>
      <div style={LBL}>{label}</div>
      <div>{opts.map((o: any) => (
        <label key={o[0]} style={OPT}>
          <input type="radio" name={name} checked={String(f[name] ?? opts[0][0]) === String(o[0])} onChange={() => set(name, o[0])} /> {o[1]}
        </label>
      ))}</div>
    </div>
  )

  return (
    <div style={OUTER}>
      <Snabbmeny active="Grundinställningar" />
      <div style={INNER}>
        <div style={HEAD}>
          <h1 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>Inställningar för e-postutskick (SMTP)</h1>
          <p style={{ margin: "4px 0 0" }}><a href="/app/grundinstallningar" style={LINK}>« Tillbaka till Grundinställningar</a></p>
        </div>

        <Section title="SMTP-server">
          <div style={ROW}>
            <div style={LBL}>Aktiv</div>
            <div style={{ paddingTop: 4 }}><label style={{ cursor: "pointer" }}><input type="checkbox" checked={!!f["isactive"]} onChange={(e) => set("isactive", e.target.checked)} /> Aktivera SMTP-utskick</label></div>
          </div>
          {Text("server", "Server")}
          {Text("port", "Port")}
          {Text("username", "Användarnamn")}
          {Text("password", "Lösenord", "password")}
          {Radio("encryption", "Kryptering", [["none", "Ingen kryptering"], ["ssltls", "SSL/TLS"], ["starttls", "STARTTLS"]])}
        </Section>

        <Section title="DKIM">
          {Radio("dkim", "DKIM", [["none", "Ingen DKIM-signering"], ["wiking", "Wikinggruppens DKIM-nyckel"], ["custom", "Egen DKIM-nyckel"]])}
          {String(f["dkim"]) === "custom" ? (
            <div>
              {Text("dkimCustomSelector", "DKIM-väljare (selector)")}
              <div style={ROW}>
                <div style={LBL}>Egen DKIM-nyckel (privat nyckel)</div>
                <div><textarea style={{ ...INP, maxWidth: 480, minHeight: 90, fontFamily: "monospace" }} value={f["dkimCustomKey"] || ""} onChange={(e) => set("dkimCustomKey", e.target.value)} /></div>
              </div>
            </div>
          ) : null}
        </Section>

        <Section title="Begränsningar och avsändare">
          {Text("limitDay", "Max utskick per dygn", "number")}
          {Text("limitHour", "Max utskick per timme", "number")}
          {Text("from", "Avsändaradress", "email")}
          {Text("to", "Mottagare för testutskick", "email")}
        </Section>

        <div style={{ padding: "18px", display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={save} style={{ background: "#c00", color: "#fff", border: "none", padding: "9px 22px", fontWeight: 700, borderRadius: 3, cursor: "pointer", fontFamily: WF, fontSize: "12px" }}>Spara SMTP-inställningar</button>
          <button onClick={test} style={{ background: "#eee", color: "#333", border: "1px solid #bbb", padding: "9px 18px", fontWeight: 700, borderRadius: 3, cursor: "pointer", fontFamily: WF, fontSize: "12px" }}>Skicka test</button>
          {msg ? <span style={{ color: "#127b12", fontWeight: 700 }}>{msg}</span> : null}
        </div>
      </div>
    </div>
  )
}

export default Page
