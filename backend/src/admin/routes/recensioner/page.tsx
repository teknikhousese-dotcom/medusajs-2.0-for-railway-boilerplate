import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"

/**
 * Teknikhouse.se — Recensioner / Betyg (1:1 mirror of Wikinggruppen reviews.php)
 * Aggregated per-product review list (Produkt/Senaste/Antal/Olästa/Medelbetyg with stars);
 * click a product to expand its individual reviews; delete inappropriate comments; mark read.
 * Raw-SQL table product_review under /admin/reviews (single dispatch route).
 */
const ADMIN = "/app"
const WF = "Verdana, Tahoma, Arial, sans-serif"
const ReviewIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
  </svg>
)
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
  { emo: "🤝", lab: "Avtalskunder", href: `${ADMIN}/avtalskunder` },
  { emo: "🛍", lab: "Hantera produkter", href: `${ADMIN}/hantera-produkter` },
  { emo: "💡", lab: "Rekommendationer", href: `${ADMIN}/rekommendationer` },
  { emo: "🗂️", lab: "Hantera Varugrupper", href: `${ADMIN}/categories` },
  { emo: "🏷️", lab: "Rabattkoder", href: `${ADMIN}/promotions` },
  { emo: "🎁", lab: "Köp X betala för Y", href: `${ADMIN}/promotions` },
  { emo: "🚚", lab: "Fraktinställningar", href: `${ADMIN}/settings/locations` },
  { emo: "💳", lab: "Betalningsalternativ", href: `${ADMIN}/settings` },
  { emo: "📄", lab: "Redigerbara sidor", href: `${ADMIN}/redigerbara-sidor` },
  { emo: "📰", lab: "Nyheter", href: `${ADMIN}/nyheter` },
  { emo: "🔗", lab: "Länkar", href: `${ADMIN}/lankar` },
  { emo: "🔀", lab: "Import / Export", href: `${ADMIN}/products` },
  { emo: "⭐", lab: "Recensioner / Betyg", href: `${ADMIN}/recensioner` },
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

function Stars({ value }: { value: number }) {
  const full = Math.round(value || 0)
  return (
    <span style={{ color: "#e8a000", letterSpacing: "1px", fontSize: "14px" }} title={String(value)}>
      {[1, 2, 3, 4, 5].map((n) => <span key={n}>{n <= full ? "★" : "☆"}</span>)}
    </span>
  )
}

function RecensionerPage() {
  const [meta, setMeta] = useState<{ online: number | null; unread: number }>({ online: null, unread: 0 })
  const [rows, setRows] = useState<any[]>([])
  const [open, setOpen] = useState<string | null>(null)
  const [detail, setDetail] = useState<any[]>([])
  const [note, setNote] = useState("")

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
    try { const d = await jget("/admin/reviews"); setRows(d.products || []) } catch {}
  }
  useEffect(() => { load() }, [])

  const toggle = async (pid: string) => {
    if (open === pid) { setOpen(null); setDetail([]); return }
    setOpen(pid)
    const d = await jget(`/admin/reviews?product_id=${encodeURIComponent(pid)}`)
    setDetail(d.reviews || [])
    await jsend("/admin/reviews", "POST", { kind: "mark-read", product_id: pid })
    load()
  }
  const del = async (r: any) => { if (!confirm("Radera denna recension?")) return; await jsend("/admin/reviews", "POST", { kind: "delete", id: r.id }); setDetail((s) => s.filter((x) => x.id !== r.id)); setNote("Recension raderad."); load() }

  const th: any = { border: "1px solid #bbb", padding: "6px 8px", fontWeight: 700, fontSize: "11px", textAlign: "left", background: "#cccccc" }
  const td: any = { border: "1px solid #e2e2e2", padding: "5px 8px", fontSize: "12px", verticalAlign: "top" }

  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny online={meta.online} unread={meta.unread} active="Recensioner / Betyg" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px" }}>
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>⭐</span>
          <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>RECENSIONER / BETYG</span>
        </div>
        <p style={{ fontSize: "12px", color: "#333", margin: "0 auto 8px", maxWidth: "720px", textAlign: "center" }}>
          Efter att du skickat varor till en kund kan du skicka ett "Uppföljningsmail" via ordersedeln. Kunden får då ett formulär där de köpta varorna kan betygsättas med kommentarer. Som belöning kan du ge kunden en rabattkod automatiskt (nivån ställs in under Grundinställningarna).
        </p>
        <p style={{ fontSize: "12px", color: "#333", margin: "0 auto 12px", maxWidth: "720px", textAlign: "center" }}>
          Skulle någon skriva en olämplig kommentar kan du radera den härifrån.
        </p>
        {note && <div style={{ fontSize: "12px", color: "#036", marginBottom: "10px", textAlign: "center" }}>{note}</div>}
        <div style={{ fontSize: "12px", fontWeight: 700, margin: "6px 0" }}>Produkter med recensioner – klicka på en produkt för att se mer:</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>Produkt</th><th style={{ ...th, width: "110px" }}>Senaste</th><th style={{ ...th, width: "60px" }}>Antal</th><th style={{ ...th, width: "60px" }}>Olästa</th><th style={{ ...th, width: "110px" }}>Medelbetyg</th></tr></thead>
          <tbody>{rows.length === 0 ? <tr><td colSpan={5} style={{ ...td, textAlign: "center", color: "#666" }}>Inga recensioner ännu.</td></tr> :
            rows.map((r) => (
              <>
                <tr key={r.product_id} style={{ borderBottom: "1px solid #eee", cursor: "pointer" }} onClick={() => toggle(r.product_id)}>
                  <td style={{ ...td, color: "#0060cc" }}>{r.product_title || r.product_id}</td>
                  <td style={td}>{r.latest ? String(r.latest).slice(0, 10) : ""}</td>
                  <td style={td}>{r.antal}</td>
                  <td style={{ ...td, fontWeight: r.unread > 0 ? 700 : 400, color: r.unread > 0 ? "#a00" : "#000" }}>{r.unread}</td>
                  <td style={td}><Stars value={r.avg_rating} /></td>
                </tr>
                {open === r.product_id && (
                  <tr key={r.product_id + "-d"}><td colSpan={5} style={{ ...td, background: "#fafafa" }}>
                    {detail.length === 0 ? <div style={{ color: "#666" }}>Inga kommentarer.</div> :
                      detail.map((d) => (
                        <div key={d.id} style={{ borderBottom: "1px dotted #ddd", padding: "6px 0" }}>
                          <div><Stars value={d.rating} /> <b style={{ marginLeft: "6px" }}>{d.author || "Anonym"}</b> <span style={{ color: "#999" }}>· {d.created_at ? String(d.created_at).slice(0, 10) : ""}</span>
                            <a href="#" onClick={(e) => { e.preventDefault(); del(d) }} style={{ color: "#a00", marginLeft: "10px" }}>Radera</a>
                          </div>
                          <div style={{ color: "#333", marginTop: "2px" }}>{d.comment || <i style={{ color: "#999" }}>(ingen kommentar)</i>}</div>
                        </div>
                      ))}
                  </td></tr>
                )}
              </>
            ))}</tbody>
        </table>
        <div style={{ marginTop: "10px", fontSize: "12px" }}>Totalt: <b>{rows.length}</b> produkter med recensioner.</div>
        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "12px" }}>
          <a href={`${ADMIN}/kontrollpanel`} style={{ color: "#0060cc" }}>◄ Till kontrollpanelen</a>
        </div>
      </div>
    </div>
  )
}
export const config = defineRouteConfig({ label: "Recensioner / Betyg", icon: ReviewIcon })
export default RecensionerPage
