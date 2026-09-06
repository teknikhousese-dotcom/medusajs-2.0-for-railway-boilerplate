import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

/**
 * Teknikhouse.se — Hantera produkter (mirror of Wikinggruppen products_multiedit.php)
 * Bulk product editor over the native Medusa product APIs (same-origin fetch, no custom tables).
 * Filter (Varugrupp / Sök / Status) → checkbox-select → bulk Publicera/Avpublicera + Koppla varugrupp.
 * Per-row: Redigera (native), Kopiera (duplicate). Sub-items: Lägg in ny / Sortering / Filtrering.
 */
const BoxIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
  </svg>
)
async function jget(u: string) { return fetch(u, { credentials: "include" }).then((r) => r.json()) }
async function jsend(u: string, m: string, b?: any) { return fetch(u, { method: m, credentials: "include", headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined }).then((r) => r.json()) }

const PAGE = 50

function HanteraProdukterPage() {
  const [meta, setMeta] = useState<{ online: number | null; unread: number }>({ online: null, unread: 0 })
  const [cats, setCats] = useState<any[]>([])
  const [catId, setCatId] = useState("")
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [connectCat, setConnectCat] = useState("")
  const [note, setNote] = useState("")
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
  useEffect(() => {
    jget("/admin/orders?limit=1").then((o) => setMeta((s) => ({ ...s, unread: o.count || 0 }))).catch(() => {})
    jget("/admin/product-categories?limit=1000&fields=id,name,parent_category_id").then((d) => setCats(d.product_categories || [])).catch(() => {})
  }, [])

  const load = async (off = 0) => {
    setBusy(true)
    const p = new URLSearchParams({ limit: String(PAGE), offset: String(off), fields: "id,title,status,thumbnail,*variants,*categories" })
    if (q.trim()) p.set("q", q.trim())
    if (catId) p.set("category_id", catId)
    if (status) p.set("status", status)
    try {
      const d = await jget("/admin/products?" + p.toString())
      setRows(d.products || []); setTotal(d.count || 0); setOffset(off); setChecked({})
    } catch { setNote("Kunde inte hämta produkter.") }
    setBusy(false)
  }
  useEffect(() => { load(0) }, [])

  const ids = () => Object.keys(checked).filter((k) => checked[k])
  const allChecked = rows.length > 0 && rows.every((r) => checked[r.id])
  const toggleAll = () => { const n: Record<string, boolean> = {}; if (!allChecked) rows.forEach((r) => (n[r.id] = true)); setChecked(n) }

  const bulkStatus = async (st: string) => {
    const sel = ids(); if (!sel.length) { setNote("Inga produkter markerade."); return }
    if (!confirm(`${st === "published" ? "Publicera" : "Avpublicera"} ${sel.length} produkt(er)?`)) return
    setBusy(true); let ok = 0
    for (const id of sel) { try { const r = await jsend(`/admin/products/${id}`, "POST", { status: st }); if (r.product) ok++ } catch {} }
    setBusy(false); setNote(`${ok} produkt(er) ${st === "published" ? "publicerade" : "avpublicerade"}.`); load(offset)
  }
  const bulkConnectCat = async () => {
    const sel = ids(); if (!sel.length) { setNote("Inga produkter markerade."); return }
    if (!connectCat) { setNote("Välj en varugrupp att koppla till."); return }
    setBusy(true); let ok = 0
    for (const id of sel) {
      const row = rows.find((r) => r.id === id)
      const cur = (row?.categories || []).map((c: any) => c.id)
      const next = Array.from(new Set([...cur, connectCat]))
      try { const r = await jsend(`/admin/products/${id}`, "POST", { categories: next.map((cid) => ({ id: cid })) }); if (r.product) ok++ } catch {}
    }
    setBusy(false); setNote(`${ok} produkt(er) kopplade till varugruppen.`); load(offset)
  }
  const copyProduct = async (row: any) => {
    if (!confirm(`Kopiera "${row.title}"?`)) return
    const full = await jget(`/admin/products/${row.id}?fields=id,title,*categories,*options,*variants,*variants.options`)
    const p = full.product
    const opts = (p.options || []).map((o: any) => ({ title: o.title, values: (o.values || []).map((v: any) => v.value) }))
    const payload: any = {
      title: p.title + " (kopia)", status: "draft",
      categories: (p.categories || []).map((c: any) => ({ id: c.id })),
      options: opts.length ? opts : [{ title: "Default", values: ["Default"] }],
      variants: (p.variants || []).map((v: any, i: number) => ({
        title: v.title || "Default",
        sku: v.sku ? v.sku + "-KOPIA" : undefined,
        options: opts.length ? Object.fromEntries((v.options || []).map((o: any) => [o.option?.title || "Default", o.value])) : { Default: "Default" },
      })),
    }
    if (!payload.variants.length) payload.variants = [{ title: "Default", options: { Default: "Default" } }]
    const r = await jsend("/admin/products", "POST", payload)
    if (r.product) { setNote(`Kopia skapad: ${r.product.title} (utkast).`); load(offset) } else setNote("Kunde inte kopiera produkten.")
  }

  const catName = (row: any) => (row.categories || []).map((c: any) => c.name).join(", ") || "—"
  const inp: any = { fontFamily: WF, fontSize: "12px", padding: "4px 6px", border: "1px solid #bbb", borderRadius: "2px" }
  const btn: any = { fontFamily: WF, fontSize: "12px", padding: "4px 12px", border: "1px solid #999", borderRadius: "3px", background: "#f0f0f0", cursor: "pointer" }
  const th: any = { border: "1px solid #bbb", padding: "6px 8px", fontWeight: 700, fontSize: "11px", textAlign: "left", background: "#cccccc" }
  const td: any = { border: "1px solid #e2e2e2", padding: "5px 8px", fontSize: "12px" }
  const sel = ids()

  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny online={meta.online} unread={meta.unread} active="Hantera produkter" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px" }}>
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>🧰</span>
          <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>HANTERA PRODUKTER</span>
        </div>
        <p style={{ fontSize: "12px", color: "#333", margin: "0 0 10px" }}>Här listas butikens produkter. Genom att kryssa för dem kan du ändra flera i ett svep.</p>

        {/* sub-item bar */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px", fontSize: "12px" }}>
          <a href={`${ADMIN}/products/create`} style={{ color: "#0060cc" }}>＋ Lägg in ny produkt</a>
          <span style={{ color: "#bbb" }}>|</span>
          <a href={`${ADMIN}/categories`} style={{ color: "#0060cc" }}>Produktsortering (varugrupper)</a>
          <span style={{ color: "#bbb" }}>|</span>
          <a href={`${ADMIN}/products`} style={{ color: "#0060cc" }}>Produktfiltrering (native)</a>
        </div>

        {/* Urval */}
        <div style={{ border: "1px solid #ddd", background: "#fafafa", borderRadius: "4px", padding: "10px 14px", marginBottom: "12px" }}>
          <div style={{ fontWeight: 700, fontSize: "12px", marginBottom: "6px" }}>Urval</div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ fontSize: "12px" }}>Varugrupp: <select style={{ ...inp, maxWidth: "260px" }} value={catId} onChange={(e) => setCatId(e.target.value)}>
              <option value="">Alla varugrupper</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
            <label style={{ fontSize: "12px" }}>Status: <select style={inp} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Alla</option><option value="published">Publicerade</option><option value="draft">Utkast</option>
            </select></label>
            <label style={{ fontSize: "12px" }}>Sök: <input style={{ ...inp, width: "180px" }} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") load(0) }} /></label>
            <button style={btn} onClick={() => load(0)} disabled={busy}>Visa produkter</button>
          </div>
        </div>

        {/* Bulk bar */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", color: "#555" }}>Markerade: <b>{sel.length}</b></span>
          <button style={btn} onClick={() => bulkStatus("published")} disabled={busy || !sel.length}>Publicera</button>
          <button style={btn} onClick={() => bulkStatus("draft")} disabled={busy || !sel.length}>Avpublicera</button>
          <span style={{ color: "#bbb" }}>|</span>
          <span style={{ fontSize: "12px" }}>Koppla till:</span>
          <select style={{ ...inp, maxWidth: "220px" }} value={connectCat} onChange={(e) => setConnectCat(e.target.value)}>
            <option value="">Välj varugrupp…</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button style={btn} onClick={bulkConnectCat} disabled={busy || !sel.length}>Koppla</button>
        </div>
        {note && <div style={{ fontSize: "12px", color: "#036", marginBottom: "8px" }}>{note}</div>}

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={{ ...th, width: "28px", textAlign: "center" }}><input type="checkbox" checked={allChecked} onChange={toggleAll} /></th>
            <th style={th}>Namn</th><th style={{ ...th, width: "120px" }}>SKU</th><th style={{ ...th, width: "90px" }}>Status</th>
            <th style={{ ...th, width: "180px" }}>Varugrupp</th><th style={{ ...th, width: "120px" }}></th>
          </tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={6} style={{ ...td, textAlign: "center", color: "#666" }}>{busy ? "Hämtar…" : "Inga produkter."}</td></tr> :
              rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #eee", background: checked[r.id] ? "#fffbe6" : "transparent" }}>
                  <td style={{ ...td, textAlign: "center" }}><input type="checkbox" checked={!!checked[r.id]} onChange={(e) => setChecked({ ...checked, [r.id]: e.target.checked })} /></td>
                  <td style={td}><a href={`${ADMIN}/products/${r.id}`} style={{ color: "#0060cc", textDecoration: "none" }}>{r.title}</a></td>
                  <td style={td}>{(r.variants || [])[0]?.sku || "—"}</td>
                  <td style={td}>{r.status === "published" ? <span style={{ color: "#2a7" }}>Publicerad</span> : <span style={{ color: "#a70" }}>Utkast</span>}</td>
                  <td style={td}>{catName(r)}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <a href={`${ADMIN}/products/${r.id}`} style={{ color: "#0060cc" }}>Redigera</a>
                    <span style={{ color: "#bbb" }}> | </span>
                    <a href="#" onClick={(e) => { e.preventDefault(); copyProduct(r) }} style={{ color: "#0060cc" }}>Kopiera</a>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", fontSize: "12px" }}>
          <span>{total > 0 ? `${offset + 1}–${Math.min(offset + PAGE, total)} av ${total}` : "0 produkter"}</span>
          <span>
            <button style={btn} onClick={() => load(Math.max(0, offset - PAGE))} disabled={busy || offset === 0}>◄ Föregående</button>
            <button style={{ ...btn, marginLeft: "6px" }} onClick={() => load(offset + PAGE)} disabled={busy || offset + PAGE >= total}>Nästa ►</button>
          </span>
        </div>

        <div style={{ textAlign: "center", marginTop: "18px", fontSize: "12px" }}>
          <a href={`${ADMIN}/kontrollpanel`} style={{ color: "#0060cc" }}>◄ Till kontrollpanelen</a>
        </div>
      </div>
    </div>
  )
}
export const config = defineRouteConfig({ label: "Hantera produkter", icon: BoxIcon })
export default HanteraProdukterPage
