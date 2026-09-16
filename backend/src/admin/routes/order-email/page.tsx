import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
  </svg>
)

function orderId(): string {
  try {
    const p = new URLSearchParams(window.location.search)
    return p.get("order") || p.get("id") || ""
  } catch { return "" }
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
  const [showSource, setShowSource] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const d = await fetch(`/admin/order-email?order=${encodeURIComponent(id)}`, { credentials: "include" }).then((r) => r.json())
        setTemplates(d.templates || [])
        setPlaceholders(d.placeholders || {})
        setOrder(d.order || null)
        if (d.order?.email) setTo(d.order.email)
      } catch { /* ignore */ }
      setLoading(false)
    })()
  }, [id])

  const pickTemplate = (val: string) => {
    setTplId(val)
    const t = templates.find((x) => x.id === val)
    if (!t) return
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
    } catch (e: any) {
      setResult({ ok: false, msg: e?.message || "Kunde inte skicka." })
    }
    setSending(false)
  }

  const lbl: any = { display: "block", fontSize: "12px", fontWeight: 700, margin: "12px 0 4px", color: "#333" }
  const inp: any = { width: "100%", boxSizing: "border-box", padding: "7px 9px", border: "1px solid #bbb", borderRadius: "3px", fontSize: "13px", fontFamily: WF }
  const wikiNr = order ? (order.wiki_order_id || order.display_id) : id

  return (
    <div style={{ display: "flex", fontFamily: WF }}>
      <Snabbmeny active="Visa ordrar" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", maxWidth: "820px", margin: "0 0 12px" }}>
          <div style={{ background: "#f4f4f4", borderBottom: "1px solid #ddd", padding: "10px 16px", fontWeight: 700, fontSize: "14px" }}>
            ✉ ORDRAR – SKICKA E-POST{order ? ` · Order ${wikiNr}` : ""}
          </div>
          <div style={{ padding: "16px" }}>
            <div style={{ fontSize: "12px", marginBottom: "10px" }}>
              {id && <a href={`${ADMIN}/ordrar?id=${id}`} style={{ color: "#06c", marginRight: "14px" }}>« Tillbaka till ordern</a>}
              <a href={`${ADMIN}/ordrar`} style={{ color: "#06c" }}>« Tillbaka till orderlistan</a>
            </div>
            <p style={{ fontSize: "12px", color: "#666", margin: "0 0 8px" }}>Här kan du skicka ett meddelande till kundens e-postadress.</p>

            {loading ? <div style={{ fontSize: "13px", color: "#666" }}>Laddar…</div> : (
              <>
                <label style={lbl}>Mottagare</label>
                <input style={inp} value={to} onChange={(e) => setTo(e.target.value)} placeholder="kundens@epost.se" />

                <label style={lbl}>E-postmall</label>
                <select style={{ ...inp, cursor: "pointer" }} value={tplId} onChange={(e) => pickTemplate(e.target.value)}>
                  <option value="">– Välj mall (fyller ämne &amp; innehåll) –</option>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>

                <label style={lbl}>Ämnesrad</label>
                <input style={inp} value={subject} onChange={(e) => setSubject(e.target.value)} />

                <label style={lbl}>Innehåll</label>
                <div style={{ marginBottom: "4px" }}>
                  <a onClick={() => setShowSource((v) => !v)} style={{ fontSize: "11px", color: "#06c", cursor: "pointer" }}>
                    {showSource ? "Visa förhandsvisning" : "Visa HTML-källa"}
                  </a>
                </div>
                {showSource ? (
                  <textarea style={{ ...inp, height: "260px", fontFamily: "monospace" }} value={html} onChange={(e) => setHtml(e.target.value)} />
                ) : (
                  <div style={{ border: "1px solid #ddd", borderRadius: "3px", padding: "12px", minHeight: "220px", background: "#fbfbfb", overflow: "auto" }}
                    dangerouslySetInnerHTML={{ __html: html || "<span style='color:#999'>Välj en mall eller skriv HTML via “Visa HTML-källa”.</span>" }} />
                )}

                <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <button onClick={send} disabled={sending}
                    style={{ padding: "9px 22px", background: sending ? "#999" : "#F50000", color: "#fff", border: "none", borderRadius: "4px", cursor: sending ? "default" : "pointer", fontSize: "13px", fontWeight: 700, fontFamily: WF }}>
                    {sending ? "Skickar…" : "Skicka e-post"}
                  </button>
                  {result && (
                    <span style={{ fontSize: "12px", color: result.ok ? "#161" : "#a00", fontWeight: 600 }}>
                      {result.ok ? "✓ " : "⚠ "}{result.msg}
                    </span>
                  )}
                </div>

                <div style={{ marginTop: "14px", fontSize: "11px", color: "#888", borderTop: "1px solid #eee", paddingTop: "8px" }}>
                  Platshållare som fylls automatiskt: {"{{kundnamn}}"}, {"{{ordernummer}}"}, {"{{orderrader}}"}, {"{{ordertotal}}"}, {"{{leveransadress}}"}, {"{{sparnummer}}"}, {"{{sparlank}}"}.
                </div>
              </>
            )}
          </div>
        </div>
        <div style={{ fontSize: "12px" }}><a href={`${ADMIN}/kontrollpanel`} style={{ color: "#06c" }}>◄ Till kontrollpanelen</a></div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Skicka e-post", icon: SendIcon, nested: "/ordrar" })
export default OrderEmailPage
