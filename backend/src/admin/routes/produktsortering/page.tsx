import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny, jget, jsend } from "../../lib/butikadmin"

/**
 * Teknikhouse.se — Produktsortering (mirror of products.php?action=sorting).
 * Pick a varugrupp, then drag the products into the order they should appear in.
 * Saves metadata.sort_order (0 = first) on every product via /admin/wiki-sort.
 * No route-config label, so it stays out of Medusa's native sidebar — reached
 * from the Snabbmeny / Hantera produkter.
 */
type Prod = { id: string; title: string; thumbnail?: string; sku?: string }

function ProduktsorteringPage() {
  const [cats, setCats] = useState<any[]>([])
  const [catId, setCatId] = useState("")
  const [rows, setRows] = useState<Prod[]>([])
  const [dragIx, setDragIx] = useState<number | null>(null)
  const [overIx, setOverIx] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    jget(`${"/admin"}/product-categories?limit=1000&fields=id,name,parent_category_id,rank`).then((d) => {
      const list = (d.product_categories || []).slice()
      // build indented labels (parent > child)
      const byId: any = {}; list.forEach((c: any) => (byId[c.id] = c))
      const label = (c: any) => {
        const chain = [c.name]; let p = c.parent_category_id
        let guard = 0
        while (p && byId[p] && guard++ < 6) { chain.unshift(byId[p].name); p = byId[p].parent_category_id }
        return chain.join(" › ")
      }
      const opts = list.map((c: any) => ({ id: c.id, label: label(c) })).sort((a: any, b: any) => a.label.localeCompare(b.label, "sv"))
      setCats(opts)
    }).catch(() => {})
  }, [])

  const load = async (id: string) => {
    setCatId(id); setMsg(""); setRows([])
    if (!id) return
    setBusy(true)
    try {
      const d = await jget(`${"/admin"}/products?category_id=${id}&limit=300&fields=id,title,thumbnail,metadata,*variants`)
      const ps: Prod[] = (d.products || []).map((p: any) => ({ id: p.id, title: p.title, thumbnail: p.thumbnail, sku: (p.variants || [])[0]?.sku, _o: Number((p.metadata || {}).sort_order ?? 99999) }))
      ps.sort((a: any, b: any) => (a._o - b._o) || a.title.localeCompare(b.title, "sv"))
      setRows(ps)
    } catch { setMsg("Kunde inte hämta produkter.") }
    setBusy(false)
  }

  const onDrop = (target: number) => {
    if (dragIx === null || dragIx === target) { setDragIx(null); setOverIx(null); return }
    const next = rows.slice()
    const [moved] = next.splice(dragIx, 1)
    next.splice(target, 0, moved)
    setRows(next); setDragIx(null); setOverIx(null)
  }
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= rows.length) return
    const next = rows.slice();[next[i], next[j]] = [next[j], next[i]]; setRows(next)
  }

  const save = async () => {
    if (!rows.length) return
    setBusy(true); setMsg("Sparar ordning…")
    try {
      const r = await jsend(`${"/admin"}/wiki-sort`, "POST", { type: "products", ids: rows.map((p) => p.id) })
      setMsg(r.ok ? `✔ Ordningen sparad (${r.updated} produkter).` : "Fel: " + (r.error || ""))
    } catch (e: any) { setMsg("Fel: " + String((e && e.message) || e)) }
    setBusy(false)
  }

  const btn: any = { fontFamily: WF, fontSize: "12px", padding: "5px 14px", border: "1px solid #999", borderRadius: "3px", background: "#f0f0f0", cursor: "pointer" }
  const inp: any = { fontFamily: WF, fontSize: "12px", padding: "5px 8px", border: "1px solid #bbb", borderRadius: "3px" }

  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny active="Hantera produkter" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px", maxWidth: "720px" }}>
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>↕️</span>
          <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>PRODUKTSORTERING</span>
        </div>
        <p style={{ fontSize: "12px", color: "#444", margin: "0 0 12px" }}>Välj en varugrupp och dra produkterna till den ordning de ska visas i butiken. Klicka <b>Spara ordning</b> när du är klar.</p>

        <label style={{ fontSize: "12px", fontWeight: 700 }}>Varugrupp:&nbsp;
          <select style={{ ...inp, minWidth: "320px" }} value={catId} onChange={(e) => load(e.target.value)}>
            <option value="">Välj en varugrupp…</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>

        {msg && <div style={{ fontSize: "12px", margin: "10px 0", color: msg.startsWith("Fel") || msg.startsWith("Kunde") ? "#a00" : "#256029" }}>{msg}</div>}

        <ul style={{ listStyle: "none", padding: 0, margin: "14px 0", border: catId ? "1px solid #ddd" : "none", borderRadius: "5px" }}>
          {busy && !rows.length ? <li style={{ padding: "10px", fontSize: "12px", color: "#666" }}>Hämtar…</li> :
            !catId ? null :
              rows.length === 0 ? <li style={{ padding: "10px", fontSize: "12px", color: "#666" }}>Inga produkter i varugruppen.</li> :
                rows.map((p, i) => (
                  <li key={p.id}
                    draggable
                    onDragStart={() => setDragIx(i)}
                    onDragOver={(e) => { e.preventDefault(); setOverIx(i) }}
                    onDrop={() => onDrop(i)}
                    onDragEnd={() => { setDragIx(null); setOverIx(null) }}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px", padding: "6px 10px",
                      borderBottom: "1px solid #eee", cursor: "grab", fontSize: "12px",
                      background: overIx === i && dragIx !== null ? "#e8f0fe" : dragIx === i ? "#fffbe6" : "#fff",
                    }}>
                    <span style={{ color: "#999", cursor: "grab", fontSize: "15px" }}>⠿</span>
                    <span style={{ width: "26px", color: "#999", textAlign: "right" }}>{i + 1}.</span>
                    {p.thumbnail ? <img src={p.thumbnail} style={{ width: "30px", height: "30px", objectFit: "cover", borderRadius: "3px" }} /> : <span style={{ width: "30px" }} />}
                    <span style={{ flex: 1 }}>{p.title}</span>
                    <span style={{ color: "#999" }}>{p.sku || ""}</span>
                    <span style={{ whiteSpace: "nowrap" }}>
                      <a onClick={() => move(i, -1)} style={{ cursor: "pointer", color: i === 0 ? "#ccc" : "#06c", padding: "0 4px" }}>▲</a>
                      <a onClick={() => move(i, 1)} style={{ cursor: "pointer", color: i === rows.length - 1 ? "#ccc" : "#06c", padding: "0 4px" }}>▼</a>
                    </span>
                  </li>
                ))}
        </ul>

        {rows.length > 0 && (
          <div><button style={{ ...btn, background: "#2e7d32", color: "#fff", border: "1px solid #2e7d32" }} onClick={save} disabled={busy}>Spara ordning</button></div>
        )}
        <div style={{ textAlign: "center", marginTop: "18px", fontSize: "12px" }}>
          <a href={`${ADMIN}/hantera-produkter`} style={{ color: "#0060cc" }}>◄ Till Hantera produkter</a>
        </div>
      </div>
    </div>
  )
}

export default ProduktsorteringPage
