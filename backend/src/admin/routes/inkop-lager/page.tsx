import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useMemo, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

// Teknikhouse.se — Inköp / Lager (1:1 mirror of Wikinggruppen supplier_orders.php)
// Tabs: Ny beställning | Beställningar | Lager/Inventering | Leverantörer | Hjälp/info
// Backed by the custom "purchasing" tables (suppliers + purchase orders) and REAL
// Medusa inventory. Products are linked to suppliers via metadata.leverantor (supplier
// name, as on Wiki) or metadata.supplier_id. Native Medusa nav hidden; Wiki Snabbmeny on the left.


const BookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

// ---- shared helpers ----
async function jget(url: string) { return fetch(url, { credentials: "include" }).then((r) => r.json()) }
async function jsend(url: string, method: string, body?: any) {
  return fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }).then((r) => r.json())
}
const norm = (s: any) => String(s == null ? "" : s).trim().toLowerCase()
const fmtDate = (v: any) => (v ? new Date(v).toLocaleDateString("sv-SE") : "")
const fmtDateTime = (v: any) => (v ? new Date(v).toLocaleString("sv-SE") : "")

type Supplier = { id: string; name: string; email?: string | null; ref_first_name?: string | null; ref_last_name?: string | null; wiki_id?: number | null; product_count?: number }
type Prod = { id: string; title: string; sku: string | null; supplier_id: string | null; supplier_name: string; qty: number; min_stock: number; inventory_item_id: string | null; variant_id: string | null; category: string }

// pull products with variants + inventory + metadata, flattened to one row per variant
async function loadProducts(onProgress?: (n: number, total: number) => void): Promise<Prod[]> {
  const out: Prod[] = []
  const limit = 200
  let offset = 0
  let total = Infinity
  for (let i = 0; i < 100 && offset < total; i++) {
    const url = `/admin/products?limit=${limit}&offset=${offset}&fields=id,title,metadata,*categories,*variants,variants.sku,variants.inventory_quantity,variants.inventory_items.inventory_item_id`
    let data: any = null
    for (let attempt = 0; attempt < 3 && !data; attempt++) {
      try { const r = await fetch(url, { credentials: "include" }); if (r.ok) data = await r.json() } catch {}
    }
    if (!data) { offset += limit; continue }
    if (typeof data.count === "number") total = data.count
    const ps: any[] = data.products || []
    for (const p of ps) {
      const m = p.metadata || {}
      const cat = (p.categories && p.categories[0] && p.categories[0].name) || ""
      const supId = m.supplier_id || m.leverantor_id || null
      const supName = String(m.leverantor || "").trim()
      const minS = Number(m.min_stock || m.min_lager || 0)
      const vs: any[] = p.variants || []
      if (!vs.length) { out.push({ id: p.id, title: p.title, sku: null, supplier_id: supId, supplier_name: supName, qty: 0, min_stock: minS, inventory_item_id: null, variant_id: null, category: cat }); continue }
      for (const v of vs) {
        const invItem = (v.inventory_items && v.inventory_items[0] && v.inventory_items[0].inventory_item_id) || null
        out.push({ id: p.id, title: vs.length > 1 ? `${p.title} — ${v.title || v.sku || ""}` : p.title, sku: v.sku || null, supplier_id: supId, supplier_name: supName, qty: Number(v.inventory_quantity || 0), min_stock: minS, inventory_item_id: invItem, variant_id: v.id, category: cat })
      }
    }
    if (onProgress) onProgress(offset + ps.length, total === Infinity ? 0 : total)
    if (!ps.length && total === Infinity) break
    offset += limit
  }
  return out
}

const H2 = ({ children }: { children: any }) => <div style={{ textAlign: "center", fontWeight: 700, fontSize: "13px", margin: "18px 0 12px" }}>{children}</div>
const btn: any = { fontFamily: WF, fontSize: "12px", padding: "4px 12px", border: "1px solid #999", borderRadius: "3px", background: "#f0f0f0", cursor: "pointer" }
const inp: any = { fontFamily: WF, fontSize: "12px", padding: "3px 5px", border: "1px solid #bbb", borderRadius: "2px" }
const lbl: any = { fontFamily: WF, fontSize: "12px", color: "#333", textAlign: "right", paddingRight: "8px", whiteSpace: "nowrap" }
const lnk: any = { color: "#0060cc", textDecoration: "underline", cursor: "pointer" }

// ========================= Ny beställning =========================
function NyBestallning({ suppliers, products, loadingProducts, reload, openOrders }: { suppliers: Supplier[]; products: Prod[]; loadingProducts: boolean; reload: () => void; openOrders: () => void }) {
  const [sel, setSel] = useState("")
  const [lines, setLines] = useState<Record<string, { qty: number; min: number }>>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  const withProducts = useMemo(() => {
    const ids = new Set(products.map((p) => p.supplier_id).filter(Boolean) as string[])
    return suppliers.filter((s) => ids.has(s.id) || (s.product_count || 0) > 0)
  }, [products, suppliers])
  const supProducts = useMemo(() => products.filter((p) => p.supplier_id === sel), [products, sel])
  const warnings = useMemo(() => {
    const bySup: Record<string, number> = {}
    for (const p of products) if (p.min_stock > 0 && p.qty < p.min_stock && p.supplier_id) bySup[p.supplier_id] = (bySup[p.supplier_id] || 0) + 1
    return suppliers.filter((s) => bySup[s.id]).map((s) => ({ s, n: bySup[s.id] }))
  }, [products, suppliers])

  useEffect(() => {
    const init: Record<string, { qty: number; min: number }> = {}
    for (const p of supProducts) { const suggest = Math.max(0, (p.min_stock || 0) - (p.qty || 0)); init[p.variant_id || p.id] = { qty: suggest, min: p.min_stock || 0 } }
    setLines(init)
  }, [sel, supProducts.length])

  const create = async () => {
    setSaving(true); setMsg("")
    const payloadLines = supProducts.map((p) => {
      const l = lines[p.variant_id || p.id] || { qty: 0, min: 0 }
      return { title: p.title, sku: p.sku, variant_id: p.variant_id, product_id: p.id, inventory_item_id: p.inventory_item_id, qty_ordered: l.qty, min_stock: l.min }
    }).filter((l) => l.qty_ordered > 0)
    if (!payloadLines.length) { setMsg("Ange minst en artikel med antal > 0."); setSaving(false); return }
    const sup = suppliers.find((s) => s.id === sel)
    const r = await jsend("/admin/purchasing/orders", "POST", { supplier_id: sel, supplier_name: sup?.name, lines: payloadLines })
    setSaving(false)
    if (r && r.order) { setMsg(`Beställning skapad (${payloadLines.length} artiklar).`); setSel(""); reload(); openOrders() }
    else setMsg("Kunde inte skapa beställningen.")
  }

  return (
    <div>
      <H2>Ny beställning</H2>
      <table style={{ margin: "0 auto" }}><tbody><tr>
        <td style={lbl}>Välj en leverantör:</td>
        <td><select style={inp} value={sel} onChange={(e) => setSel(e.target.value)}>
          <option value="">Välj...</option>
          {withProducts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select></td>
      </tr></tbody></table>

      {sel && (
        <div style={{ marginTop: "14px" }}>
          {supProducts.length === 0 ? (
            <div style={{ textAlign: "center", fontSize: "12px", color: "#666", padding: "10px" }}>
              {loadingProducts ? "Hämtar produkter…" : "Inga produkter är kopplade till denna leverantör ännu. Välj leverantör på produkten (fältet Leverantör under Hantera produkter)."}
            </div>
          ) : (
            <>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead><tr style={{ background: "#cccccc" }}>
                  <th style={thc}>Artikel</th><th style={thc}>Artikelnummer</th><th style={thcC}>Lagersaldo</th><th style={thcC}>Min-lager</th><th style={thcC}>Antal att beställa</th>
                </tr></thead>
                <tbody>
                  {supProducts.map((p) => { const key = p.variant_id || p.id; const l = lines[key] || { qty: 0, min: 0 }; return (
                    <tr key={key} style={{ borderBottom: "1px solid #e2e2e2" }}>
                      <td style={tdc}>{p.title}</td><td style={tdc}>{p.sku || "—"}</td>
                      <td style={{ ...tdc, textAlign: "center" }}>{p.qty}</td>
                      <td style={{ ...tdc, textAlign: "center" }}><input style={{ ...inp, width: "50px", textAlign: "center" }} value={l.min}
                        onChange={(e) => setLines((s) => ({ ...s, [key]: { ...l, min: Number(e.target.value) || 0 } }))} /></td>
                      <td style={{ ...tdc, textAlign: "center" }}><input style={{ ...inp, width: "60px", textAlign: "center" }} value={l.qty}
                        onChange={(e) => setLines((s) => ({ ...s, [key]: { ...l, qty: Number(e.target.value) || 0 } }))} /></td>
                    </tr>
                  )})}
                </tbody>
              </table>
              <div style={{ textAlign: "center", marginTop: "12px" }}>
                <button style={btn} disabled={saving} onClick={create}>{saving ? "Skapar…" : "Skapa beställning"}</button>
              </div>
            </>
          )}
        </div>
      )}
      {msg && <div style={{ textAlign: "center", fontSize: "12px", color: "#036", marginTop: "8px" }}>{msg}</div>}

      <H2>Lagervarning</H2>
      <div style={{ textAlign: "center", fontSize: "12px" }}>
        {loadingProducts ? <span style={{ color: "#666" }}>Hämtar lagersaldon…</span> : warnings.length === 0
          ? <span style={{ color: "#666" }}>Inga leverantörer har lagersaldo under önskat minimilager.</span>
          : (<>
              <div style={{ marginBottom: "8px" }}>Följande leverantörer har lagersaldo lägre än önskat minimilager:</div>
              {warnings.map((w) => (
                <div key={w.s.id} style={{ margin: "4px 0" }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setSel(w.s.id) }} style={lnk}>{w.s.name}</a>
                  <span style={{ color: "#888" }}> ({w.n} artiklar)</span>
                </div>
              ))}
            </>)}
      </div>
    </div>
  )
}

// ========================= Beställning (detalj) =========================
function OrderDetail({ id, onBack, onChanged }: { id: string; onBack: () => void; onChanged: () => void }) {
  const [data, setData] = useState<any>(null)
  const [recv, setRecv] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")
  const load = async () => { const r = await jget(`/admin/purchasing/orders/${id}`); setData(r); setRecv({}) }
  useEffect(() => { load() }, [id])
  if (!data) return <div style={{ textAlign: "center", fontSize: "12px", color: "#666" }}>Laddar…</div>
  const o = data.order || {}
  const lines: any[] = data.lines || []
  const archived = o.status === "archived"
  const deliver = async (archive: boolean) => {
    setBusy(true); setMsg("")
    const deliveries = Object.entries(recv).filter(([, v]) => Number(v) > 0).map(([line_id, qty]) => ({ line_id, qty }))
    const r = await jsend(`/admin/purchasing/orders/${id}/deliver`, "POST", { deliveries, archive })
    setBusy(false)
    if (r && r.order) { setMsg(archive ? "Beställningen är levererad och arkiverad." : "Leveransen är registrerad."); await load(); onChanged() }
    else setMsg("Kunde inte registrera leveransen.")
  }
  return (
    <div>
      <H2>Beställning {o.wiki_id || String(o.id || "").slice(-6)} - {o.supplier_name || ""}{archived ? " (Arkiverad)" : ""}</H2>
      <table style={{ margin: "0 auto 12px", fontSize: "12px" }}><tbody>
        <tr><td style={lbl}>Skapad:</td><td>{fmtDateTime(o.created_at)}</td></tr>
        <tr><td style={lbl}>Skickad:</td><td>{fmtDateTime(o.sent_at)}</td></tr>
        {archived && <tr><td style={lbl}>Arkiverad:</td><td>{fmtDateTime(o.archived_at)}</td></tr>}
      </tbody></table>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
        <thead><tr style={{ background: "#cccccc" }}>
          <th style={thc}>Artikelnummer</th><th style={thc}>Titel</th><th style={thcC}>Beställt</th><th style={thcC}>Levererat</th>{!archived && <th style={thcC}>Levereras nu</th>}
        </tr></thead>
        <tbody>{lines.map((l) => (
          <tr key={l.id} style={{ borderBottom: "1px solid #e2e2e2" }}>
            <td style={tdc}>{l.sku || "—"}</td><td style={tdc}>{l.title}</td>
            <td style={{ ...tdc, textAlign: "center" }}>{l.qty_ordered}</td>
            <td style={{ ...tdc, textAlign: "center" }}>{l.qty_delivered}</td>
            {!archived && <td style={{ ...tdc, textAlign: "center" }}><input style={{ ...inp, width: "50px", textAlign: "center" }} value={recv[l.id] ?? ""}
              onChange={(e) => setRecv((s) => ({ ...s, [l.id]: Number(e.target.value) || 0 }))} /></td>}
          </tr>
        ))}</tbody>
      </table>
      <div style={{ fontSize: "12px", marginTop: "10px" }}>Kommentar: {o.comment || ""}</div>
      {!archived && (
        <div style={{ textAlign: "center", marginTop: "12px" }}>
          <button style={btn} disabled={busy} onClick={() => deliver(false)}>Registrera leverans</button>{" "}
          <button style={btn} disabled={busy} onClick={() => deliver(true)}>Leverera och arkivera</button>
        </div>
      )}
      {msg && <div style={{ textAlign: "center", fontSize: "12px", color: "#036", marginTop: "8px" }}>{msg}</div>}
      <div style={{ textAlign: "center", marginTop: "12px" }}><a href="#" onClick={(e) => { e.preventDefault(); onBack() }} style={lnk}>« Tillbaka till beställningar</a></div>
    </div>
  )
}

// ========================= Beställningar =========================
function Bestallningar({ bump }: { bump: number }) {
  const [showArch, setShowArch] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  useEffect(() => { (async () => { setLoading(true); const r = await jget(`/admin/purchasing/orders?status=${showArch ? "archived" : "open"}`); setOrders(r.orders || []); setLoading(false) })() }, [showArch, bump, tick])
  if (openId) return <OrderDetail id={openId} onBack={() => setOpenId(null)} onChanged={() => setTick((t) => t + 1)} />
  return (
    <div>
      <H2>Beställningar - {showArch ? "Arkiv" : "Öppna"}</H2>
      {loading ? <div style={{ textAlign: "center", fontSize: "12px", color: "#666" }}>Laddar…</div> :
        orders.length === 0 ? <div style={{ textAlign: "center", fontSize: "12px", color: "#333" }}>Det finns inga {showArch ? "arkiverade" : "öppna"} beställningar.</div> :
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead><tr style={{ background: "#cccccc" }}>
            <th style={thcC}>ID</th><th style={thc}>Leverantör</th><th style={thcC}>Skapad</th><th style={thcC}>{showArch ? "Arkiverad" : "Skickad"}</th><th style={thcC}>Levererat</th><th style={thcC}>Hantera</th>
          </tr></thead>
          <tbody>{orders.map((o) => (
            <tr key={o.id} style={{ borderBottom: "1px solid #e2e2e2" }}>
              <td style={{ ...tdc, textAlign: "center" }}>{o.wiki_id || String(o.id).slice(-6)}</td>
              <td style={tdc}><a href="#" onClick={(e) => { e.preventDefault(); setOpenId(o.id) }} style={lnk}>{o.supplier_name || o.supplier_id}</a></td>
              <td style={{ ...tdc, textAlign: "center" }}>{fmtDate(o.created_at) || "—"}</td>
              <td style={{ ...tdc, textAlign: "center" }}>{fmtDate(showArch ? o.archived_at : o.sent_at) || "—"}</td>
              <td style={{ ...tdc, textAlign: "center" }}>{o.total_delivered}/{o.total_ordered}</td>
              <td style={{ ...tdc, textAlign: "center" }}><a href="#" onClick={(e) => { e.preventDefault(); setOpenId(o.id) }} style={lnk}>{showArch ? "Visa" : "Leverera"}</a></td>
            </tr>
          ))}</tbody>
        </table>}
      <div style={{ textAlign: "center", marginTop: "12px" }}>
        <a href="#" onClick={(e) => { e.preventDefault(); setShowArch(!showArch) }} style={{ color: "#0060cc", fontSize: "12px" }}>
          {showArch ? "« Visa öppna beställningar" : "Visa arkiverade beställningar »"}
        </a>
      </div>
    </div>
  )
}

// ========================= Lager / Inventering =========================
function LagerInventering({ products, suppliers, categories, initialSup, loadingProducts }: { products: Prod[]; suppliers: Supplier[]; categories: string[]; initialSup: string; loadingProducts: boolean }) {
  const [cat, setCat] = useState("")
  const [sup, setSup] = useState(initialSup)
  const [q, setQ] = useState("")
  const [level, setLevel] = useState("all")
  const [under, setUnder] = useState(1)
  const [show, setShow] = useState(!!initialSup)
  useEffect(() => { if (initialSup) { setSup(initialSup); setShow(true) } }, [initialSup])

  const supName = (p: Prod) => suppliers.find((s) => s.id === p.supplier_id)?.name || p.supplier_name || ""
  const rows = useMemo(() => {
    let r = products
    if (cat) r = r.filter((p) => p.category === cat)
    if (sup) r = r.filter((p) => p.supplier_id === sup)
    if (q.trim()) { const t = q.trim().toLowerCase(); r = r.filter((p) => p.title.toLowerCase().includes(t) || (p.sku || "").toLowerCase().includes(t)) }
    if (level === "min") r = r.filter((p) => p.min_stock > 0 && p.qty < p.min_stock)
    if (level === "under") r = r.filter((p) => p.qty < under)
    return r
  }, [products, cat, sup, q, level, under, show])

  return (
    <div>
      <H2>Lager / Inventering</H2>
      <table style={{ margin: "0 auto" }}><tbody>
        <tr><td style={lbl}>Varugrupp:</td><td><select style={inp} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Alla varugrupper</option>{categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select></td></tr>
        <tr><td style={lbl}>Leverantör:</td><td><select style={inp} value={sup} onChange={(e) => setSup(e.target.value)}>
          <option value="">Alla leverantörer</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select></td></tr>
        <tr><td style={lbl}>Sök:</td><td><input style={{ ...inp, width: "200px" }} value={q} onChange={(e) => setQ(e.target.value)} /></td></tr>
        <tr><td style={lbl}>Lagernivå:</td><td style={{ fontSize: "12px", fontFamily: WF }}>
          <label style={{ display: "block" }}><input type="radio" checked={level === "all"} onChange={() => setLevel("all")} /> Visa alla</label>
          <label style={{ display: "block" }}><input type="radio" checked={level === "min"} onChange={() => setLevel("min")} /> Visa alla under önskat min-lager</label>
          <label style={{ display: "block" }}><input type="radio" checked={level === "under"} onChange={() => setLevel("under")} /> Visa alla med lagersaldo under <input style={{ ...inp, width: "40px" }} value={under} onChange={(e) => setUnder(Number(e.target.value) || 0)} /> st</label>
        </td></tr>
      </tbody></table>
      <div style={{ textAlign: "center", margin: "12px 0" }}><button style={btn} onClick={() => setShow(true)}>Visa produkter</button></div>
      {show && loadingProducts && <div style={{ textAlign: "center", fontSize: "11px", color: "#888", marginBottom: "6px" }}>Hämtar produkter… ({products.length} rader hittills)</div>}

      {show && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead><tr style={{ background: "#cccccc" }}><th style={thc}>Artikel</th><th style={thc}>Artikelnummer</th><th style={thc}>Varugrupp</th><th style={thc}>Leverantör</th><th style={thcC}>Lagersaldo</th><th style={thcC}>Min-lager</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={6} style={{ ...tdc, textAlign: "center", color: "#666" }}>Inga produkter matchar filtret.</td></tr> :
              rows.slice(0, 500).map((p) => (
                <tr key={(p.variant_id || p.id)} style={{ borderBottom: "1px solid #e2e2e2", background: (p.min_stock > 0 && p.qty < p.min_stock) ? "#fff3f3" : "transparent" }}>
                  <td style={tdc}><a href={`${ADMIN}/produkt-form?id=${p.id}`} style={{ color: "#0060cc" }}>{p.title}</a></td><td style={tdc}>{p.sku || "—"}</td><td style={tdc}>{p.category || "—"}</td>
                  <td style={tdc}>{supName(p) || "—"}</td>
                  <td style={{ ...tdc, textAlign: "center", fontWeight: 700, color: (p.min_stock > 0 && p.qty < p.min_stock) ? "#cc0000" : "#000" }}>{p.qty}</td>
                  <td style={{ ...tdc, textAlign: "center" }}>{p.min_stock || "—"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
      {show && rows.length > 500 && <div style={{ textAlign: "center", fontSize: "11px", color: "#888", marginTop: "6px" }}>Visar 500 av {rows.length} rader.</div>}
    </div>
  )
}

// ========================= Leverantörer =========================
function Leverantorer({ suppliers, reload, showProducts }: { suppliers: Supplier[]; reload: () => void; showProducts: (id: string) => void }) {
  const [rows, setRows] = useState<Supplier[]>(suppliers)
  const [nw, setNw] = useState({ name: "", email: "", ref_first_name: "", ref_last_name: "" })
  const [saved, setSaved] = useState("")
  useEffect(() => setRows(suppliers), [suppliers])

  const del = async (s: Supplier) => {
    if (!window.confirm(`Ta bort leverantören "${s.name}"?`)) return
    await jsend(`/admin/purchasing/suppliers/${s.id}`, "DELETE"); reload()
  }
  const add = async () => { if (!nw.name.trim()) return; await jsend("/admin/purchasing/suppliers", "POST", nw); setNw({ name: "", email: "", ref_first_name: "", ref_last_name: "" }); reload() }
  const save = async (s: Supplier) => { await jsend(`/admin/purchasing/suppliers/${s.id}`, "POST", { name: s.name, email: s.email, ref_first_name: s.ref_first_name, ref_last_name: s.ref_last_name }) }
  const saveAll = async () => { for (const s of rows) await save(s); setSaved("Ändringarna är sparade."); reload() }
  const upd = (i: number, k: keyof Supplier, v: string) => setRows((r) => r.map((x, j) => j === i ? { ...x, [k]: v } : x))

  return (
    <div>
      <H2>Leverantörer</H2>
      <div style={{ textAlign: "center", fontSize: "12px", color: "#333", marginBottom: "14px" }}>
        Här kan ni registrera era leverantörer. Om ni sedan kopplar produkter till leverantörerna (under hantera produkter) kommer ni kunna skapa inköpsordrar för dessa produkter.
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
        <thead><tr style={{ background: "#cccccc" }}><th style={thc}>Leverantör</th><th style={thc}>E-postadress</th><th style={thc}>Referens förnamn</th><th style={thc}>Referens efternamn</th><th style={thcC}>Produkter</th><th style={thcC}>Ta bort</th></tr></thead>
        <tbody>
          {rows.map((s, i) => (
            <tr key={s.id} style={{ borderBottom: "1px solid #e2e2e2" }}>
              <td style={tdc}><input style={{ ...inp, width: "95%" }} value={s.name} onChange={(e) => upd(i, "name", e.target.value)} onBlur={() => save(rows[i])} /></td>
              <td style={tdc}><input style={{ ...inp, width: "95%" }} value={s.email || ""} onChange={(e) => upd(i, "email", e.target.value)} onBlur={() => save(rows[i])} /></td>
              <td style={tdc}><input style={{ ...inp, width: "95%" }} value={s.ref_first_name || ""} onChange={(e) => upd(i, "ref_first_name", e.target.value)} onBlur={() => save(rows[i])} /></td>
              <td style={tdc}><input style={{ ...inp, width: "95%" }} value={s.ref_last_name || ""} onChange={(e) => upd(i, "ref_last_name", e.target.value)} onBlur={() => save(rows[i])} /></td>
              <td style={{ ...tdc, textAlign: "center" }}>{(s.product_count || 0) > 0
                ? <a href="#" onClick={(e) => { e.preventDefault(); showProducts(s.id) }} style={lnk}>{s.product_count}</a>
                : <span style={{ color: "#999" }}>0</span>}</td>
              <td style={{ ...tdc, textAlign: "center" }}><a href="#" onClick={(e) => { e.preventDefault(); del(s) }} style={{ color: "#cc0000" }}>Ta bort</a></td>
            </tr>
          ))}
          <tr style={{ background: "#f7f7f7" }}>
            <td style={tdc}><input style={{ ...inp, width: "95%" }} placeholder="Ny leverantör" value={nw.name} onChange={(e) => setNw({ ...nw, name: e.target.value })} /></td>
            <td style={tdc}><input style={{ ...inp, width: "95%" }} value={nw.email} onChange={(e) => setNw({ ...nw, email: e.target.value })} /></td>
            <td style={tdc}><input style={{ ...inp, width: "95%" }} value={nw.ref_first_name} onChange={(e) => setNw({ ...nw, ref_first_name: e.target.value })} /></td>
            <td style={tdc}><input style={{ ...inp, width: "95%" }} value={nw.ref_last_name} onChange={(e) => setNw({ ...nw, ref_last_name: e.target.value })} /></td>
            <td style={tdc}></td>
            <td style={{ ...tdc, textAlign: "center" }}><button style={btn} onClick={add}>Lägg till</button></td>
          </tr>
        </tbody>
      </table>
      <div style={{ textAlign: "center", marginTop: "12px" }}>
        <button style={btn} onClick={saveAll}>Spara</button>
        {saved && <span style={{ fontSize: "12px", color: "#036", marginLeft: "8px" }}>{saved}</span>}
      </div>
      <div style={{ textAlign: "center", fontSize: "11px", color: "#888", marginTop: "8px" }}>{rows.length} leverantörer</div>
    </div>
  )
}

// ========================= Hjälp / info =========================
function Hjalp() {
  const P: any = { fontSize: "12px", color: "#333", lineHeight: 1.5, margin: "0 0 12px" }
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto" }}>
      <H2>Hjälp / Information</H2>
      <p style={P}>På denna sida kan ni hantera beställningar av lagervaror från era leverantörer. När ni sedan väljer att "leverera" en sådan beställning adderas det beställda antalet varor till lagersaldot. Obs: lagersaldot kan även justeras manuellt eller via tredjepartsystem.</p>
      <p style={P}>Börja med att registrera era leverantörer. När ni sedan skapar eller redigerar produkter kan ni välja vilken leverantör produkten tillhör (fältet Leverantör i produktformuläret).</p>
      <p style={P}>När det finns leverantörer inlagda med produkter kopplade till sig, kan ni skapa en ny beställning. Genom att välja en leverantör får ni se en lista med tillhörande produkter. Här kan ni ange ett önskat minimilager per produkt — detta används för att automatiskt ge ett förslag på hur många exemplar som bör beställas.</p>
      <p style={P}>Vid mottagande av varor från leverantören öppnar ni beställningen och stämmer av antalet levererade varor. Allt måste inte levereras samtidigt — ni kan öppna en beställning flera gånger vid delleveranser. Varje gång ni "levererar" adderas det angivna antalet till lagersaldot.</p>
    </div>
  )
}

// ========================= Page shell =========================
function InkopLagerPage() {
  const [tab, setTab] = useState("ny")
  const [meta, setMeta] = useState<{ online: number | null; unread: number }>({ online: null, unread: 0 })
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [rawProducts, setRawProducts] = useState<Prod[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [bump, setBump] = useState(0)
  const [lagerSup, setLagerSup] = useState("")

  useEffect(() => {
    const el = Array.from(document.querySelectorAll("div")).find((d) => {
      const c = typeof d.className === "string" ? d.className : ""
      return c.includes("w-[220px]") && c.includes("lg:flex") && c.includes("border-e")
    }) as HTMLElement | undefined
    const prev = el ? el.style.display : ""
    if (el) el.style.display = "none"
    return () => { if (el) el.style.display = prev }
  }, [])

  useEffect(() => { (async () => {
    try { const o = await jget("/admin/orders?limit=1"); setMeta((s) => ({ ...s, unread: o.count || 0 })) } catch {}
    try { const s = await jget("/admin/purchasing/suppliers"); setSuppliers(s.suppliers || []) } catch {}
  })() }, [bump])

  useEffect(() => { (async () => {
    setLoadingProducts(true)
    try { const p = await loadProducts(); setRawProducts(p) } catch {}
    setLoadingProducts(false)
  })() }, [])

  const products = useMemo(() => {
    const byName: Record<string, string> = {}
    for (const s of suppliers) byName[norm(s.name)] = s.id
    const ids = new Set(suppliers.map((s) => s.id))
    return rawProducts.map((p) => {
      const sid = (p.supplier_id && ids.has(p.supplier_id)) ? p.supplier_id : (byName[norm(p.supplier_name)] || p.supplier_id || null)
      return sid === p.supplier_id ? p : { ...p, supplier_id: sid }
    })
  }, [rawProducts, suppliers])

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort(), [products])
  const reload = () => setBump((b) => b + 1)

  const tabBtn = (active: boolean): any => ({ padding: "6px 16px", margin: "0 4px", fontSize: "12px", fontFamily: WF, cursor: "pointer",
    border: "1px solid #9bb", borderRadius: "4px", background: active ? "#cfe3f5" : "#eef5fb", color: "#036", fontWeight: active ? 700 : 400 })

  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny online={meta.online} unread={meta.unread} active="Inköp / Lager" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px" }}>
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>📕</span>
          <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>INKÖP / LAGER</span>
        </div>
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <button style={tabBtn(tab === "ny")} onClick={() => setTab("ny")}>Ny beställning</button>
          <button style={tabBtn(tab === "best")} onClick={() => setTab("best")}>Beställningar</button>
          <button style={tabBtn(tab === "lager")} onClick={() => { setLagerSup(""); setTab("lager") }}>Lager/Inventering</button>
          <button style={tabBtn(tab === "lev")} onClick={() => setTab("lev")}>Leverantörer</button>
          <button style={tabBtn(tab === "help")} onClick={() => setTab("help")}>Hjälp/info</button>
        </div>
        {tab === "ny" && <NyBestallning suppliers={suppliers} products={products} loadingProducts={loadingProducts} reload={reload} openOrders={() => setTab("best")} />}
        {tab === "best" && <Bestallningar bump={bump} />}
        {tab === "lager" && <LagerInventering products={products} suppliers={suppliers} categories={categories} initialSup={lagerSup} loadingProducts={loadingProducts} />}
        {tab === "lev" && <Leverantorer suppliers={suppliers} reload={reload} showProducts={(id) => { setLagerSup(id); setTab("lager") }} />}
        {tab === "help" && <Hjalp />}
        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "12px" }}>
          <a href={`${ADMIN}/kontrollpanel`} style={{ color: "#0060cc" }}>◄ Till kontrollpanelen</a>
        </div>
      </div>
    </div>
  )
}

const thc: any = { border: "1px solid #bbb", padding: "5px 6px", fontWeight: 700, fontSize: "11px", textAlign: "left" }
const thcC: any = { ...thc, textAlign: "center" }
const tdc: any = { border: "1px solid #e2e2e2", padding: "4px 6px", fontSize: "12px" }

export const config = defineRouteConfig({ label: "Inköp / Lager", icon: BookIcon })
export default InkopLagerPage
