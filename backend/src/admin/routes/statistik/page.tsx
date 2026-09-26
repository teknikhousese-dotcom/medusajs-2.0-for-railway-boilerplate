import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Fragment, useEffect, useState } from "react"
import { ADMIN, WF, Shell } from "../../lib/butikadmin"

// Statistik – server-side aggregation over ALL orders via GET /admin/statistik-manad.
// Same month/year table and definitions as Wiki (statistics.php?action=months).

const StatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" /><rect x="12" y="8" width="3" height="10" /><rect x="17" y="4" width="3" height="14" />
  </svg>
)

const MONTHS = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"]
const nf = (n: number) => new Intl.NumberFormat("sv-SE").format(Math.round(Number(n || 0))).replace(/[\u00a0\u202f]/g, " ")
const kr = (n: number) => nf(n) + " kr"

type Row = { ym: string; orders: number; items: number; goods: number; value: number }
type Year = { year: string; orders: number; items: number; goods: number; value: number }
type Day = { day: string; orders: number; items: number; goods: number; value: number }

const th: any = { textAlign: "right", padding: "4px 8px", background: "#e4e4e4", borderBottom: "1px solid #bbb", fontSize: "11px", fontWeight: 700, whiteSpace: "pre-line", verticalAlign: "bottom" }
const td: any = { textAlign: "right", padding: "3px 8px", borderBottom: "1px solid #eee", fontSize: "12px", whiteSpace: "nowrap" }
const tabBtn = (active: boolean): any => ({ padding: "6px 20px", margin: "0 6px", fontSize: "12px", fontFamily: WF, cursor: "pointer",
  border: "1px solid #9bb", borderRadius: "4px", background: active ? "#cfe3f5" : "#eef5fb", color: "#036", fontWeight: active ? 700 : 400 })

function useStats() {
  const [data, setData] = useState<{ months: Row[]; years: Year[]; counted_orders?: number; excluded?: any; generated_at?: string } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const load = async (fresh = false) => {
    setErr(null)
    try {
      const r = await fetch("/admin/statistik-manad" + (fresh ? "?fresh=1" : ""), { credentials: "include" })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || String(r.status))
      setData(j)
    } catch (e: any) { setErr(e?.message || String(e)) }
  }
  useEffect(() => { load() }, [])
  return { data, err, reload: () => load(true) }
}

function DayRows({ ym }: { ym: string }) {
  const [days, setDays] = useState<Day[] | null>(null)
  useEffect(() => {
    fetch("/admin/statistik-manad?month=" + ym, { credentials: "include" }).then((r) => r.json()).then((j) => setDays(j.days || [])).catch(() => setDays([]))
  }, [ym])
  if (!days) return <tr><td colSpan={5} style={{ ...td, textAlign: "left", color: "#888" }}>Laddar dag-för-dag…</td></tr>
  return (
    <>
      {days.map((d) => (
        <tr key={d.day} style={{ background: "#f7fbff" }}>
          <td style={{ ...td, textAlign: "left", paddingLeft: "22px", color: "#555" }}>{d.day}</td>
          <td style={td}>{d.orders} st.</td>
          <td style={td}>{nf(d.items)} st.</td>
          <td style={td}>{kr(d.goods)}</td>
          <td style={td}>{kr(d.value)}</td>
        </tr>
      ))}
    </>
  )
}

function MonthTables({ data }: { data: { months: Row[]; years: Year[] } }) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div>
      {data.years.map((y) => {
        const rows = data.months.filter((m) => m.ym.startsWith(y.year + "-"))
        return (
          <table key={y.year} style={{ width: "100%", maxWidth: "760px", margin: "0 auto 18px", borderCollapse: "collapse", fontFamily: WF }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: "left", fontSize: "13px" }}>{y.year}</th>
                <th style={th}>{"Antal\nordrar"}</th>
                <th style={th}>{"Beställda\nvaror"}</th>
                <th style={th}>Varuvärde</th>
                <th style={th}>Ordervärde</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const mi = Number(m.ym.slice(5, 7)) - 1
                return (
                  <Fragment key={m.ym}>
                    <tr style={{ cursor: "pointer" }} onClick={() => setOpen(open === m.ym ? null : m.ym)} title="Klicka för dag-för-dag">
                      <td style={{ ...td, textAlign: "left", color: "#036", textDecoration: "underline" }}>{MONTHS[mi] || m.ym}</td>
                      <td style={td}>{m.orders} st.</td>
                      <td style={td}>{nf(m.items)} st.</td>
                      <td style={td}>{kr(m.goods)}</td>
                      <td style={td}>{kr(m.value)}</td>
                    </tr>
                    {open === m.ym && <DayRows ym={m.ym} />}
                  </Fragment>
                )
              })}
              <tr>
                <td style={{ ...td, textAlign: "left", fontWeight: 700, borderTop: "1px solid #999" }}>Summa {y.year}</td>
                <td style={{ ...td, fontWeight: 700, borderTop: "1px solid #999" }}>{y.orders} st</td>
                <td style={{ ...td, fontWeight: 700, borderTop: "1px solid #999" }}>{nf(y.items)} st</td>
                <td style={{ ...td, fontWeight: 700, borderTop: "1px solid #999" }}>{kr(y.goods)}</td>
                <td style={{ ...td, fontWeight: 700, borderTop: "1px solid #999" }}>{kr(y.value)}</td>
              </tr>
            </tbody>
          </table>
        )
      })}
    </div>
  )
}

function Card({ title, children }: { title: string; children: any }) {
  return (
    <div style={{ border: "1px solid #cfcfcf", borderRadius: "3px", background: "#fff", overflow: "hidden", flex: "1 1 220px" }}>
      <div style={{ background: "#dcdcdc", padding: "4px 8px", borderBottom: "1px solid #cfcfcf", fontWeight: 700, fontSize: "12px", textAlign: "center" }}>{title}</div>
      <div style={{ padding: "10px 12px", fontSize: "12px", lineHeight: 1.7 }}>{children}</div>
    </div>
  )
}

function Dashboard({ data }: { data: { months: Row[]; years: Year[] } }) {
  const now = new Date()
  const ym = (d: Date) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0")
  const cur = ym(now)
  const prev = ym(new Date(now.getFullYear(), now.getMonth() - 1, 1))
  const lastYearSame = ym(new Date(now.getFullYear() - 1, now.getMonth(), 1))
  const get = (k: string) => data.months.find((m) => m.ym === k) || { ym: k, orders: 0, items: 0, goods: 0, value: 0 }
  const ytd = (y: number) => data.months.filter((m) => m.ym.startsWith(String(y) + "-") && Number(m.ym.slice(5, 7)) <= now.getMonth() + 1)
    .reduce((a, m) => ({ orders: a.orders + m.orders, value: a.value + m.value, goods: a.goods + m.goods }), { orders: 0, value: 0, goods: 0 })
  const a = ytd(now.getFullYear()), b = ytd(now.getFullYear() - 1)
  const total = data.years.reduce((s, y) => ({ orders: s.orders + y.orders, value: s.value + y.value }), { orders: 0, value: 0 })
  const line = (label: string, r: any) => <div><b>{label}:</b> {r.orders} ordrar · {kr(r.value)}</div>
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", maxWidth: "900px", margin: "0 auto" }}>
      <Card title="Denna månad">{line(MONTHS[now.getMonth()], get(cur))}{line("Samma månad i fjol", get(lastYearSame))}</Card>
      <Card title="Förra månaden">{line(MONTHS[(now.getMonth() + 11) % 12], get(prev))}</Card>
      <Card title="Hittills i år">{line(String(now.getFullYear()), a)}{line(String(now.getFullYear() - 1) + " (samma period)", b)}</Card>
      <Card title="Totalt">{line("Alla år", total)}</Card>
    </div>
  )
}

function StatistikPage() {
  const [tab, setTab] = useState("tabell")
  const { data, err, reload } = useStats()
  return (
    <Shell active="Statistik">
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <span style={{ fontSize: "24px", verticalAlign: "middle", marginRight: "8px" }}>📊</span>
        <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>STATISTIK / INVENTERING</span>
      </div>
      <div style={{ textAlign: "center", marginBottom: "12px" }}>
        <button style={tabBtn(tab === "dashboard")} onClick={() => setTab("dashboard")}>Dashboard</button>
        <button style={tabBtn(tab === "tabell")} onClick={() => setTab("tabell")}>Försäljningstabell</button>
        <button style={tabBtn(false)} onClick={() => { window.location.href = ADMIN + "/inventering" }}>Lagerbevakning</button>
      </div>
      {err && <div style={{ color: "#c00", fontSize: "12px", textAlign: "center", margin: "10px" }}>Kunde inte hämta statistik: {err}</div>}
      {!data && !err && <div style={{ color: "#666", fontSize: "12px", textAlign: "center", margin: "20px" }}>Laddar statistik…</div>}
      {data && tab === "dashboard" && <Dashboard data={data} />}
      {data && tab === "tabell" && (
        <>
          <div style={{ fontSize: "12px", color: "#333", maxWidth: "760px", margin: "0 auto 14px", lineHeight: 1.5 }}>
            "Varuvärde" är värdet av varorna. Frakt, expeditionsavgifter och rabatter är inte inräknade. "Ordervärde" är det som kunden betalade för hela ordern.
            Klicka på en månad för att se statistik dag-för-dag.
            <div style={{ color: "#888", fontSize: "11px", marginTop: "4px" }}>
              Makulerade och ej slutförda köp räknas inte. Belopp inkl. moms. Datum enligt svensk tid.
              {data.excluded ? ` Ej medräknade: ${data.excluded.makulerade || 0} makulerade, ${data.excluded.ej_slutforda || 0} ej slutförda.` : ""}
              {" "}<a href="#" onClick={(e) => { e.preventDefault(); reload() }} style={{ color: "#036" }}>Uppdatera</a>
            </div>
          </div>
          <MonthTables data={data} />
        </>
      )}
    </Shell>
  )
}

export const config = defineRouteConfig({ label: "Statistik", icon: StatIcon })
export default StatistikPage
