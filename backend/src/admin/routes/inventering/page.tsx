import { useEffect, useState } from "react"
import { ADMIN, WF, Shell } from "../../lib/butikadmin"

// Statistik / Inventering – Lagerbevakning (Wiki statistics.php?action=stockreminders).
// Lists customers who clicked "Bevaka produkt" on out-of-stock products.
// Bevakningsmejl skickas ALDRIG automatiskt – bara när man klickar "Skicka bevakningsmejl".

type Rem = { id: string; email: string; created_at: string; notified_at?: string | null; source: string }
type Prod = { key: string; product_id: string | null; wiki_product_id: number | null; title: string; handle: string | null; sku: string | null; in_stock: boolean | null; reminders: Rem[] }

const th: any = { textAlign: "left", padding: "5px 8px", background: "#e4e4e4", borderBottom: "1px solid #bbb", fontSize: "11px", fontWeight: 700 }
const td: any = { padding: "5px 8px", borderBottom: "1px solid #eee", fontSize: "12px", verticalAlign: "top" }
const tabBtn = (active: boolean): any => ({ padding: "6px 20px", margin: "0 6px", fontSize: "12px", fontFamily: WF, cursor: "pointer",
  border: "1px solid #9bb", borderRadius: "4px", background: active ? "#cfe3f5" : "#eef5fb", color: "#036", fontWeight: active ? 700 : 400 })
const d10 = (s: any) => (s ? String(s).slice(0, 10) : "")

function InventeringPage() {
  const [showSent, setShowSent] = useState(false)
  const [data, setData] = useState<{ products: Prod[]; total: number; products_count: number } | null>(null)
  const [prev, setPrev] = useState<{ ready: number; products: number; resend_configured: boolean } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setErr(null)
    try {
      const r = await fetch("/admin/lagerbevakning" + (showSent ? "?status=notified" : ""), { credentials: "include" })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || String(r.status))
      setData(j)
      const p = await fetch("/admin/lagerbevakning/skicka", { credentials: "include" }).then((x) => x.json())
      setPrev(p)
    } catch (e: any) { setErr(e?.message || String(e)) }
  }
  useEffect(() => { setData(null); load() }, [showSent])

  const send = async () => {
    if (!prev || !prev.ready) return
    const ok = window.confirm(`Skicka bevakningsmejl nu?\n\n${prev.ready} kund(er) på ${prev.products} produkt(er) som finns i lager igen får ett e-postmeddelande.\nDetta går inte att ångra.`)
    if (!ok) return
    setBusy(true); setMsg(null)
    try {
      const r = await fetch("/admin/lagerbevakning/skicka", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: "SKICKA" }) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || String(r.status))
      setMsg(`Skickade ${j.sent} av ${j.attempted} bevakningsmejl${j.failed ? ` (${j.failed} misslyckades)` : ""}.`)
      await load()
    } catch (e: any) { setMsg("Fel: " + (e?.message || String(e))) }
    setBusy(false)
  }

  return (
    <Shell active="Statistik">
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <span style={{ fontSize: "24px", verticalAlign: "middle", marginRight: "8px" }}>📊</span>
        <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>STATISTIK / INVENTERING</span>
      </div>
      <div style={{ textAlign: "center", marginBottom: "12px" }}>
        <button style={tabBtn(false)} onClick={() => { window.location.href = ADMIN + "/statistik" }}>Dashboard</button>
        <button style={tabBtn(false)} onClick={() => { window.location.href = ADMIN + "/statistik" }}>Försäljningstabell</button>
        <button style={tabBtn(true)}>Lagerbevakning</button>
      </div>
      <div style={{ fontSize: "12px", color: "#333", maxWidth: "900px", margin: "0 auto 12px", lineHeight: 1.5 }}>
        Här visas aktiva lagerbevakningar - dvs kunder som vill få e-postnotis när en produkt finns tillgänglig.
        Notisen skickas inte automatiskt: klicka på "Skicka bevakningsmejl" när lagret har fyllts på.
      </div>
      <div style={{ maxWidth: "900px", margin: "0 auto 10px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", fontSize: "12px" }}>
        <span>{data ? `${data.total} ${showSent ? "skickade" : "aktiva"} bevakningar på ${data.products_count} produkter` : "Laddar…"}</span>
        <label style={{ cursor: "pointer" }}><input type="checkbox" checked={showSent} onChange={(e) => setShowSent(e.target.checked)} /> Visa redan meddelade</label>
        <span style={{ flex: 1 }} />
        <button onClick={send} disabled={busy || !prev || !prev.ready || !prev.resend_configured}
          title={prev && !prev.resend_configured ? "Resend är inte konfigurerat" : ""}
          style={{ padding: "6px 14px", fontSize: "12px", fontFamily: WF, cursor: busy || !prev?.ready ? "default" : "pointer", border: "1px solid #6a6", borderRadius: "4px", background: prev?.ready ? "#e6f4e6" : "#f2f2f2", color: "#050" }}>
          {busy ? "Skickar…" : `Skicka bevakningsmejl (${prev ? prev.ready : "…"} redo)`}
        </button>
      </div>
      {msg && <div style={{ maxWidth: "900px", margin: "0 auto 10px", fontSize: "12px", color: msg.startsWith("Fel") ? "#c00" : "#070" }}>{msg}</div>}
      {err && <div style={{ color: "#c00", fontSize: "12px", textAlign: "center", margin: "10px" }}>Kunde inte hämta lagerbevakningar: {err}</div>}
      {data && (
        <table style={{ width: "100%", maxWidth: "900px", margin: "0 auto", borderCollapse: "collapse", fontFamily: WF }}>
          <thead>
            <tr>
              <th style={th}>Artikelnummer</th>
              <th style={th}>Produkt</th>
              <th style={th}>Lager</th>
              <th style={th}>Intresserade kunder</th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((p) => (
              <tr key={p.key}>
                <td style={td}>{p.sku || "—"}</td>
                <td style={td}>
                  {p.product_id ? <a href={ADMIN + "/products/" + p.product_id} style={{ color: "#036" }}>{p.title}</a> : <span title="Produkten kunde inte kopplas till en produkt i butiken">{p.title}</span>}
                  {!p.product_id && p.wiki_product_id ? <span style={{ color: "#999", fontSize: "11px" }}> (Wiki-id {p.wiki_product_id}, ej kopplad)</span> : null}
                </td>
                <td style={{ ...td, whiteSpace: "nowrap", color: p.in_stock ? "#070" : p.in_stock === false ? "#c00" : "#999" }}>
                  {p.in_stock ? "I lager" : p.in_stock === false ? "Slut" : "—"}
                </td>
                <td style={td}>
                  {p.reminders.map((r) => (
                    <div key={r.id}>
                      <a href={"mailto:" + r.email} style={{ color: "#036" }}>{r.email}</a>
                      <span style={{ color: "#999", fontSize: "11px" }}> {d10(r.created_at)}{r.source === "wiki" ? " (Wiki)" : ""}{r.notified_at ? " · meddelad " + d10(r.notified_at) : ""}</span>
                    </div>
                  ))}
                </td>
              </tr>
            ))}
            {!data.products.length && <tr><td colSpan={4} style={{ ...td, color: "#888", textAlign: "center" }}>Inga bevakningar.</td></tr>}
          </tbody>
        </table>
      )}
    </Shell>
  )
}

export default InventeringPage
