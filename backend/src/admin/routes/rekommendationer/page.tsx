import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

/**
 * Teknikhouse.se — Rekommendationer (1:1 mirror of Wikinggruppen recommendations.php)
 * Recommendation-slot manager: day-window config + placement zones, each holding slots
 * (Bästsäljare, Mest visade, Nya produkter, Hyllvärmare, Slumpade, Andra köpte även) with a
 * scope. Raw-SQL tables recommendation_slot / recommendation_config under /admin/recommendations.
 */
const RecIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
  </svg>
)
async function jget(u: string) { return fetch(u, { credentials: "include" }).then((r) => r.json()) }
async function jsend(u: string, m: string, b?: any) { return fetch(u, { method: m, credentials: "include", headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined }).then((r) => r.json()) }

const PLACEMENTS: { code: string; label: string }[] = [
  { code: "start", label: "Startsidan - Övre delen" },
  { code: "start_bottom", label: "Startsidan - Nedre delen" },
  { code: "product", label: "Produktsidorna" },
  { code: "category", label: "Varugruppssidorna" },
  { code: "left", label: "Vänsterspalt" },
  { code: "checkout_top", label: "Kassan - Övre" },
  { code: "checkout_bottom", label: "Kassan - Nedre" },
  { code: "empty_cart", label: "Tom varukorg" },
  { code: "notfound", label: "404-sidan" },
]
const SLOT_TYPES: { code: string; label: string }[] = [
  { code: "bestsellers", label: "Bästsäljare" },
  { code: "most_viewed", label: "Mest visade produkter" },
  { code: "new_products", label: "Nya produkter" },
  { code: "shelf_warmers", label: "Hyllvärmare" },
  { code: "random", label: "Slumpade produkter" },
  { code: "also_bought", label: "Andra köpte även (baserat på köp)" },
]
const SCOPES: { code: string; label: string }[] = [
  { code: "global", label: "Alla produkter (globalt)" },
  { code: "current_category", label: "Aktuell varugrupp" },
  { code: "subcategories", label: "Undergrupper" },
  { code: "current_plus_sub", label: "Aktuell varugrupp + undergrupper" },
]
const typeLabel = (c: string) => (SLOT_TYPES.find((t) => t.code === c) || { label: c }).label
const scopeLabel = (c: string) => (SCOPES.find((t) => t.code === c) || { label: c }).label

function RekommendationerPage() {
  const [meta, setMeta] = useState<{ online: number | null; unread: number }>({ online: null, unread: 0 })
  const [config, setConfig] = useState<any>({ viewed_days: 90, ordered_days: 90, not_selling_days: 90, statistics_days: 90 })
  const [slots, setSlots] = useState<any[]>([])
  const [note, setNote] = useState("")
  const [addFor, setAddFor] = useState<string | null>(null)
  const [nf, setNf] = useState({ title: "", slot_type: "bestsellers", scope: "global" })

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
    try { const d = await jget("/admin/recommendations"); if (d.config) setConfig(d.config); setSlots(d.slots || []) } catch {}
  }
  useEffect(() => { load() }, [])

  const saveConfig = async () => {
    const r = await jsend("/admin/recommendations", "POST", { kind: "config", ...config })
    if (r.config) { setConfig(r.config); setNote("Inställningarna sparade.") }
  }
  const addSlot = async (placement: string) => {
    if (!nf.title.trim()) { setNote("Ange ett namn på ytan."); return }
    const r = await jsend("/admin/recommendations", "POST", { placement, title: nf.title, slot_type: nf.slot_type, scope: nf.scope })
    if (r.slot) { setNf({ title: "", slot_type: "bestsellers", scope: "global" }); setAddFor(null); setNote("Yta tillagd."); load() }
  }
  const toggleSlot = async (s: any) => { await jsend(`/admin/recommendations/${s.id}`, "POST", { active: !s.active }); load() }
  const delSlot = async (s: any) => { if (!confirm(`Ta bort ytan "${s.title}"?`)) return; await jsend(`/admin/recommendations/${s.id}`, "DELETE"); load() }
  const setSlotType = async (s: any, v: string) => { await jsend(`/admin/recommendations/${s.id}`, "POST", { slot_type: v }); load() }
  const setSlotScope = async (s: any, v: string) => { await jsend(`/admin/recommendations/${s.id}`, "POST", { scope: v }); load() }

  const inp: any = { fontFamily: WF, fontSize: "12px", padding: "3px 5px", border: "1px solid #bbb", borderRadius: "2px" }
  const btn: any = { fontFamily: WF, fontSize: "12px", padding: "4px 12px", border: "1px solid #999", borderRadius: "3px", background: "#f0f0f0", cursor: "pointer" }
  const P: any = { fontSize: "12px", color: "#333", lineHeight: 1.6, margin: "0 0 8px" }
  const cfgCell: any = { fontSize: "12px", padding: "4px 8px" }

  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny online={meta.online} unread={meta.unread} active="Rekommendationer" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px" }}>
        <div style={{ textAlign: "center", marginBottom: "14px" }}>
          <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>💡</span>
          <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>REKOMMENDATIONER</span>
        </div>
        <p style={{ ...P, maxWidth: "720px" }}>Här kan du styra vilka produkter som ska rekommenderas till kunderna. Detta kan baseras på försäljningsstatistik, besökarstatistik, beteenden hos tidigare kunder med mera.</p>
        {note && <div style={{ fontSize: "12px", color: "#036", margin: "8px 0" }}>{note}</div>}

        {/* CONFIG */}
        <div style={{ border: "1px solid #ddd", borderRadius: "4px", background: "#fafafa", padding: "10px 14px", margin: "10px 0 18px", maxWidth: "720px" }}>
          <div style={{ fontWeight: 700, fontSize: "12px", marginBottom: "6px" }}>Inställningar för tidsfönster (antal dagar)</div>
          <table style={{ borderCollapse: "collapse" }}><tbody>
            <tr>
              <td style={cfgCell}>Mest visade — senaste</td><td style={cfgCell}><input style={{ ...inp, width: "60px" }} type="number" value={config.viewed_days} onChange={(e) => setConfig({ ...config, viewed_days: e.target.value })} /> dagar</td>
              <td style={cfgCell}>Bästsäljare — senaste</td><td style={cfgCell}><input style={{ ...inp, width: "60px" }} type="number" value={config.ordered_days} onChange={(e) => setConfig({ ...config, ordered_days: e.target.value })} /> dagar</td>
            </tr>
            <tr>
              <td style={cfgCell}>Hyllvärmare — ej sålt på</td><td style={cfgCell}><input style={{ ...inp, width: "60px" }} type="number" value={config.not_selling_days} onChange={(e) => setConfig({ ...config, not_selling_days: e.target.value })} /> dagar</td>
              <td style={cfgCell}>Statistikfönster</td><td style={cfgCell}><input style={{ ...inp, width: "60px" }} type="number" value={config.statistics_days} onChange={(e) => setConfig({ ...config, statistics_days: e.target.value })} /> dagar</td>
            </tr>
          </tbody></table>
          <div style={{ marginTop: "8px" }}><button style={btn} onClick={saveConfig}>Spara</button></div>
        </div>

        {/* PLACEMENTS */}
        {PLACEMENTS.map((pl) => {
          const rows = slots.filter((s) => s.placement === pl.code)
          return (
            <div key={pl.code} style={{ marginBottom: "16px" }}>
              <div style={{ fontWeight: 700, fontSize: "13px", background: "#e2e2e2", padding: "5px 10px", borderRadius: "3px" }}>{pl.label}</div>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "4px" }}>
                <tbody>
                  {rows.length === 0 ? <tr><td style={{ fontSize: "12px", color: "#888", padding: "6px 10px" }}>Inga ytor här ännu.</td></tr> :
                    rows.map((s) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ fontSize: "12px", padding: "5px 10px", width: "260px" }}>{s.title}{!s.active && <span style={{ color: "#a00" }}> (inaktiv)</span>}</td>
                        <td style={{ padding: "5px 6px" }}>
                          <select style={{ ...inp }} value={s.slot_type} onChange={(e) => setSlotType(s, e.target.value)}>{SLOT_TYPES.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}</select>
                        </td>
                        <td style={{ padding: "5px 6px" }}>
                          <select style={{ ...inp }} value={s.scope} onChange={(e) => setSlotScope(s, e.target.value)}>{SCOPES.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}</select>
                        </td>
                        <td style={{ fontSize: "12px", padding: "5px 10px", whiteSpace: "nowrap" }}>
                          <a href="#" onClick={(e) => { e.preventDefault(); toggleSlot(s) }} style={{ color: "#0060cc" }}>{s.active ? "Inaktivera" : "Aktivera"}</a>
                          <span style={{ color: "#bbb" }}> | </span>
                          <a href="#" onClick={(e) => { e.preventDefault(); delSlot(s) }} style={{ color: "#a00" }}>Ta bort</a>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {addFor === pl.code ? (
                <div style={{ background: "#f7f7f7", border: "1px solid #ddd", borderRadius: "3px", padding: "8px 10px", marginTop: "4px", display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                  <input style={{ ...inp, width: "200px" }} placeholder="Namn på ytan" value={nf.title} onChange={(e) => setNf({ ...nf, title: e.target.value })} />
                  <select style={inp} value={nf.slot_type} onChange={(e) => setNf({ ...nf, slot_type: e.target.value })}>{SLOT_TYPES.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}</select>
                  <select style={inp} value={nf.scope} onChange={(e) => setNf({ ...nf, scope: e.target.value })}>{SCOPES.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}</select>
                  <button style={btn} onClick={() => addSlot(pl.code)}>Spara yta</button>
                  <button style={{ ...btn, background: "#fff" }} onClick={() => { setAddFor(null); setNf({ title: "", slot_type: "bestsellers", scope: "global" }) }}>Avbryt</button>
                </div>
              ) : (
                <div style={{ marginTop: "4px" }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setAddFor(pl.code); setNote("") }} style={{ fontSize: "12px", color: "#0060cc" }}>+ Lägg till ny yta</a>
                </div>
              )}
            </div>
          )
        })}

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "12px" }}>
          <a href={`${ADMIN}/kontrollpanel`} style={{ color: "#0060cc" }}>◄ Till kontrollpanelen</a>
        </div>
      </div>
    </div>
  )
}
export const config = defineRouteConfig({ label: "Rekommendationer", icon: RecIcon })
export default RekommendationerPage
