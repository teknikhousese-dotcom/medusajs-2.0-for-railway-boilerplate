import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

const GiftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
)

function KopXForYPage() {
  const [rules, setRules] = useState<any[]>([])
  const [msg, setMsg] = useState("")
  const [ny, setNy] = useState<any>({ namn: "", x: "3", y: "2" })
  const [q, setQ] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [picked, setPicked] = useState<any[]>([])

  const load = async () => {
    const j = await fetch("/admin/wiki-xfory", { credentials: "include" }).then((r) => r.json()).catch(() => ({ rules: [] }))
    setRules(j.rules || [])
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    const t = setTimeout(async () => {
      const j = await fetch("/admin/wiki-xfory?products=1&q=" + encodeURIComponent(q), { credentials: "include" }).then((r) => r.json()).catch(() => ({ products: [] }))
      setResults((j.products || []).filter((p: any) => !picked.find((x) => x.id === p.id)))
    }, 300)
    return () => clearTimeout(t)
  }, [q, picked])

  const post = async (payload: any) => (await fetch("/admin/wiki-xfory", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })).json()
  const add = async (p: any) => { setPicked([...picked, p]); setResults(results.filter((r) => r.id !== p.id)) }
  const unpick = (id: string) => setPicked(picked.filter((p) => p.id !== id))
  const skapa = async () => {
    const j = await post({ kind: "new", namn: ny.namn, x: ny.x, y: ny.y, product_ids: picked.map((p) => p.id), product_titles: picked.map((p) => p.title).join(", ") })
    if (j.ok) { setMsg("✔ Regel tillagd."); setNy({ namn: "", x: "3", y: "2" }); setPicked([]); setQ(""); await load() } else setMsg("Fel: " + (j.error || ""))
  }
  const spara = async (r: any) => { const j = await post({ kind: "update", id: r.id, namn: r.namn, x: r.x, y: r.y }); if (j.ok) setMsg("✔ Sparad."); else setMsg("Fel: " + (j.error || "")) }
  const remove = async (r: any) => { if (!confirm("Ta bort regeln \"" + r.namn + "\"?")) return; const j = await post({ kind: "delete", id: r.id }); if (j.ok) { setMsg("Regel borttagen."); await load() } else setMsg("Fel: " + (j.error || "")) }
  const setF = (id: string, patch: any) => setRules(rules.map((r) => r.id === id ? { ...r, ...patch } : r))

  const th: any = { textAlign: "left", padding: "6px 8px", borderBottom: "2px solid #ccc", fontSize: "11px", background: "#eee" }
  const td: any = { padding: "5px 8px", borderBottom: "1px solid #eee", fontSize: "12px" }
  const inp: any = { padding: "4px 6px", border: "1px solid #bbb", borderRadius: "3px", fontSize: "12px", fontFamily: WF, boxSizing: "border-box" }
  const btn: any = { padding: "6px 13px", background: "#4a90d9", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "12px" }
  const card: any = { background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", margin: "0 0 16px" }
  const head: any = { background: "#f4f4f4", borderBottom: "1px solid #ddd", padding: "9px 14px", fontWeight: 700, fontSize: "13px" }
  const lbl: any = { fontSize: "11px", color: "#666", margin: "0 6px 0 0" }

  return (
    <div style={{ display: "flex", fontFamily: WF }}>
      <Snabbmeny active="Köp X betala för Y" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={card}>
          <div style={head}>🎁 Köp X betala för Y</div>
          <div style={{ padding: "12px 14px", fontSize: "12px", color: "#444" }}>
            Skapa en regel där kunden köper ett antal produkter (X) men bara betalar för ett färre antal (Y). De billigaste (X − Y) produkterna blir gratis automatiskt i kassan. Regeln knyts till de produkter du väljer.
            {msg && <div style={{ padding: "8px 10px", marginTop: "10px", borderRadius: "3px", background: msg.startsWith("Fel") ? "#fdecea" : "#e8f5e9", color: msg.startsWith("Fel") ? "#a00" : "#256029" }}>{msg}</div>}
          </div>
        </div>

        <div style={card}>
          <div style={head}>Ny regel</div>
          <div style={{ padding: "12px 14px" }}>
            <div style={{ marginBottom: "8px" }}>
              <span style={lbl}>Regelnamn</span><input style={{ ...inp, width: "220px" }} value={ny.namn} onChange={(e) => setNy({ ...ny, namn: e.target.value })} placeholder="t.ex. Köp 3 betala för 2" />
              <span style={{ ...lbl, marginLeft: "12px" }}>Köp antal (X)</span><input style={{ ...inp, width: "56px" }} value={ny.x} onChange={(e) => setNy({ ...ny, x: e.target.value })} />
              <span style={{ ...lbl, marginLeft: "12px" }}>Betala för (Y)</span><input style={{ ...inp, width: "56px" }} value={ny.y} onChange={(e) => setNy({ ...ny, y: e.target.value })} />
            </div>
            <div style={{ fontSize: "11px", color: "#666", margin: "6px 0 4px" }}>Välj produkter</div>
            <input style={{ ...inp, width: "320px" }} placeholder="Sök produkt…" value={q} onChange={(e) => setQ(e.target.value)} />
            {results.length > 0 && (
              <div style={{ border: "1px solid #ddd", borderRadius: "4px", maxHeight: "160px", overflowY: "auto", marginTop: "4px", maxWidth: "420px" }}>
                {results.map((p) => <div key={p.id} onClick={() => add(p)} style={{ padding: "5px 8px", fontSize: "12px", cursor: "pointer", borderBottom: "1px solid #f0f0f0" }}>{p.title}</div>)}
              </div>
            )}
            {picked.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                {picked.map((p) => <span key={p.id} style={{ display: "inline-block", background: "#e8f0fe", border: "1px solid #c5d9f7", borderRadius: "12px", padding: "3px 10px", margin: "0 6px 6px 0", fontSize: "11px" }}>{p.title} <span onClick={() => unpick(p.id)} style={{ color: "#a00", cursor: "pointer", fontWeight: 700 }}>×</span></span>)}
              </div>
            )}
            <div style={{ marginTop: "8px" }}><button style={{ ...btn, background: "#2e7d32" }} onClick={skapa}>Lägg till regel</button></div>
          </div>
        </div>

        <div style={card}>
          <div style={head}>Befintliga regler</div>
          <div style={{ padding: "12px 14px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Regelnamn</th><th style={th}>Köp (X)</th><th style={th}>Betala för (Y)</th><th style={th}>Produkter</th><th style={th}>Skapades</th><th style={th}>Åtgärd</th></tr></thead>
              <tbody>
                {rules.length === 0 ? <tr><td colSpan={6} style={{ ...td, color: "#999" }}>Inga regler ännu.</td></tr> :
                  rules.map((r) => (
                    <tr key={r.id}>
                      <td style={td}><input style={{ ...inp, width: "180px" }} value={r.namn} onChange={(e) => setF(r.id, { namn: e.target.value })} /></td>
                      <td style={td}><input style={{ ...inp, width: "50px" }} value={r.x} onChange={(e) => setF(r.id, { x: e.target.value })} /></td>
                      <td style={td}><input style={{ ...inp, width: "50px" }} value={r.y} onChange={(e) => setF(r.id, { y: e.target.value })} /></td>
                      <td style={{ ...td, maxWidth: "280px", fontSize: "11px", color: "#555" }}>{r.products}</td>
                      <td style={td}>{r.created_at ? String(r.created_at).slice(0, 10) : ""}</td>
                      <td style={td}><a style={{ color: "#06c", cursor: "pointer", marginRight: "8px" }} onClick={() => spara(r)}>Spara</a><a style={{ color: "#a00", cursor: "pointer" }} onClick={() => remove(r)}>Ta bort</a></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: "12px" }}><a href={`${ADMIN}/kontrollpanel`} style={{ color: "#06c" }}>◄ Till kontrollpanelen</a></div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Köp X betala för Y (Wiki)", icon: GiftIcon })
export default KopXForYPage
