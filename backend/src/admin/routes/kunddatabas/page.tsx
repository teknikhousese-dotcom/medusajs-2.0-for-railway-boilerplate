import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

/**
 * Teknikhouse.se — Kunddatabas (1:1 mirror of Wikinggruppen customers.php)
 * Header KUNDDATABAS, "Gör ett urval / Segmentering" toggle with the full Wiki
 * filter set (Namn, E-post, Telefon, Postnummer, Ort, Land, Produkt, Artikelnr),
 * "Antal resultat: N st", table Namn | E-postadress | Telefonnummer | Ort |
 * Antal ordrar. Reads REAL Medusa customers; the structured filter calls the
 * custom /admin/wiki-customer-search endpoint, free listing uses /admin/customers.
 */

const PAGE = 50
const COUNTRIES: [string, string][] = [["", "Välj…"], ["dk", "Danmark"], ["fi", "Finland"], ["no", "Norge"], ["gb", "Storbritannien"], ["se", "Sverige"], ["de", "Tyskland"]]

const BookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><path d="M9 7h6M9 11h6" />
  </svg>
)

const nf = (n: number) => new Intl.NumberFormat("sv-SE").format(Math.round(Number(n || 0)))
async function jget(url: string) { return fetch(url, { credentials: "include" }).then((r) => r.json()) }

type Cust = { id: string; name: string; email: string; phone: string; city: string; orders: number }
const emptyFilters = { name: "", email: "", phone: "", zip: "", city: "", country: "", product: "", artNo: "" }

function KunddatabasPage() {
  const [meta, setMeta] = useState<{ online: number | null; unread: number }>({ online: null, unread: 0 })
  const [rows, setRows] = useState<Cust[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [f, setF] = useState<any>({ ...emptyFilters })
  const [applied, setApplied] = useState<any>({ ...emptyFilters })
  const [seg, setSeg] = useState(false)
  const [loading, setLoading] = useState(true)
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }))
  const hasFilter = (o: any) => Object.values(o).some((v) => String(v || "").trim() !== "")

  useEffect(() => {
    const el = Array.from(document.querySelectorAll("div")).find((d) => {
      const c = typeof d.className === "string" ? d.className : ""
      return c.includes("w-[220px]") && c.includes("lg:flex") && c.includes("border-e")
    }) as HTMLElement | undefined
    const prev = el ? el.style.display : ""
    if (el) el.style.display = "none"
    return () => { if (el) el.style.display = prev }
  }, [])

  useEffect(() => { (async () => { try { const o = await jget("/admin/orders?limit=1"); setMeta((s) => ({ ...s, unread: o.count || 0 })) } catch {} })() }, [])

  useEffect(() => { (async () => {
    setLoading(true)
    const offset = page * PAGE
    let data: any = {}
    try {
      if (hasFilter(applied)) {
        const qs = Object.entries(applied).filter(([, v]) => String(v || "").trim() !== "")
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&")
        data = await jget(`/admin/wiki-customer-search?limit=${PAGE}&offset=${offset}&${qs}`)
      } else {
        data = await jget(`/admin/customers?limit=${PAGE}&offset=${offset}&fields=id,first_name,last_name,email,phone,*addresses,orders.id`)
      }
    } catch { data = {} }
    const cs: any[] = data.customers || []
    setTotal(data.count || 0)
    setRows(cs.map((c) => {
      if (c.name !== undefined) return c as Cust
      const addr = (c.addresses && c.addresses[0]) || {}
      const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || (c.email || "").split("@")[0]
      return { id: c.id, name, email: c.email || "", phone: c.phone || addr.phone || "", city: addr.city || "", orders: Array.isArray(c.orders) ? c.orders.length : 0 }
    }))
    setLoading(false)
  })() }, [page, applied])

  const runSearch = () => { setPage(0); setApplied({ ...f }) }
  const clearSearch = () => { setF({ ...emptyFilters }); setApplied({ ...emptyFilters }); setPage(0) }

  const pages = Math.max(1, Math.ceil(total / PAGE))
  const th: any = { border: "1px solid #bbb", padding: "6px 8px", fontWeight: 700, fontSize: "11px", textAlign: "left", background: "#cccccc" }
  const td: any = { border: "1px solid #e2e2e2", padding: "5px 8px", fontSize: "12px" }
  const inp: any = { fontFamily: WF, fontSize: "12px", padding: "4px 6px", border: "1px solid #bbb", borderRadius: "2px", boxSizing: "border-box", width: "100%" }
  const lbl: any = { fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "2px" }
  const btn: any = { fontFamily: WF, fontSize: "12px", padding: "5px 14px", border: "1px solid #999", borderRadius: "3px", background: "#f0f0f0", cursor: "pointer" }
  const field = (k: string, label: string) => (
    <div><label style={lbl}>{label}</label><input style={inp} value={f[k]} onChange={(e) => set(k, e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runSearch() }} /></div>
  )

  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny online={meta.online} unread={meta.unread} active="Kunddatabas" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px" }}>
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>📇</span>
          <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>KUNDDATABAS</span>
        </div>
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <a href="#" onClick={(e) => { e.preventDefault(); setSeg(!seg) }} style={{ color: "#0060cc", fontSize: "12px" }}>Gör ett urval / Segmentering</a>
        </div>
        {seg && (
          <div style={{ border: "1px solid #ddd", borderRadius: "5px", background: "#fafafa", padding: "12px 14px", marginBottom: "14px", maxWidth: "720px", marginLeft: "auto", marginRight: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 14px" }}>
              {field("name", "Namn")}
              {field("email", "E-postadress")}
              {field("phone", "Telefonnummer")}
              {field("zip", "Postnummer")}
              {field("city", "Ort")}
              <div><label style={lbl}>Land</label>
                <select style={inp} value={f.country} onChange={(e) => set("country", e.target.value)}>
                  {COUNTRIES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                </select>
              </div>
              {field("product", "Har köpt produkt")}
              {field("artNo", "Artikelnummer")}
            </div>
            <div style={{ marginTop: "10px", textAlign: "right" }}>
              {hasFilter(applied) && <button style={{ ...btn, marginRight: "6px" }} onClick={clearSearch}>Rensa</button>}
              <button style={{ ...btn, background: "#2e7d32", color: "#fff", border: "1px solid #2e7d32" }} onClick={runSearch}>SÖK</button>
            </div>
          </div>
        )}
        <div style={{ textAlign: "center", fontSize: "12px", color: "#333", marginBottom: "14px" }}>
          Antal resultat: <b>{nf(total)}</b> st
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>Namn</th><th style={th}>E-postadress</th><th style={th}>Telefonnummer</th><th style={th}>Ort</th><th style={{ ...th, textAlign: "right" }}>Antal ordrar</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} style={{ ...td, textAlign: "center", color: "#666" }}>Laddar…</td></tr> :
              rows.length === 0 ? <tr><td colSpan={5} style={{ ...td, textAlign: "center", color: "#666" }}>Inga kunder matchar.</td></tr> :
              rows.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #e2e2e2" }}>
                  <td style={td}><a href={`${ADMIN}/customers/${c.id}`} style={{ color: "#0060cc", textDecoration: "underline" }}>{c.name}</a></td>
                  <td style={td}>{c.email}</td>
                  <td style={td}>{c.phone || ""}</td>
                  <td style={td}>{c.city || ""}</td>
                  <td style={{ ...td, textAlign: "right" }}>{c.orders > 0 ? <a href={`${ADMIN}/customers/${c.id}`} style={{ color: "#0060cc" }}>{c.orders}</a> : 0}</td>
                </tr>
              ))}
          </tbody>
        </table>

        <div style={{ textAlign: "center", marginTop: "14px", fontSize: "12px" }}>
          <button style={btn} disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>« Föregående</button>
          <span style={{ margin: "0 12px" }}>Sida {page + 1} / {nf(pages)}</span>
          <button style={btn} disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Nästa »</button>
        </div>
        <div style={{ textAlign: "center", marginTop: "18px", fontSize: "12px" }}>
          <a href={`${ADMIN}/kontrollpanel`} style={{ color: "#0060cc" }}>◄ Till kontrollpanelen</a>
        </div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Kunddatabas", icon: BookIcon })
export default KunddatabasPage
