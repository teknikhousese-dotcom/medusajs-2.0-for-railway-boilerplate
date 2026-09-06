import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useMemo, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

/**
 * Teknikhouse.se — Kunddatabas (1:1 mirror of Wikinggruppen customers.php)
 * Header KUNDDATABAS, "Gör ett urval / Segmentering" toggle, "Antal resultat: N st",
 * table Namn | E-postadress | Telefonnummer | Ort | Antal ordrar. Reads REAL Medusa
 * customers. Names link to the native Medusa customer page. Native nav hidden; Wiki
 * Snabbmeny on the left.
 */

const PAGE = 50

const BookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><path d="M9 7h6M9 11h6" />
  </svg>
)

const nf = (n: number) => new Intl.NumberFormat("sv-SE").format(Math.round(Number(n || 0)))



async function jget(url: string) { return fetch(url, { credentials: "include" }).then((r) => r.json()) }

type Cust = { id: string; name: string; email: string; phone: string; city: string; orders: number }

function KunddatabasPage() {
  const [meta, setMeta] = useState<{ online: number | null; unread: number }>({ online: null, unread: 0 })
  const [rows, setRows] = useState<Cust[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [q, setQ] = useState("")
  const [qActive, setQActive] = useState("")
  const [seg, setSeg] = useState(false)
  const [loading, setLoading] = useState(true)

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
    const qs = qActive.trim() ? `&q=${encodeURIComponent(qActive.trim())}` : ""
    let data: any = {}
    try {
      data = await jget(`/admin/customers?limit=${PAGE}&offset=${offset}${qs}&fields=id,first_name,last_name,email,phone,*addresses,orders.id`)
    } catch { data = {} }
    const cs: any[] = data.customers || []
    setTotal(data.count || 0)
    setRows(cs.map((c) => {
      const addr = (c.addresses && c.addresses[0]) || {}
      const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || (c.email || "").split("@")[0]
      return { id: c.id, name, email: c.email || "", phone: c.phone || addr.phone || "", city: addr.city || "", orders: Array.isArray(c.orders) ? c.orders.length : 0 }
    }))
    setLoading(false)
  })() }, [page, qActive])

  const pages = Math.max(1, Math.ceil(total / PAGE))
  const th: any = { border: "1px solid #bbb", padding: "6px 8px", fontWeight: 700, fontSize: "11px", textAlign: "left", background: "#cccccc" }
  const td: any = { border: "1px solid #e2e2e2", padding: "5px 8px", fontSize: "12px" }
  const inp: any = { fontFamily: WF, fontSize: "12px", padding: "3px 6px", border: "1px solid #bbb", borderRadius: "2px" }
  const btn: any = { fontFamily: WF, fontSize: "12px", padding: "4px 12px", border: "1px solid #999", borderRadius: "3px", background: "#f0f0f0", cursor: "pointer" }

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
          <div style={{ textAlign: "center", marginBottom: "12px" }}>
            <input style={{ ...inp, width: "260px" }} placeholder="Sök namn, e-post, telefon…" value={q}
              onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { setPage(0); setQActive(q) } }} />
            <button style={{ ...btn, marginLeft: "6px" }} onClick={() => { setPage(0); setQActive(q) }}>SÖK</button>
            {qActive && <button style={{ ...btn, marginLeft: "6px" }} onClick={() => { setQ(""); setQActive(""); setPage(0) }}>Rensa</button>}
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
