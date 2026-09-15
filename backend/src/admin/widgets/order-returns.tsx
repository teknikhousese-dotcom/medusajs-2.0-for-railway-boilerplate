import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"

/**
 * Teknikhouse.se — shows customer-reported returns/reklamationer on the native
 * order detail page, mirroring the old butikadmin order_page.php:
 * an "OBS: N registrerad retur/reklamation" banner + a Returer & Reklamationer table.
 */
const OrderReturnsWidget = ({ data }: { data: any }) => {
  const [rows, setRows] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!data?.id) return
    fetch("/admin/returns?order_id=" + encodeURIComponent(data.id), { credentials: "include" })
      .then((r) => r.json())
      .then((j) => { setRows(Array.isArray(j.returns) ? j.returns : []); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [data?.id])

  if (!loaded || rows.length === 0) return null

  const th: any = { textAlign: "left", borderBottom: "1px solid #e3e3e3", padding: "6px 8px", color: "#6b7280", fontWeight: 600, fontSize: "11px" }
  const td: any = { padding: "6px 8px", borderBottom: "1px solid #f1f1f1", fontSize: "12px", verticalAlign: "top" }

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", marginTop: "12px" }}>
      <div style={{ background: "#fff7ed", color: "#9a3412", borderBottom: "1px solid #fed7aa", padding: "10px 16px", fontWeight: 600, fontSize: "13px" }}>
        OBS: Det finns {rows.length} registrerad retur/reklamation på denna order.
      </div>
      <div style={{ padding: "12px 16px" }}>
        <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "8px" }}>Returer &amp; Reklamationer</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Referens", "Datum", "Artikel", "Typ", "Antal"].map((h) => (<th key={h} style={th}>{h}</th>))}</tr>
          </thead>
          <tbody>
            {rows.flatMap((r: any) => {
              const its = Array.isArray(r.items) && r.items.length ? r.items : [{ title: "—", quantity: 1, reason: r.message }]
              return its.map((it: any, i: number) => (
                <tr key={r.id + "-" + i}>
                  <td style={td}>{i === 0 ? r.reference : ""}</td>
                  <td style={td}>{i === 0 ? new Date(r.created_at).toLocaleString("sv-SE") : ""}</td>
                  <td style={td}>{it.title}{it.reason ? <div style={{ color: "#9ca3af", marginTop: "2px" }}>{it.reason}</div> : null}</td>
                  <td style={td}>{r.type === "reklamation" ? "Reklamation" : "Retur"}</td>
                  <td style={td}>{it.quantity || 1}</td>
                </tr>
              ))
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const config = defineWidgetConfig({ zone: "order.details.after" })
export default OrderReturnsWidget
