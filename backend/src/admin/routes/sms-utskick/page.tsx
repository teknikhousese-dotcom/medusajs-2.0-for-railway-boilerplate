import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"

/**
 * Teknikhouse.se — SMS-utskick (1:1 mirror of Wikinggruppen customers.php?action=sms)
 * SKICKA SMS compose form. Saves drafts to sms_campaign (raw SQL). Actual SMS delivery
 * needs a gateway (kopplas in). Native nav hidden; Wiki Snabbmeny on the left.
 */
const ADMIN = "/app"
const WF = "Verdana, Tahoma, Arial, sans-serif"
const SmsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)
const nf = (n: number) => new Intl.NumberFormat("sv-SE").format(Math.round(Number(n || 0)))
type MenuItem = { emo: string; lab: string; href?: string }
const MENU: MenuItem[] = [
  { emo: "🏠", lab: "Start", href: `${ADMIN}/kontrollpanel` },
  { emo: "📋", lab: "Visa ordrar", href: `${ADMIN}/ordrar` },
  { emo: "📊", lab: "Statistik", href: `${ADMIN}/statistik` },
  { emo: "📦", lab: "Inköp / Lager", href: `${ADMIN}/inkop-lager` },
  { emo: "📇", lab: "Kunddatabas", href: `${ADMIN}/kunddatabas` },
  { emo: "🛒", lab: "Kampanjutskick", href: `${ADMIN}/kampanjutskick` },
  { emo: "✉️", lab: "Nyhetsbrev", href: `${ADMIN}/nyhetsbrev` },
  { emo: "📱", lab: "SMS-utskick", href: `${ADMIN}/sms-utskick` },
  { emo: "🤝", lab: "Avtalskunder", href: `${ADMIN}/customer-groups` },
  { emo: "🧰", lab: "Hantera produkter", href: `${ADMIN}/products` },
  { emo: "💡", lab: "Rekommendationer", href: `${ADMIN}/kontrollpanel?s=rekommendationer` },
  { emo: "🗂️", lab: "Hantera Varugrupper", href: `${ADMIN}/categories` },
  { emo: "🏷️", lab: "Rabattkoder", href: `${ADMIN}/promotions` },
  { emo: "🎁", lab: "Köp X betala för Y", href: `${ADMIN}/promotions` },
  { emo: "🚚", lab: "Fraktinställningar", href: `${ADMIN}/settings/locations` },
  { emo: "💳", lab: "Betalningsalternativ", href: `${ADMIN}/settings` },
  { emo: "📄", lab: "Redigerbara sidor", href: `${ADMIN}/kontrollpanel?s=sidor` },
  { emo: "📰", lab: "Nyheter", href: `${ADMIN}/kontrollpanel?s=nyheter` },
  { emo: "🔗", lab: "Länkar", href: `${ADMIN}/kontrollpanel?s=lankar` },
  { emo: "🔀", lab: "Import / Export", href: `${ADMIN}/products` },
  { emo: "⭐", lab: "Recensioner / Betyg", href: `${ADMIN}/kontrollpanel?s=recensioner` },
  { emo: "🖼️", lab: "Bildspel på 1:a sidan", href: `${ADMIN}/kontrollpanel?s=bildspel` },
  { emo: "📝", lab: "Blogg", href: `${ADMIN}/kontrollpanel?s=blogg` },
  { emo: "↪️", lab: "Hantera gamla URLer", href: `${ADMIN}/kontrollpanel?s=url301` },
  { emo: "🌐", lab: "Språk och valuta", href: `${ADMIN}/settings/store` },
  { emo: "🛍️", lab: "Google Shopping", href: `${ADMIN}/kontrollpanel?s=googlefeed` },
  { emo: "📧", lab: "E-postmallar", href: `${ADMIN}/kontrollpanel?s=epost` },
  { emo: "⚙️", lab: "Grundinställningar", href: `${ADMIN}/settings` },
]
function Snabbmeny({ online, unread, active }: { online: number | null; unread: number; active: string }) {
  return (
    <aside style={{ width: "220px", flexShrink: 0, borderRight: "1px solid #ccc", background: "#f4f4f4", fontFamily: WF }}>
      <div style={{ padding: "10px 12px", borderBottom: "1px solid #ccc", background: "#fff" }}>
        <div style={{ fontSize: "12px", fontWeight: 700 }}>Statistik</div>
        <div style={{ fontSize: "11px", color: "#444", marginTop: "4px" }}>Besökare online: <b>{online == null ? "—" : online} st</b></div>
        <div style={{ fontSize: "11px", color: "#444" }}>Olästa ordrar: <b>{unread} st</b></div>
      </div>
      <nav style={{ fontSize: "12px" }}>
        {MENU.map((m) => (
          <a key={m.lab} href={m.href}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", textDecoration: "none", color: "#000",
              borderBottom: "1px solid #e2e2e2", background: m.lab === active ? "#e2e2e2" : "transparent", fontWeight: m.lab === active ? 700 : 400 }}>
            <span style={{ width: "18px", textAlign: "center" }}>{m.emo}</span><span>{m.lab}</span>
          </a>
        ))}
        <a href={`${ADMIN}/login`} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", textDecoration: "none", color: "#a00", borderBottom: "1px solid #e2e2e2" }}>
          <span style={{ width: "18px", textAlign: "center" }}>⏻</span><span>Logga ut</span>
        </a>
      </nav>
    </aside>
  )
}
async function jget(u: string) { return fetch(u, { credentials: "include" }).then((r) => r.json()) }
async function jsend(u: string, m: string, b?: any) { return fetch(u, { method: m, credentials: "include", headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined }).then((r) => r.json()) }

function SmsUtskickPage() {
  const [meta, setMeta] = useState<{ online: number | null; unread: number }>({ online: null, unread: 0 })
  const [phone, setPhone] = useState(0); const [sent, setSent] = useState(0)
  const [rtype, setRtype] = useState("all"); const [num, setNum] = useState(""); const [sender, setSender] = useState("")
  const [when, setWhen] = useState(""); const [msg, setMsg] = useState(""); const [note, setNote] = useState("")
  const [rows, setRows] = useState<any[]>([])
  useEffect(() => {
    const el = Array.from(document.querySelectorAll("div")).find((d) => {
      const c = typeof d.className === "string" ? d.className : ""
      return c.includes("w-[220px]") && c.includes("lg:flex") && c.includes("border-e")
    }) as HTMLElement | undefined
    const prev = el ? el.style.display : ""
    if (el) el.style.display = "none"
    return () => { if (el) el.style.display = prev }
  }, [])
  const load = async () => {
    try { const o = await jget("/admin/orders?limit=1"); setMeta((s) => ({ ...s, unread: o.count || 0 })) } catch {}
    try { const d = await jget("/admin/sms/campaigns"); setPhone(d.phone_count || 0); setSent(d.total_sent || 0); setRows(d.campaigns || []) } catch {}
  }
  useEffect(() => { load() }, [])
  const save = async () => {
    if (!msg.trim()) { setNote("Skriv ett meddelande."); return }
    if (rtype === "number" && !num.trim()) { setNote("Ange ett mottagarnummer."); return }
    const r = await jsend("/admin/sms/campaigns", "POST", { recipient_type: rtype, recipient_number: num, sender, message: msg, scheduled_at: when || null })
    if (r && r.campaign) { setNote("Sparat som utkast (SMS-gateway kopplas in för att skicka). Mottagare: " + nf(r.campaign.recipients) + " st."); setMsg(""); setNum(""); setWhen(""); load() }
    else setNote("Kunde inte spara.")
  }
  const inp: any = { fontFamily: WF, fontSize: "12px", padding: "4px 6px", border: "1px solid #bbb", borderRadius: "2px" }
  const btn: any = { fontFamily: WF, fontSize: "12px", padding: "5px 16px", border: "1px solid #999", borderRadius: "3px", background: "#f0f0f0", cursor: "pointer" }
  const P: any = { fontSize: "12px", color: "#333", lineHeight: 1.6, margin: "0 0 8px" }
  const lab: any = { fontSize: "12px", fontWeight: 700, margin: "12px 0 4px" }
  const th: any = { border: "1px solid #bbb", padding: "6px 8px", fontWeight: 700, fontSize: "11px", textAlign: "left", background: "#cccccc" }
  const td: any = { border: "1px solid #e2e2e2", padding: "5px 8px", fontSize: "12px" }
  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny online={meta.online} unread={meta.unread} active="SMS-utskick" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px" }}>
        <div style={{ textAlign: "center", marginBottom: "14px" }}>
          <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>📱</span>
          <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>SKICKA SMS</span>
        </div>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <p style={P}>Här kan ni skicka SMS till befintliga kunder eller specifika nummer. Bra om man t.ex. vill skicka ut en rabattkod eller dylikt. Ett SMS kostar 0,60 SEK att skicka per mottagare.</p>
          <p style={{ ...P, color: "#666" }}>Totalt antal skickade SMS sedan nollställning: <b>{nf(sent)}</b> st. Större utskick (10&nbsp;000+ mottagare) bör godkännas innan de skickas.</p>

          <div style={lab}>Välj typ av mottagare:</div>
          <label style={{ display: "block", fontSize: "12px", margin: "3px 0" }}>
            <input type="radio" checked={rtype === "number"} onChange={() => setRtype("number")} /> Ett specifikt nummer:
            <input style={{ ...inp, width: "160px", marginLeft: "8px" }} value={num} onChange={(e) => setNum(e.target.value)} disabled={rtype !== "number"} />
          </label>
          <label style={{ display: "block", fontSize: "12px", margin: "3px 0" }}>
            <input type="radio" checked={rtype === "all"} onChange={() => setRtype("all")} /> Samtliga kunder med telefonnummer i kunddatabasen ({nf(phone)} st)
          </label>

          <div style={lab}>Avsändare (max 11 tecken utan ä, å eller ö):</div>
          <input style={{ ...inp, width: "200px" }} maxLength={11} value={sender} onChange={(e) => setSender(e.target.value)} />

          <div style={lab}>Skicka efter detta datum och klockslag <span style={{ fontWeight: 400, color: "#888" }}>(Format: ÅÅÅÅ-MM-DD TT:MM:SS)</span></div>
          <input style={{ ...inp, width: "220px" }} placeholder="2026-01-01 09:00:00" value={when} onChange={(e) => setWhen(e.target.value)} />

          <div style={lab}>Meddelande:</div>
          <textarea style={{ ...inp, width: "100%", height: "120px", boxSizing: "border-box" }} value={msg} onChange={(e) => setMsg(e.target.value)} />
          <div style={{ fontSize: "11px", color: "#888", margin: "3px 0" }}>{msg.length} tecken</div>

          <div style={{ textAlign: "center", marginTop: "10px" }}><button style={btn} onClick={save}>Spara / köa SMS-utskick</button></div>
          {note && <div style={{ textAlign: "center", fontSize: "12px", color: "#036", marginTop: "8px" }}>{note}</div>}

          <div style={{ fontWeight: 700, fontSize: "13px", textAlign: "center", margin: "20px 0 10px" }}>Utskick</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={th}>Meddelande</th><th style={th}>Mottagare</th><th style={th}>Status</th><th style={th}>Skapad</th></tr></thead>
            <tbody>{rows.length === 0 ? <tr><td colSpan={4} style={{ ...td, textAlign: "center", color: "#666" }}>Inga SMS-utskick ännu.</td></tr> :
              rows.map((c) => (<tr key={c.id} style={{ borderBottom: "1px solid #e2e2e2" }}>
                <td style={td}>{(c.message || "").slice(0, 40)}{(c.message || "").length > 40 ? "…" : ""}</td>
                <td style={td}>{c.recipient_type === "number" ? c.recipient_number : nf(c.recipients) + " kunder"}</td>
                <td style={td}>{c.status}</td>
                <td style={td}>{c.created_at ? new Date(c.created_at).toLocaleDateString("sv-SE") : ""}</td></tr>))}</tbody>
          </table>
        </div>
        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "12px" }}>
          <a href={`${ADMIN}/kunddatabas`} style={{ color: "#0060cc", marginRight: "14px" }}>Till kunddatabasen</a>
          <a href={`${ADMIN}/kontrollpanel`} style={{ color: "#0060cc" }}>◄ Till kontrollpanelen</a>
        </div>
      </div>
    </div>
  )
}
export const config = defineRouteConfig({ label: "SMS-utskick", icon: SmsIcon })
export default SmsUtskickPage
