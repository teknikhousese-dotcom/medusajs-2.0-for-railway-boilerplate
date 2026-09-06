import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny, jget, jsend } from "../../lib/butikadmin"

/**
 * Teknikhouse.se â Ordning pÃ¥ varugrupperna (mirror of categories.php?sort=1).
 * Pick a nivÃ¥ (ToppnivÃ¥ or a parent group), then drag its varugrupper into the
 * order they should appear in. Saves rank (0 = first) on each category via
 * /admin/wiki-sort. No route-config label â stays out of Medusa's native sidebar.
 */
type Cat = { id: string; name: string; parent_category_id: string | null; rank: number }

function VarugruppersorteringPage() {
  const [all, setAll] = useState<Cat[]>([])
  const [parent, setParent] = useState<string>("root")
  const [rows, setRows] = useState<Cat[]>([])
  const [dragIx, setDragIx] = useState<number | null>(null)
  const [overIx, setOverIx] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")

  const loadAll = async () => {
    const d = await jget(`${"/admin"}/product-categories?limit=2000&fields=id,name,parent_category_id,rank`).catch(() => ({}))
    setAll((d.product_categories || []).map((c: any) => ({ id: c.id, name: c.name, parent_category_id: c.parent_category_id || null, rank: Number(c.rank ?? 0) })))
  }
  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    const pid = parent === "root" ? null : parent
    const kids = all.filter((c) => (c.parent_category_id || null) === pid).slice().sort((a, b) => (a.rank - b.rank) || a.name.localeCompare(b.name, "sv"))
    setRows(kids); setMsg("")
  }, [parent, all])

  // parents that actually have children, for the level selector
  const byId: any = {}; all.forEach((c) => (byId[c.id] = c))
  const label = (c: Cat) => { const chain = [c.name]; let p = c.parent_category_id; let g = 0; while (p && byId[p] && g++ < 6) { chain.unshift(byId[p].name); p = byId[p].parent_category_id }; return chain.join(" âº ") }
  const parentsWithKids = all.filter((c) => all.some((x) => x.parent_category_id === c.id)).map((c) => ({ id: c.id, label: label(c) })).sort((a, b) => a.label.localeCompare(b.label, "sv"))

  const onDrop = (target: number) => {
    if (dragIx === null || dragIx === target) { setDragIx(null); setOverIx(null); return }
    const next = rows.slice(); const [m] = next.splice(dragIx, 1); next.splice(target, 0, m)
    setRows(next); setDragIx(null); setOverIx(null)
  }
  const move = (i: number, dir: -1 | 1) => { const j = i + dir; if (j < 0 || j >= rows.length) return; const n = rows.slice();[n[i], n[j]] = [n[j], n[i]]; setRows(n) }

  const save = async () => {
    if (!rows.length) return
    setBusy(true); setMsg("Sparar ordningâ¦")
    try {
      const r = await jsend(`${"/admin"}/wiki-sort`, "POST", { type: "categories", ids: rows.map((c) => c.id) })
      setMsg(r.ok ? `â Ordningen sparad (${r.updated} varugrupper).` : "Fel: " + (r.error || ""))
      await loadAll()
    } catch (e: any) { setMsg("Fel: " + String((e && e.message) || e)) }
    setBusy(false)
  }

  const btn: any = { fontFamily: WF, fontSize: "12px", padding: "5px 14px", border: "1px solid #999", borderRadius: "3px", background: "#f0f0f0", cursor: "pointer" }
  const inp: any = { fontFamily: WF, fontSize: "12px", padding: "5px 8px", border: "1px solid #bbb", borderRadius: "3px" }

  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny active="Hantera Varugrupper" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px", maxWidth: "720px" }}>
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>ðï¸</span>
          <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>HANTERA VARUGRUPPER â ORDNING</span>
        </div>
        <p style={{ fontSize: "12px", color: "#444", margin: "0 0 12px" }}>VÃ¤lj nivÃ¥ och dra varugrupperna till Ã¶nskad ordning. Ordningen styr hur de visas i menyer och listningar. Klicka <b>Spara ordning</b> nÃ¤r du Ã¤r klar.</p>

        <label style={{ fontSize: "12px", fontWeight: 700 }}>NivÃ¥:&nbsp;
          <select style={{ ...inp, minWidth: "320px" }} value={parent} onChange={(e) => setParent(e.target.value)}>
            <option value="root">ToppnivÃ¥ (huvudvarugrupper)</option>
            {parentsWithKids.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>

        {msg && <div style={{ fontSize: "12px", margin: "10px 0", color: msg.startsWith("Fel") ? "#a00" : "#256029" }}>{msg}</div>}

        <ul style={{ listStyle: "none", padding: 0, margin: "14px 0", border: "1px solid #ddd", borderRadius: "5px" }}>
          {rows.length === 0 ? <li style={{ padding: "10px", fontSize: "12px", color: "#666" }}>Inga varugrupper pÃ¥ denna nivÃ¥.</li> :
            rows.map((c, i) => (
              <li key={c.id}
                draggable
                onDragStart={() => setDragIx(i)}
                onDragOver={(e) => { e.preventDefault(); setOverIx(i) }}
                onDrop={() => onDrop(i)}
                onDragEnd={() => { setDragIx(null); setOverIx(null) }}
                style={{
                  display: "flex", alignItems: "center", gap: "10px", padding: "7px 10px",
                  borderBottom: "1px solid #eee", cursor: "grab", fontSize: "12px",
                  background: overIx === i && dragIx !== null ? "#e8f0fe" : dragIx === i ? "#fffbe6" : "#fff",
                }}>
                <span style={{ color: "#999", fontSize: "15px" }}>â ¿</span>
                <span style={{ width: "26px", color: "#999", textAlign: "right" }}>{i + 1}.</span>
                <span style={{ flex: 1, fontWeight: 700 }}>{c.name}</span>
                <span style={{ whiteSpace: "nowrap" }}>
                  <a onClick={() => move(i, -1)} style={{ cursor: "pointer", color: i === 0 ? "#ccc" : "#06c", padding: "0 4px" }}>â²</a>
                  <a onClick={() => move(i, 1)} style={{ cursor: "pointer", color: i === rows.length - 1 ? "#ccc" : "#06c", padding: "0 4px" }}>â¼</a>
                </span>
              </li>
            ))}
        </ul>

        {rows.length > 0 && (
          <div><button style={{ ...btn, background: "#2e7d32", color: "#fff", border: "1px solid #2e7d32" }} onClick={save} disabled={busy}>Spara ordning</button></div>
        )}
        <div style={{ textAlign: "center", marginTop: "18px", fontSize: "12px" }}>
          <a href={`${ADMIN}/varugrupper`} style={{ color: "#0060cc" }}>â Till Varugrupper</a>
        </div>
      </div>
    </div>
  )
}

export default VarugruppersorteringPage
