import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"
import RichText from "../../components/RichText"

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
  </svg>
)

// E-postmallar som visas i order-utskicket (samma lista & ordning som Wikis order_message.php)
const ORDER = [
  "Leveransnotis", "DHL Freight - Spåra / Kolli-ID", "Godkänd retur", "Hämtning",
  "Kolli-ID  Postnord", "Makulering", "Omdöme - köpupplevelsen", "Postnord - Nytt Kolli-ID",
  "Reparation", "Retur info", "Uppdatering om din beställning Från Teknikhouse.se",
]

function orderId(): string {
  try { const p = new URLSearchParams(window.location.search); return p.get("order") || p.get("id") || "" } catch { return "" }
}
function render(text: string, map: Record<string, string>): string {
  let out = text || ""
  for (const [k, v] of Object.entries(map || {})) out = out.split(k).join(v)
  return out
}

function OrderEmailPage() {
  const [id] = useState(orderId)
  const [templates, setTemplates] = useState<any[]>([])
  const [placeholders, setPlaceholders] = useState<Record<string, string>>({})
  const [order, setOrder] = useState<any>(null)
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [html, setHtml] = useState("")
  const [tplId, setTplId] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const d = await fetch(`/admin/order-email?order=${encodeURIComponent(id)}`, { credentials: "include" }).then((r) => r.json())
        const tpls = d.templates || []
        const ph = d.placeholders || {}
        // sortera enligt Wiki-ordningen, bara de som hör till orderutskick
        const menu = ORDER.map((n) => tpls.find((t: any) => t.name === n)).filter(Boolean)
        setTemplates(menu); setPlaceholders(ph); setOrder(d.order || null)
        if (d.order?.email) setTo(d.order.email)
        // förvald mall = första (Leveransnotis), fyller ämne + innehåll direkt (som Wiki)
        const first = menu[0]
        if (first) { setTplId(first.id); setSubject(render(first.subject || "", ph)); setHtml(render(first.body_html || "", ph)) }
      } catch { /* ignore */ }
      setLoading(false)
    })()
  }, [id])

  const pick = (t: any) => {
    setTplId(t.id)
    setSubject(render(t.subject || "", placeholders))
    setHtml(render(t.body_html || "", placeholders))
    setResult(null)
  }

  const send = async () => {
    setResult(null)
    if (!to.trim() || !subject.trim() || !html.trim()) { setResult({ ok: false, msg: "Fyll i mottagare, ämne och innehåll." }); return }
    setSending(true)
    try {
      const r = await fetch(`/admin/order-email`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: id, to: to.trim(), subject, html }),
      })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d.ok) setResult({ ok: true, msg: `E-post skickad till ${d.to || to}.` })
      else setResult({ ok: false, msg: d.message || `Kunde inte skicka (fel ${r.status}).` })
    } catch (e: any) { setResult({ ok: false, msg: e?.message || "Kunde inte skicka." }) }
    setSending(false)
  }

  const bar: any = { background: "#cccccc", fontWeight: 700, fontSize: "13px", textAlign: "center", padding: "6px", border: "1px solid #999", margin: "16px 0 0" }
  const cell: any = { border: "1px solid #ccc", borderTop: "none", padding: "10px 12px", background: "#fff" }
  const inp: any = { width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "1px solid #bbb", fontSize: "13px", fontFamily: WF }
  const wikiNr = order ? (order.wiki_order_id || order.display_id) : id
  const lnk: any = { color: "#06c", textDecoration: "underline" }

  return (
    <div style={{ display: "flex", fontFamily: WF }}>
      <Snabbmeny active="Visa ordrar" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>📊</span>
          <span style={{ fontSize: "17px", fontWeight: 700, verticalAlign: "middle" }}>ORDRAR – SKICKA E-POST</span>
        </div>
        <div style={{ textAlign: "center", fontSize: "12px", margin: "6px 0" }}>
          {id && <div><a href={`${ADMIN}/ordrar?id=${id}`} style={lnk}>« Tillbaka till ordern</a></div>}
          <div><a href={`${ADMIN}/ordrar`} style={lnk}>« Tillbaka till orderlistan</a></div>
        </div>
        <div style={{ textAlign: "center", fontSize: "13px", margin: "8px 0 4px" }}>Här kan du skicka ett meddelande till kundens e-postadress.</div>

        {loading ? <div style={{ fontSize: "13px", color: "#666", padding: "20px 0" }}>Laddar…</div> : (
          <div style={{ maxWidth: "760px", margin: "0 auto" }}>
            <div style={bar}>Mottagare</div>
            <div style={cell}>
              <input style={{ ...inp, border: "1px solid #ddd" }} value={to} onChange={(e) => setTo(e.target.value)} />
            </div>

            <div style={bar}>E-postmall</div>
            <div style={cell}>
              {templates.length === 0 ? <div style={{ fontSize: "12px", color: "#999" }}>Inga mallar.</div> :
                templates.map((t) => (
                  <label key={t.id} style={{ display: "block", fontSize: "13px", padding: "3px 0", cursor: "pointer" }}>
                    <input type="radio" name="tpl" checked={tplId === t.id} onChange={() => pick(t)} style={{ marginRight: "8px" }} />{t.name}
                  </label>
                ))}
            </div>

            <div style={bar}>Subject/ämnesrad</div>
            <div style={cell}>
              <input style={inp} value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div style={bar}>Body/innehåll</div>
            <div style={cell}>
              <RichText value={html} onChange={(h) => setHtml(h)} minHeight={260} />
            </div>

            <div style={{ margin: "16px 0", display: "flex", alignItems: "center", gap: "12px" }}>
              <button onClick={send} disabled={sending}
                style={{ padding: "9px 24px", background: sending ? "#999" : "#F50000", color: "#fff", border: "none", borderRadius: "4px", cursor: sending ? "default" : "pointer", fontSize: "13px", fontWeight: 700, fontFamily: WF }}>
                {sending ? "Skickar…" : "Skicka e-post"}
              </button>
              {result && <span style={{ fontSize: "12px", color: result.ok ? "#161" : "#a00", fontWeight: 600 }}>{result.ok ? "✓ " : "⚠ "}{result.msg}</span>}
            </div>
            <div style={{ fontSize: "12px", textAlign: "center", marginBottom: "8px" }}><a href={`${ADMIN}/kontrollpanel`} style={lnk}>◄ Till kontrollpanelen</a></div>
          </div>
        )}
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Skicka e-post", icon: SendIcon, nested: "/ordrar" })
export default OrderEmailPage
