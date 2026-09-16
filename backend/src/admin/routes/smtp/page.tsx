import { useEffect, useState } from "react"
import { WF, Snabbmeny } from "../../lib/butikadmin"

const OUTER: any = { display: "flex", minHeight: "600px", background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden" }
const INNER: any = { flex: 1, fontFamily: WF, fontSize: "13px", color: "#333", padding: "16px 22px 60px", minWidth: 0 }
const BAR: any = { background: "#e6e6e6", border: "1px solid #bbb", borderBottom: "none", fontWeight: 700, fontSize: "14px", padding: "8px 12px", marginTop: 22 }
const BOX: any = { border: "1px solid #bbb", background: "#fff", padding: "14px 16px" }
const ROW: any = { padding: "10px 0", borderBottom: "1px solid #eee" }
const LBL: any = { display: "block", fontWeight: 700, marginBottom: 6 }
const HINT: any = { color: "#888", fontWeight: 400, fontSize: "12px" }
const INP: any = { width: "100%", maxWidth: 420, padding: "6px 8px", border: "1px solid #bbb", borderRadius: 3, fontFamily: WF, fontSize: "13px", boxSizing: "border-box" }
const OPT: any = { display: "block", padding: "3px 0", cursor: "pointer" }
const LINK: any = { color: "#2b6cb0", textDecoration: "none" }

function Section(props: any) {
  return (<div><div style={BAR}>{props.title}</div><div style={BOX}>{props.children}</div></div>)
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

  const Text = (name: string, label: string, type?: string, hint?: string) => (
    <div style={ROW}>
      <label style={LBL}>{label}{hint ? <span style={HINT}> {hint}</span> : null}</label>
      <input type={type || "text"} style={INP} value={f[name] || ""} onChange={(e) => set(name, e.target.value)} />
    </div>
  )
  const Radio = (name: string, label: string, opts: any[]) => (
    <div style={ROW}>
      <label style={LBL}>{label}</label>
      {opts.map((o: any) => (
        <label key={o[0]} style={OPT}>
          <input type="radio" name={name} checked={String(f[name] ?? opts[0][0]) === String(o[0])} onChange={() => set(name, o[0])} /> {o[1]}
        </label>
      ))}
    </div>
  )

  return (
    <div style={OUTER}>
      <Snabbmeny active="Grundinställningar" />
      <div style={INNER}>
      <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "16px 0 4px" }}>Inställningar för e-postutskick (SMTP)</h1>
      <p style={{ margin: "0 0 8px" }}><a href="/app/grundinstallningar" style={LINK}>« Tillbaka till Grundinställningar</a></p>

      <Section title="SMTP-server">
        <div style={ROW}>
          <label style={OPT}><input type="checkbox" checked={!!f["isactive"]} onChange={(e) => set("isactive", e.target.checked)} /> Aktiv</label>
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
              <label style={LBL}>Egen DKIM-nyckel (privat nyckel)</label>
              <textarea style={{ ...INP, maxWidth: 640, minHeight: 100, fontFamily: "monospace" }} value={f["dkimCustomKey"] || ""} onChange={(e) => set("dkimCustomKey", e.target.value)} />
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

      <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={save} style={{ background: "#c00", color: "#fff", border: "none", padding: "10px 22px", fontWeight: 700, borderRadius: 3, cursor: "pointer", fontFamily: WF }}>Spara SMTP-inställningar</button>
        <button onClick={test} style={{ background: "#eee", color: "#333", border: "1px solid #bbb", padding: "10px 18px", fontWeight: 700, borderRadius: 3, cursor: "pointer", fontFamily: WF }}>Skicka test</button>
        {msg ? <span style={{ color: "#127b12", fontWeight: 700 }}>{msg}</span> : null}
      </div>
      </div>
    </div>
  )
}

export default Page
