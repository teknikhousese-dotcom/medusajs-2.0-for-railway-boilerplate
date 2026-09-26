import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Fragment, useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

/**
 * Teknikhouse.se — Hantera produkter (mirror of Wikinggruppen products_multiedit.php)
 * Default view: bulk product editor over the native Medusa product APIs.
 * ?action=copy → the dedicated "KOPIERA PRODUKT" wizard (products.php?action=copy):
 *   1. Produkt som ska kopieras (sök)  2. Vad ska kopieras (Valalternativ /
 *   Associeringar / Köp X betala för Y-regler)  3. Nytt artikelnummer  4. Skapa kopia.
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
const inp: any = { fontFamily: WF, fontSize: "12px", padding: "4px 6px", border: "1px solid #bbb", borderRadius: "2px" }
const btn: any = { fontFamily: WF, fontSize: "12px", padding: "4px 12px", border: "1px solid #999", borderRadius: "3px", background: "#f0f0f0", cursor: "pointer" }

function useHideNativeNav() {
  useEffect(() => {
    const el = Array.from(document.querySelectorAll("div")).find((d) => {
      const c = typeof d.className === "string" ? d.className : ""
      return c.includes("w-[220px]") && c.includes("lg:flex") && c.includes("border-e")
    }) as HTMLElement | undefined
    const prev = el ? el.style.display : ""
    if (el) el.style.display = "none"
    return () => { if (el) el.style.display = prev }
  }, [])
}

/* ------------------------------------------------------------------ COPY WIZARD */
function CopyPage() {
  useHideNativeNav()
  const [meta, setMeta] = useState<{ online: number | null; unread: number }>({ online: null, unread: 0 })
  const [q, setQ] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [sel, setSel] = useState<any>(null)
  const [opts, setOpts] = useState({ valalternativ: true, associeringar: true, xy: false })
  const [artnr, setArtnr] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")
  const [done, setDone] = useState<any>(null)

  useEffect(() => { jget("/admin/orders?limit=1").then((o) => setMeta((s) => ({ ...s, unread: o.count || 0 }))).catch(() => {}) }, [])
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id")
    if (!id) return
    jget(`/admin/products/${id}?fields=id,title,thumbnail,*variants`).then((d) => { if (d.product) pick(d.product) }).catch(() => {})
  }, [])

  const search = async () => {
    if (q.trim().length < 2) { setMsg("Ange minst 2 tecken för att söka."); return }
    setSearching(true); setMsg("")
    try {
      const d = await jget(`/admin/products?limit=15&q=${encodeURIComponent(q.trim())}&fields=id,title,thumbnail,*variants`)
      setResults(d.products || [])
      if (!(d.products || []).length) setMsg("Inga produkter matchar sökningen.")
    } catch { setMsg("Kunde inte söka produkter.") }
    setSearching(false)
  }
  const pick = (p: any) => { setSel(p); setResults([]); setQ(p.title); const sku = (p.variants || [])[0]?.sku || ""; setArtnr(sku ? sku + "-KOPIA" : "") }

  const skapaKopia = async () => {
    if (!sel) { setMsg("Välj först en produkt att kopiera."); return }
    if (!artnr.trim()) { setMsg("Ange ett nytt artikelnummer."); return }
    setBusy(true); setMsg("Skapar kopia…"); setDone(null)
    try {
      const full = await jget(`/admin/products/${sel.id}?fields=id,title,subtitle,description,handle,weight,material,thumbnail,status,*images,*options,*options.values,*variants,*variants.options,*variants.prices,*categories,*tags,collection_id`)
      const p = full.product
      const useVar = opts.valalternativ && (p.options || []).length > 0
      const payload: any = {
        title: p.title + " (kopia)",
        status: "draft",
        subtitle: p.subtitle || undefined,
        description: p.description || undefined,
        handle: (p.handle ? p.handle : "produkt") + "-kopia-" + Date.now().toString(36),
        weight: p.weight || undefined,
        material: p.material || undefined,
        thumbnail: p.thumbnail || undefined,
        images: (p.images || []).map((im: any) => ({ url: im.url })),
      }
      if (opts.associeringar) {
        payload.categories = (p.categories || []).map((c: any) => ({ id: c.id }))
        if (p.collection_id) payload.collection_id = p.collection_id
        if ((p.tags || []).length) payload.tags = p.tags.map((t: any) => ({ id: t.id }))
      }
      if (useVar) {
        payload.options = (p.options || []).map((o: any) => ({ title: o.title, values: (o.values || []).map((v: any) => v.value) }))
        payload.variants = (p.variants || []).map((v: any, i: number) => ({
          title: v.title || "Default",
          sku: i === 0 ? artnr.trim() : (v.sku ? v.sku + "-KOPIA" : undefined),
          prices: (v.prices || []).map((pr: any) => ({ amount: pr.amount, currency_code: pr.currency_code })),
          options: Object.fromEntries((v.options || []).map((o: any) => [o.option?.title || "Default", o.value])),
        }))
      } else {
        const v0 = (p.variants || [])[0] || {}
        payload.options = [{ title: "Default", values: ["Default"] }]
        payload.variants = [{ title: v0.title || "Default", sku: artnr.trim(), prices: (v0.prices || []).map((pr: any) => ({ amount: pr.amount, currency_code: pr.currency_code })), options: { Default: "Default" } }]
      }
      const r = await jsend("/admin/products", "POST", payload)
      if (!r.product) { setMsg("Kunde inte skapa kopian: " + (r.message || JSON.stringify(r).slice(0, 160))); setBusy(false); return }
      const np = r.product
      let xyMsg = ""
      if (opts.xy) {
        try {
          const list = await jget("/admin/wiki-xfory")
          const rules = (list.rules || list.promotions || []).filter((ru: any) => JSON.stringify(ru).includes(sel.id))
          let made = 0
          for (const ru of rules) {
            const ids = Array.from(new Set([...(ru.product_ids || []), np.id]))
            const rr = await jsend("/admin/wiki-xfory", "POST", { namn: (ru.namn || ru.name || "Kopia-regel") + " (kopia)", x: ru.x || ru.buy_quantity, y: ru.y || ru.pay_quantity, product_ids: ids })
            if (rr && !rr.error) made++
          }
          xyMsg = made ? ` ${made} Köp-X-betala-för-Y-regel(er) kopierade.` : " Inga matchande X-för-Y-regler hittades."
        } catch { xyMsg = " (X-för-Y-regler kunde inte kopieras automatiskt.)" }
      }
      setDone(np)
      setMsg(`✔ Kopia skapad som utkast: ${np.title} (artnr ${artnr.trim()}).` + xyMsg)
    } catch (e: any) { setMsg("Fel: " + String((e && e.message) || e)) }
    setBusy(false)
  }

  const card: any = { border: "1px solid #ddd", borderRadius: "5px", background: "#fafafa", padding: "12px 14px", marginBottom: "12px" }
  const step: any = { fontWeight: 700, fontSize: "13px", marginBottom: "8px", color: "#333" }
  const chk: any = { display: "block", fontSize: "12px", margin: "4px 0" }

  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny online={meta.online} unread={meta.unread} active="Hantera produkter" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px", maxWidth: "760px" }}>
        <div style={{ textAlign: "center", marginBottom: "14px" }}>
          <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>📋</span>
          <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>KOPIERA PRODUKT</span>
        </div>

        <div style={card}>
          <div style={step}>1. Produkt som ska kopieras</div>
          <div style={{ fontSize: "11px", color: "#777", marginBottom: "6px" }}>För att söka, ange minst 2 tecken av namn eller artikelnummer.</div>
          <input style={{ ...inp, width: "280px" }} value={q} placeholder="Sök namn eller artikelnummer…" onChange={(e) => { setQ(e.target.value); setSel(null) }} onKeyDown={(e) => { if (e.key === "Enter") search() }} />
          <button style={{ ...btn, marginLeft: "6px" }} onClick={search} disabled={searching}>{searching ? "Söker…" : "Sök"}</button>
          {results.length > 0 && (
            <div style={{ border: "1px solid #ccc", borderRadius: "3px", marginTop: "8px", maxHeight: "220px", overflow: "auto", background: "#fff" }}>
              {results.map((p) => (
                <div key={p.id} onClick={() => pick(p)} style={{ padding: "5px 8px", borderBottom: "1px solid #eee", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  {p.thumbnail ? <img src={p.thumbnail} style={{ width: "26px", height: "26px", objectFit: "cover", borderRadius: "3px" }} /> : <span style={{ width: "26px" }} />}
                  <span>{p.title}</span>
                  <span style={{ color: "#999", marginLeft: "auto" }}>{(p.variants || [])[0]?.sku || ""}</span>
                </div>
              ))}
            </div>
          )}
          {sel && <div style={{ marginTop: "8px", fontSize: "12px", color: "#036" }}>Vald: <b>{sel.title}</b>{(sel.variants || [])[0]?.sku ? ` (artnr ${(sel.variants || [])[0].sku})` : ""}</div>}
        </div>

        <div style={card}>
          <div style={step}>2. Vad ska kopieras (förutom produktdetaljer)?</div>
          <label style={chk}><input type="checkbox" checked={opts.valalternativ} onChange={(e) => setOpts({ ...opts, valalternativ: e.target.checked })} /> Valalternativ</label>
          <label style={chk}><input type="checkbox" checked={opts.associeringar} onChange={(e) => setOpts({ ...opts, associeringar: e.target.checked })} /> Associeringar till andra produkter</label>
          <label style={chk}><input type="checkbox" checked={opts.xy} onChange={(e) => setOpts({ ...opts, xy: e.target.checked })} /> Köp X betala för Y-regler</label>
        </div>

        <div style={card}>
          <div style={step}>3. Nytt artikelnummer</div>
          <input style={{ ...inp, width: "220px" }} value={artnr} placeholder="Nytt artikelnummer…" onChange={(e) => setArtnr(e.target.value)} />
        </div>

        <div style={card}>
          <div style={step}>4. Skapa kopia</div>
          <button style={{ ...btn, background: "#2e7d32", color: "#fff", border: "1px solid #2e7d32", padding: "6px 18px" }} onClick={skapaKopia} disabled={busy || !sel}>Skapa kopia</button>
          {msg && <div style={{ marginTop: "10px", fontSize: "12px", color: msg.startsWith("Fel") || msg.startsWith("Kunde") ? "#a00" : "#256029" }}>{msg}</div>}
          {done && <div style={{ marginTop: "6px", fontSize: "12px" }}><a href={`${ADMIN}/products/${done.id}`} style={{ color: "#0060cc" }}>► Öppna kopian för redigering</a></div>}
        </div>

        <div style={{ textAlign: "center", marginTop: "6px", fontSize: "12px" }}>
          <a href={`${ADMIN}/hantera-produkter`} style={{ color: "#0060cc" }}>◄ Tillbaka till produktlistan</a>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- GRID VIEW */
function GridPage() {
  useHideNativeNav()
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
    jget("/admin/orders?limit=1").then((o) => setMeta((s) => ({ ...s, unread: o.count || 0 }))).catch(() => {})
    jget("/admin/product-categories?limit=1000&fields=id,name,parent_category_id").then((d) => setCats(d.product_categories || [])).catch(() => {})
  }, [])

  const load = async (off = 0) => {
    setBusy(true)
    const p = new URLSearchParams({ limit: String(PAGE), offset: String(off), fields: "id,title,status,thumbnail,metadata,*options,*variants,*variants.options,*categories" })
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

  const taBortProdukt = async (r: any) => {
  if (!confirm(`Vill du verkligen ta bort produkten "${r.title}"?`)) return
  setBusy(true)
  let res = ""
  try {
  const resp = await fetch(`/admin/products/${r.id}`, { method: "DELETE", credentials: "include" })
  const j: any = await resp.json().catch(() => ({}))
  res = resp.ok ? `Produkten "${r.title}" har tagits bort.` : `Kunde inte ta bort produkten "${r.title}": ${(j && j.message) || resp.status}`
  } catch (e: any) { res = `Kunde inte ta bort produkten "${r.title}": ${String((e && e.message) || e)}` }
  setBusy(false)
  await load(offset)
  setNote(res)
  }
  const fmtLager = (a: any) => (a == null || a === "" ? "—" : String(a))
  const lagerVariant = (v: any) => fmtLager(((v && v.metadata) || {}).antal)
  const lagerProdukt = (r: any) => {
  const vs = r.variants || []
  if (vs.length > 1) {
  const nums = vs.map((v: any) => Number(((v.metadata || {}).antal ?? ""))).filter((n: number) => Number.isFinite(n))
  return nums.length ? String(nums.reduce((s: number, n: number) => s + n, 0)) : "—"
  }
  const m = r.metadata || {}
  const vm = ((vs[0] || {}).metadata) || {}
  return fmtLager(m.antal ?? m.stock ?? vm.antal)
  }
  const variantText = (v: any, r: any) => {
  const opts = v.options || []
  if (!opts.length) return v.title || ""
  return opts.map((o: any) => { const ot = (r.options || []).find((x: any) => x.id === o.option_id); return (ot ? ot.title : "Val") + ": " + o.value }).join(", ")
  }
  const catName = (row: any) => (row.categories || []).map((c: any) => c.name).join(", ") || "—"
  const GRID = "1px solid #d4d4d4"
  const th: any = { borderBottom: "1px solid #aaa", borderRight: "1px solid #bbb", padding: "4px 8px", fontWeight: 700, fontSize: "12px", lineHeight: 1.3, textAlign: "left", background: "#cccccc", color: "#222", position: "sticky", top: 0, zIndex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }
  const td: any = { borderBottom: GRID, borderRight: GRID, padding: "4px 8px", fontSize: "13px", lineHeight: 1.3, verticalAlign: "middle", overflow: "hidden" }
  const tdLast: any = { ...td, borderRight: "none" }
  const tdOne: any = { ...td, whiteSpace: "nowrap", textOverflow: "ellipsis" }
  const tdNum: any = { ...tdOne, textAlign: "right", padding: "4px 6px", fontVariantNumeric: "tabular-nums" }
  const clamp2: any = { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", overflowWrap: "anywhere" }
  const lnk: any = { color: "#0060cc", textDecoration: "none" }
  const sep = <span style={{ color: "#bbb", margin: "0 3px" }}>|</span>
  const dot = (c: string) => <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: c, marginRight: "3px", verticalAlign: "middle", position: "relative", top: "-1px" }} />
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

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px", fontSize: "12px" }}>
          <a href={`${ADMIN}/produkt-form`} style={{ color: "#0060cc" }}>＋ Lägg in ny produkt</a>
          <span style={{ color: "#bbb" }}>|</span>
          <a href={`${ADMIN}/hantera-produkter?action=copy`} style={{ color: "#0060cc" }}>Kopiera produkt</a>
          <span style={{ color: "#bbb" }}>|</span>
          <a href={`${ADMIN}/produktsortering`} style={{ color: "#0060cc" }}>Produktsortering</a>
          <span style={{ color: "#bbb" }}>|</span>
          <a href={`${ADMIN}/hantera-produkter?action=filter`} style={{ color: "#0060cc" }}>Produktfiltrering</a>
        </div>

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

        <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "75vh", border: "1px solid #bbb" }}>
        <table style={{ width: "100%", minWidth: "760px", borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed", fontFamily: WF }}>
          <colgroup>
            <col style={{ width: "28px" }} />
            <col />
            <col style={{ width: "95px" }} />
            <col style={{ width: "52px" }} />
            <col style={{ width: "84px" }} />
            <col style={{ width: "140px" }} />
            <col style={{ width: "336px" }} />
          </colgroup>
          <thead><tr>
            <th style={{ ...th, textAlign: "center", padding: "4px 0" }}><input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ margin: 0, verticalAlign: "middle" }} /></th>
            <th style={th}>Namn</th><th style={th}>Art.nr</th><th style={{ ...th, textAlign: "right", padding: "4px 6px" }}>Lager</th><th style={th}>Status</th>
            <th style={th}>Varugrupp</th><th style={{ ...th, borderRight: "none" }}>Verktyg</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={7} style={{ ...tdLast, textAlign: "center", color: "#666" }}>{busy ? "Hämtar…" : "Inga produkter."}</td></tr> :
              rows.map((r, i) => (<Fragment key={r.id}>
                <tr key={r.id} style={{ background: checked[r.id] ? "#fffbe6" : i % 2 ? "#f7f7f7" : "#fff" }}>
                  <td style={{ ...td, textAlign: "center", padding: "4px 0" }}><input type="checkbox" checked={!!checked[r.id]} onChange={(e) => setChecked({ ...checked, [r.id]: e.target.checked })} style={{ margin: 0, verticalAlign: "middle" }} /></td>
                  <td style={td} title={r.title}>
                    <div style={clamp2}><a href={`${ADMIN}/products/${r.id}`} style={lnk}>{r.title}</a></div>
                    {(r.variants || []).length > 1 && <div style={{ fontSize: "11px", color: "#888", lineHeight: 1.2 }}>{(r.variants || []).length} varianter</div>}
                  </td>
                  <td style={{ ...tdOne, fontSize: "12px" }} title={(r.variants || [])[0]?.sku || ""}>{(r.variants || [])[0]?.sku || "—"}</td>
                  <td style={tdNum}>{lagerProdukt(r)}</td>
                  <td style={{ ...tdOne, fontSize: "11px", padding: "4px 6px" }} title={r.status === "published" ? "Publicerad" : "Utkast"}>{r.status === "published" ? <span style={{ color: "#1d7f4e" }}>{dot("#2a7")}Publicerad</span> : <span style={{ color: "#8a5a00" }}>{dot("#e0a000")}Utkast</span>}</td>
                  <td style={{ ...tdOne, fontSize: "12px", color: "#444" }} title={catName(r)}>{catName(r)}</td>
                  <td style={{ ...tdLast, whiteSpace: "nowrap", fontSize: "12px" }}>
                    <a href={`${ADMIN}/produkt-form?id=${r.id}`} style={lnk}>Redigera</a>{sep}
                    <a href={`${ADMIN}/valalternativ?id=${r.id}`} style={lnk}>Valalternativ</a>{sep}
                    <a href={`${ADMIN}/associera?id=${r.id}`} style={lnk}>Associera</a>{sep}
                    <a href={`${ADMIN}/hantera-produkter?action=copy&id=${r.id}`} style={lnk}>Kopiera</a>{sep}
                    <a href="#" onClick={(e) => { e.preventDefault(); if (!busy) taBortProdukt(r) }} style={{ ...lnk, color: "#c0392b" }}>Ta bort</a>
                  </td>
                </tr>
                {(r.variants || []).length > 1 && (r.variants || []).map((v: any) => (
                <tr key={v.id} style={{ background: "#f4f7fb" }}>
                <td style={{ ...td, padding: "3px 0" }}></td>
                <td style={{ ...td, padding: "3px 8px 3px 22px", color: "#555", fontSize: "12px" }} title={variantText(v, r) || v.title || r.title}><div style={clamp2}>↳ {variantText(v, r) || v.title || r.title}</div></td>
                <td style={{ ...tdOne, padding: "3px 8px", fontSize: "12px", color: "#555" }} title={v.sku || ""}>{v.sku || "—"}</td>
                <td style={{ ...tdNum, padding: "3px 6px", fontSize: "12px" }}>{lagerVariant(v)}</td>
                <td style={{ ...td, padding: "3px 8px" }}></td>
                <td style={{ ...td, padding: "3px 8px" }}></td>
                <td style={{ ...tdLast, padding: "3px 8px", whiteSpace: "nowrap", fontSize: "12px" }}><a href={`${ADMIN}/valalternativ?id=${r.id}`} style={lnk}>Valalternativ</a></td>
                </tr>
                ))}
                </Fragment>
              ))}
          </tbody>
        </table>
        </div>

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

function HanteraProdukterPage() {
  const action = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("action") : ""
  return action === "copy" ? <CopyPage /> : <GridPage />
}

export const config = defineRouteConfig({ label: "Hantera produkter", icon: BoxIcon })
export default HanteraProdukterPage
