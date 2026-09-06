import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

const FolderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)

function VarugrupperPage() {
  const [cats, setCats] = useState<any[]>([])
  const [filter, setFilter] = useState("")
  const [edit, setEdit] = useState<any>(null)
  const [msg, setMsg] = useState("")
  const [sortMode, setSortMode] = useState(false)
  const [nyOpen, setNyOpen] = useState(false)
  const [ny, setNy] = useState<any>({ name: "", handle: "", parent_category_id: "", is_active: true, description: "" })

  const load = async () => {
    const j = await fetch("/admin/wiki-categories", { credentials: "include" }).then((r) => r.json()).catch(() => ({ categories: [] }))
    setCats(j.categories || [])
  }
  useEffect(() => {
    const u = new URL(window.location.href)
    if (u.searchParams.get("action") === "new") setNyOpen(true)
    if (u.searchParams.get("sort")) setSortMode(true)
    load()
  }, [])

  const post = async (payload: any) => {
    const r = await fetch("/admin/wiki-categories", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    return r.json()
  }
  const skapa = async () => {
    if (!ny.name.trim()) { setMsg("Fel: Namn krävs."); return }
    const j = await post({ kind: "new", ...ny })
    if (j.ok) { setMsg("✔ Varugrupp skapad."); setNy({ name: "", handle: "", parent_category_id: "", is_active: true, description: "" }); setNyOpen(false); await load() }
    else setMsg("Fel: " + (j.error || "kunde inte skapa"))
  }
  const spara = async () => {
    const j = await post({ kind: "update", id: edit.id, metadata: edit.metadata, name: edit.name, handle: edit.handle, parent_category_id: edit.parent_category_id || "", is_active: edit.is_active, description: edit.description, seo_title: (edit.metadata || {}).seo_title || "", seo_desc: (edit.metadata || {}).seo_desc || "", google_category: (edit.metadata || {}).google_category || "" })
    if (j.ok) { setMsg("✔ Sparad."); setEdit(null); await load() } else setMsg("Fel: " + (j.error || "kunde inte spara"))
  }
  const remove = async (c: any) => { if (!confirm("Ta bort varugruppen \"" + c.name + "\"?")) return; const j = await post({ kind: "delete", id: c.id }); if (j.ok) { setMsg("Varugrupp borttagen."); await load() } else setMsg("Fel: " + (j.error || "kunde inte ta bort")) }
  const saveRanks = async () => { const j = await post({ kind: "rank", items: cats.map((c) => ({ id: c.id, rank: c.rank })) }); if (j.ok) { setMsg("✔ Ordning sparad."); await load() } else setMsg("Fel: " + (j.error || "")) }

  const shown = filter ? cats.filter((c) => c.label.toLowerCase().includes(filter.toLowerCase())) : cats
  const th: any = { textAlign: "left", padding: "6px 10px", borderBottom: "2px solid #ccc", fontSize: "12px" }
  const td: any = { padding: "6px 10px", borderBottom: "1px solid #eee", fontSize: "12px" }
  const inp: any = { padding: "5px 7px", border: "1px solid #bbb", borderRadius: "3px", fontSize: "12px", fontFamily: WF, width: "100%", boxSizing: "border-box" }
  const btn: any = { padding: "6px 13px", background: "#4a90d9", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "12px" }
  const lnk: any = { color: "#06c", cursor: "pointer", marginRight: "10px" }
  const lbl: any = { fontSize: "11px", color: "#666", margin: "8px 0 2px", display: "block" }

  return (
    <div style={{ display: "flex", fontFamily: WF }}>
      <Snabbmeny active="Hantera Varugrupper" />
      <div style={{ flex: 1 }}>
        <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", margin: "0 0 12px" }}>
          <div style={{ background: "#f4f4f4", borderBottom: "1px solid #ddd", padding: "10px 16px", fontWeight: 700, fontSize: "14px" }}>🗂️ Hantera Varugrupper</div>
          <div style={{ padding: "16px" }}>
            {msg && <div style={{ padding: "8px 10px", marginBottom: "10px", borderRadius: "3px", background: msg.startsWith("Fel") ? "#fdecea" : "#e8f5e9", color: msg.startsWith("Fel") ? "#a00" : "#256029", fontSize: "12px" }}>{msg}</div>}

            <div style={{ marginBottom: "10px" }}>
              <button style={btn} onClick={() => setNyOpen(!nyOpen)}>+ Ny varugrupp</button>
              <button style={{ ...btn, marginLeft: "8px", background: sortMode ? "#2e7d32" : "#888" }} onClick={() => setSortMode(!sortMode)}>{sortMode ? "Avsluta ordning" : "Ordning på varugrupperna"}</button>
              {sortMode && <button style={{ ...btn, marginLeft: "8px", background: "#2e7d32" }} onClick={saveRanks}>Spara ordning</button>}
            </div>

            {nyOpen && (
              <div style={{ border: "1px solid #ddd", borderRadius: "4px", padding: "12px", background: "#fafafa", marginBottom: "12px" }}>
                <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "4px" }}>Ny varugrupp</div>
                <label style={lbl}>Namn</label>
                <input style={inp} value={ny.name} onChange={(e) => setNy({ ...ny, name: e.target.value })} />
                <label style={lbl}>URL-handle (lämna tomt = auto)</label>
                <input style={inp} value={ny.handle} onChange={(e) => setNy({ ...ny, handle: e.target.value })} />
                <label style={lbl}>Överordnad varugrupp</label>
                <select style={inp} value={ny.parent_category_id} onChange={(e) => setNy({ ...ny, parent_category_id: e.target.value })}>
                  <option value="">(Ingen – toppnivå)</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <label style={{ ...lbl, display: "inline-block" }}><input type="checkbox" checked={ny.is_active} onChange={(e) => setNy({ ...ny, is_active: e.target.checked })} /> Aktiv</label>
                <div style={{ marginTop: "8px" }}><button style={{ ...btn, background: "#2e7d32" }} onClick={skapa}>Skapa</button><a style={{ ...lnk, marginLeft: "10px" }} onClick={() => setNyOpen(false)}>Avbryt</a></div>
              </div>
            )}

            <input style={{ ...inp, maxWidth: "360px", marginBottom: "8px" }} placeholder="Sök varugrupp…" value={filter} onChange={(e) => setFilter(e.target.value)} />
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{sortMode && <th style={{ ...th, width: "70px" }}>Ordning</th>}<th style={th}>Varugrupp</th><th style={{ ...th, width: "80px" }}>Status</th><th style={{ ...th, width: "150px" }}>Åtgärd</th></tr></thead>
              <tbody>
                {shown.length === 0 ? <tr><td colSpan={4} style={{ ...td, textAlign: "center", color: "#999" }}>Laddar…</td></tr> :
                  shown.map((c) => (
                    <tr key={c.id}>
                      {sortMode && <td style={td}><input style={{ ...inp, width: "56px" }} value={c.rank} onChange={(e) => setCats(cats.map((x) => x.id === c.id ? { ...x, rank: e.target.value } : x))} /></td>}
                      <td style={td}>{c.label}</td>
                      <td style={td}>{c.is_active ? <span style={{ color: "#2e7d32" }}>Aktiv</span> : <span style={{ color: "#a00" }}>Dold</span>}</td>
                      <td style={td}><a style={lnk} onClick={() => { setEdit({ ...c }); setMsg("") }}>Ändra</a><a style={{ ...lnk, color: "#a00" }} onClick={() => remove(c)}>Ta bort</a></td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {edit && (
              <div style={{ marginTop: "16px", border: "1px solid #ddd", borderRadius: "4px", padding: "12px", background: "#fafafa" }}>
                <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "4px" }}>Redigera: {edit.name}</div>
                <label style={lbl}>Namn</label>
                <input style={inp} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                <label style={lbl}>URL-handle</label>
                <input style={inp} value={edit.handle} onChange={(e) => setEdit({ ...edit, handle: e.target.value })} />
                <label style={lbl}>Överordnad varugrupp</label>
                <select style={inp} value={edit.parent_category_id} onChange={(e) => setEdit({ ...edit, parent_category_id: e.target.value })}>
                  <option value="">(Ingen – toppnivå)</option>
                  {cats.filter((c) => c.id !== edit.id).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <label style={{ ...lbl, display: "inline-block" }}><input type="checkbox" checked={edit.is_active} onChange={(e) => setEdit({ ...edit, is_active: e.target.checked })} /> Aktiv (visas i butiken)</label>
                <label style={lbl}>Beskrivning</label>
                <textarea style={{ ...inp, height: "80px" }} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
                <label style={{ ...lbl, display: "inline-block", marginRight: "16px" }}><input type="checkbox" checked={(edit.metadata || {}).is_featured === "1"} onChange={(e) => setEdit({ ...edit, metadata: { ...(edit.metadata || {}), is_featured: e.target.checked ? "1" : "" } })} /> Utvald varugrupp</label><label style={{ ...lbl, display: "inline-block", marginRight: "16px" }}><input type="checkbox" checked={(edit.metadata || {}).startpage_dropdown === "1"} onChange={(e) => setEdit({ ...edit, metadata: { ...(edit.metadata || {}), startpage_dropdown: e.target.checked ? "1" : "" } })} /> Visa i menyn på startsidan</label><label style={lbl}>Kategoribild (URL)</label><input style={inp} value={(edit.metadata || {}).image || ""} onChange={(e) => setEdit({ ...edit, metadata: { ...(edit.metadata || {}), image: e.target.value } })} /><label style={lbl}>H1-rubrik</label><input style={inp} value={(edit.metadata || {}).h1 || ""} onChange={(e) => setEdit({ ...edit, metadata: { ...(edit.metadata || {}), h1: e.target.value } })} /><label style={lbl}>Beskrivning 2</label><textarea style={{ ...inp, height: "60px" }} value={(edit.metadata || {}).description2 || ""} onChange={(e) => setEdit({ ...edit, metadata: { ...(edit.metadata || {}), description2: e.target.value } })} /><label style={lbl}>Beskrivning 3</label><textarea style={{ ...inp, height: "60px" }} value={(edit.metadata || {}).description3 || ""} onChange={(e) => setEdit({ ...edit, metadata: { ...(edit.metadata || {}), description3: e.target.value } })} /><label style={lbl}>Bannertext (liten)</label><input style={inp} value={(edit.metadata || {}).banner_small || ""} onChange={(e) => setEdit({ ...edit, metadata: { ...(edit.metadata || {}), banner_small: e.target.value } })} /><label style={lbl}>Bannertext (stor)</label><input style={inp} value={(edit.metadata || {}).banner_big || ""} onChange={(e) => setEdit({ ...edit, metadata: { ...(edit.metadata || {}), banner_big: e.target.value } })} />
                <label style={lbl}>Google produktkategori</label>
                <input style={inp} value={(edit.metadata || {}).google_category || ""} onChange={(e) => setEdit({ ...edit, metadata: { ...(edit.metadata || {}), google_category: e.target.value } })} />
                <label style={lbl}>Meta-titel (SEO)</label>
                <input style={inp} value={(edit.metadata || {}).seo_title || ""} onChange={(e) => setEdit({ ...edit, metadata: { ...(edit.metadata || {}), seo_title: e.target.value } })} />
                <label style={lbl}>Meta-beskrivning (SEO)</label>
                <textarea style={{ ...inp, height: "50px" }} value={(edit.metadata || {}).seo_desc || ""} onChange={(e) => setEdit({ ...edit, metadata: { ...(edit.metadata || {}), seo_desc: e.target.value } })} />
                <div style={{ marginTop: "10px" }}><button style={{ ...btn, background: "#2e7d32" }} onClick={spara}>Spara ändringar</button><a style={{ ...lnk, marginLeft: "10px" }} onClick={() => setEdit(null)}>Avbryt</a></div>
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: "12px" }}><a href={`${ADMIN}/kontrollpanel`} style={{ color: "#06c" }}>◄ Till kontrollpanelen</a></div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Varugrupper (Wiki)", icon: FolderIcon })
export default VarugrupperPage
