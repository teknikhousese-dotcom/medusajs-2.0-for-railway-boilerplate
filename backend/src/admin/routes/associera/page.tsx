import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

/**
 * Teknikhouse.se — Associera produkter (spegling av Wikinggruppen associated.php)
 * Kopplar ihop produkter för merförsäljning. Kopplingarna sparas i produktens
 * metadata.associerade_produkter (lista med produkt-id).
 */
const KEY = "associerade_produkter"
async function jget(u: string) { return fetch(u, { credentials: "include" }).then((r) => r.json()) }
async function jsend(u: string, m: string, b?: any) {
  const r = await fetch(u, { method: m, credentials: "include", headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((j && j.message) || "HTTP " + r.status)
  return j
}
const idsAv = (p: any): string[] => {
  const v = p && p.metadata ? p.metadata[KEY] : null
  if (Array.isArray(v)) return v.filter((x: any) => typeof x === "string")
  if (typeof v === "string" && v.trim()) return v.split(",").map((s) => s.trim()).filter(Boolean)
  return []
}

const inp: any = { fontFamily: WF, fontSize: "12px", padding: "4px 6px", border: "1px solid #bbb", borderRadius: "2px" }
const btn: any = { fontFamily: WF, fontSize: "12px", padding: "4px 12px", border: "1px solid #999", borderRadius: "3px", background: "#f0f0f0", cursor: "pointer" }
const td: any = { borderBottom: "1px solid #eee", padding: "5px 8px", fontSize: "12px" }
const LF = "id,title,thumbnail,metadata,*variants"

function AssocieraPage() {
  const [pid, setPid] = useState("")
  const [prod, setProd] = useState<any>(null)
  const [linked, setLinked] = useState<any[]>([])
  const [q, setQ] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [bada, setBada] = useState(true)
  const [msg, setMsg] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const el = Array.from(document.querySelectorAll("div")).find((d) => {
      const c = typeof d.className === "string" ? d.className : ""
      return c.includes("w-[220px]") && c.includes("lg:flex") && c.includes("border-e")
    }) as HTMLElement | undefined
    const prev = el ? el.style.display : ""
    if (el) el.style.display = "none"
    return () => { if (el) el.style.display = prev }
  }, [])

  const load = async (id: string) => {
    try {
      const d = await jget(`/admin/products/${id}?fields=${encodeURIComponent(LF)}`)
      if (!d.product) { setMsg("Fel: produkten hittades inte."); return }
      setProd(d.product)
      const ids = idsAv(d.product)
      if (!ids.length) { setLinked([]); return }
      const p = new URLSearchParams({ limit: "200", fields: "id,title,thumbnail,status,*variants" })
      ids.forEach((x) => p.append("id[]", x))
      const l = await jget("/admin/products?" + p.toString())
      const byId: Record<string, any> = {}
      for (const x of l.products || []) byId[x.id] = x
      setLinked(ids.map((x) => byId[x] || { id: x, title: "(borttagen produkt)", saknas: true }))
    } catch (e: any) { setMsg("Fel: kunde inte hämta produkten. " + String((e && e.message) || e)) }
  }

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id") || ""
    setPid(id)
    if (id) load(id)
  }, [])

  const sok = async () => {
    if (q.trim().length < 3) { setMsg("Fel: ange minst tre tecken för att söka."); return }
    setBusy(true); setMsg("")
    try {
      const d = await jget(`/admin/products?limit=20&q=${encodeURIComponent(q.trim())}&fields=id,title,thumbnail,*variants`)
      const r = (d.products || []).filter((x: any) => x.id !== pid)
      setResults(r)
      if (!r.length) setMsg("Inga produkter matchar sökningen.")
    } catch { setMsg("Fel: kunde inte söka produkter.") }
    setBusy(false)
  }

  /* Skriver om listan på en produkt och behåller övrig metadata. */
  const skrivLista = async (id: string, change: (ids: string[]) => string[]) => {
    const d = await jget(`/admin/products/${id}?fields=id,metadata`)
    const p = d.product
    if (!p) throw new Error("produkten hittades inte")
    const next = Array.from(new Set(change(idsAv(p))))
    await jsend(`/admin/products/${id}`, "POST", { metadata: { ...(p.metadata || {}), [KEY]: next } })
  }

  const associera = async (other: any) => {
    setBusy(true); setMsg("Sparar…")
    try {
      await skrivLista(pid, (ids) => [...ids, other.id])
      if (bada) await skrivLista(other.id, (ids) => [...ids, pid])
      setMsg(`✔ ${other.title} är nu associerad.`)
      setResults((r) => r.filter((x) => x.id !== other.id))
      await load(pid)
    } catch (e: any) { setMsg("Fel: " + String((e && e.message) || e)) }
    setBusy(false)
  }

  const taBort = async (other: any) => {
    if (!confirm(`Vill du ta bort associationen till "${other.title}"?`)) return
    setBusy(true); setMsg("Sparar…")
    try {
      await skrivLista(pid, (ids) => ids.filter((x) => x !== other.id))
      if (bada && !other.saknas) await skrivLista(other.id, (ids) => ids.filter((x) => x !== pid))
      setMsg(`✔ Associationen till ${other.title} togs bort.`)
      await load(pid)
    } catch (e: any) { setMsg("Fel: " + String((e && e.message) || e)) }
    setBusy(false)
  }

  const linkedIds = linked.map((x) => x.id)
  const sku = (p: any) => ((p.variants || [])[0] || {}).sku || ""
  const thumb = (p: any) => p.thumbnail ? <img src={p.thumbnail} style={{ width: "26px", height: "26px", objectFit: "cover", borderRadius: "3px", verticalAlign: "middle" }} /> : <span style={{ display: "inline-block", width: "26px" }} />

  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny active="Hantera produkter" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px", maxWidth: "820px" }}>
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>🔗</span>
          <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>ASSOCIERA PRODUKTER</span>
        </div>
        <p style={{ fontSize: "12px", color: "#333", lineHeight: 1.6, margin: "0 0 10px" }}>Här kan du associera produkter med varandra. Associerade produkter visas vid en produkt som kunden intresserar sig för, t.ex. batterier till en ficklampa – ett bra sätt att skapa merförsäljning.</p>
        {msg && <div style={{ padding: "7px 10px", margin: "8px 0", borderRadius: "3px", fontSize: "12px", background: msg.startsWith("Fel") ? "#fdecea" : "#e8f5e9", color: msg.startsWith("Fel") ? "#a00" : "#256029" }}>{msg}</div>}

        {!pid ? <div style={{ fontSize: "12px", color: "#a00" }}>Ingen produkt vald. Öppna Associera från produktlistan.</div> : !prod ? <div style={{ fontSize: "12px", color: "#666" }}>Hämtar…</div> : (
          <>
            <div style={{ fontWeight: 700, fontSize: "14px", margin: "6px 0 10px" }}>{thumb(prod)} {prod.title} <span style={{ color: "#999", fontWeight: 400, fontSize: "12px" }}>{sku(prod)}</span></div>

            <div style={{ border: "1px solid #ddd", borderRadius: "4px", background: "#fafafa", padding: "10px 14px", marginBottom: "14px" }}>
              <div style={{ fontWeight: 700, fontSize: "12px", marginBottom: "6px" }}>Associerade produkter ({linked.length} st)</div>
              {linked.length === 0 ? <div style={{ fontSize: "12px", color: "#888" }}>Inga associerade produkter ännu.</div> : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
                  {linked.map((p) => (
                    <tr key={p.id}>
                      <td style={{ ...td, width: "34px" }}>{thumb(p)}</td>
                      <td style={td}>{p.saknas ? <span style={{ color: "#a00" }}>{p.title}</span> : <a href={`${ADMIN}/produkt-form?id=${p.id}`} style={{ color: "#0060cc" }}>{p.title}</a>}</td>
                      <td style={{ ...td, color: "#999", width: "120px" }}>{sku(p)}</td>
                      <td style={{ ...td, width: "80px", textAlign: "right" }}><a href="#" onClick={(e) => { e.preventDefault(); if (!busy) taBort(p) }} style={{ color: "#a00" }}>Ta bort</a></td>
                    </tr>
                  ))}
                </tbody></table>
              )}
            </div>

            <div style={{ border: "1px solid #ddd", borderRadius: "4px", background: "#fafafa", padding: "10px 14px" }}>
              <div style={{ fontWeight: 700, fontSize: "12px", marginBottom: "4px" }}>Associera med:</div>
              <div style={{ fontSize: "11px", color: "#777", marginBottom: "6px" }}>Sök på produktnamn eller artikelnummer. Ange minst tre tecken.</div>
              <span style={{ fontSize: "12px" }}>SÖK: </span>
              <input style={{ ...inp, width: "260px" }} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sok() }} />
              <button style={{ ...btn, marginLeft: "6px" }} onClick={sok} disabled={busy}>Sök</button>
              <label style={{ fontSize: "12px", marginLeft: "12px" }}><input type="checkbox" checked={bada} onChange={(e) => setBada(e.target.checked)} /> Associera åt båda hållen</label>
              {results.length > 0 && (
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px", background: "#fff" }}><tbody>
                  {results.map((p) => (
                    <tr key={p.id}>
                      <td style={{ ...td, width: "34px" }}>{thumb(p)}</td>
                      <td style={td}>{p.title}</td>
                      <td style={{ ...td, color: "#999", width: "120px" }}>{sku(p)}</td>
                      <td style={{ ...td, width: "90px", textAlign: "right" }}>
                        {linkedIds.includes(p.id) ? <span style={{ color: "#888" }}>Associerad</span> : <button style={btn} disabled={busy} onClick={() => associera(p)}>Associera</button>}
                      </td>
                    </tr>
                  ))}
                </tbody></table>
              )}
            </div>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: "18px", fontSize: "12px" }}>
          <a href={`${ADMIN}/hantera-produkter`} style={{ color: "#0060cc" }}>◄ Tillbaka till produktlistan</a>
        </div>
      </div>
    </div>
  )
}

export default AssocieraPage
