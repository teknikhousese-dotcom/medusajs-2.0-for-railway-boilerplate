import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

/**
 * Teknikhouse.se — Nyheter (1:1 mirror of Wikinggruppen news.php)
 * News-article CMS: list + create/edit (title, slug, date, image, published, HTML body).
 * Raw-SQL table news_article under /admin/news (single dispatch route).
 */
const NewsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2" />
    <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6z" />
  </svg>
)
async function jget(u: string) { return fetch(u, { credentials: "include" }).then((r) => r.json()) }
async function jsend(u: string, m: string, b?: any) { return fetch(u, { method: m, credentials: "include", headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined }).then((r) => r.json()) }

function NyheterPage() {
  const [meta, setMeta] = useState<{ online: number | null; unread: number }>({ online: null, unread: 0 })
  const [articles, setArticles] = useState<any[]>([])
  const [note, setNote] = useState("")
  const [edit, setEdit] = useState<any>(null)
  const empty = { id: "", title: "", slug: "", article_date: "", body: "", image_url: "", published: true }

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
    try { const d = await jget("/admin/news"); setArticles(d.articles || []) } catch {}
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!edit.title.trim()) { setNote("Ange en rubrik."); return }
    const body: any = { title: edit.title, slug: edit.slug, article_date: edit.article_date || null, body: edit.body, image_url: edit.image_url, published: edit.published }
    if (edit.id) { const r = await jsend("/admin/news", "POST", { kind: "update", id: edit.id, ...body }); if (r.article) { setNote("Nyhet sparad."); setEdit(null); load() } }
    else { const r = await jsend("/admin/news", "POST", { kind: "new", ...body }); if (r.article) { setNote("Nyhet skapad."); setEdit(null); load() } else setNote("Kunde inte spara.") }
  }
  const del = async (a: any) => { if (!confirm(`Ta bort nyheten "${a.title}"?`)) return; await jsend("/admin/news", "POST", { kind: "delete", id: a.id }); load() }
  const fmtDate = (d: any) => d ? String(d).slice(0, 10) : "—"
  const excerpt = (h: string) => (h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120)

  const btn: any = { fontFamily: WF, fontSize: "12px", padding: "5px 16px", border: "1px solid #999", borderRadius: "3px", background: "#f0f0f0", cursor: "pointer" }
  const inp: any = { fontFamily: WF, fontSize: "12px", padding: "4px 6px", border: "1px solid #bbb", borderRadius: "2px" }
  const th: any = { border: "1px solid #bbb", padding: "6px 8px", fontWeight: 700, fontSize: "11px", textAlign: "left", background: "#cccccc" }
  const td: any = { border: "1px solid #e2e2e2", padding: "5px 8px", fontSize: "12px", verticalAlign: "top" }
  const set = (k: string) => (e: any) => setEdit({ ...edit, [k]: e.target.value })

  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny online={meta.online} unread={meta.unread} active="Nyheter" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px" }}>
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>📰</span>
          <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>NYHETER</span>
        </div>
        <p style={{ fontSize: "12px", color: "#333", margin: "0 0 10px", maxWidth: "720px" }}>Här kan du skapa nyhetsartiklar för att presentera intressanta nyheter inom butiken. Du kan koppla en bild till varje nyhet, samt göra kopplingar till butikens produkter.</p>
        {note && <div style={{ fontSize: "12px", color: "#036", marginBottom: "10px" }}>{note}</div>}

        {edit ? (
          <div style={{ maxWidth: "760px" }}>
            <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "10px" }}>{edit.id ? "Redigera nyhet" : "Skapa ny nyhet"}</div>
            <table style={{ borderCollapse: "collapse", marginBottom: "8px" }}><tbody>
              <tr><td style={{ ...td, border: "none", textAlign: "right", paddingRight: "10px" }}>Rubrik</td><td style={{ ...td, border: "none" }}><input style={{ ...inp, width: "420px" }} value={edit.title} onChange={set("title")} /></td></tr>
              <tr><td style={{ ...td, border: "none", textAlign: "right", paddingRight: "10px" }}>URL (slug)</td><td style={{ ...td, border: "none" }}><input style={{ ...inp, width: "420px" }} value={edit.slug} onChange={set("slug")} placeholder="lämna tom för auto" /></td></tr>
              <tr><td style={{ ...td, border: "none", textAlign: "right", paddingRight: "10px" }}>Datum</td><td style={{ ...td, border: "none" }}><input style={{ ...inp, width: "140px" }} value={edit.article_date || ""} onChange={set("article_date")} placeholder="ÅÅÅÅ-MM-DD" /></td></tr>
              <tr><td style={{ ...td, border: "none", textAlign: "right", paddingRight: "10px" }}>Bild (URL)</td><td style={{ ...td, border: "none" }}><input style={{ ...inp, width: "420px" }} value={edit.image_url || ""} onChange={set("image_url")} /></td></tr>
              <tr><td style={{ ...td, border: "none", textAlign: "right", paddingRight: "10px" }}>Publicerad</td><td style={{ ...td, border: "none" }}><input type="checkbox" checked={!!edit.published} onChange={(e) => setEdit({ ...edit, published: e.target.checked })} /></td></tr>
            </tbody></table>
            <div style={{ fontSize: "12px", fontWeight: 700, margin: "4px 0" }}>Innehåll (HTML)</div>
            <textarea style={{ ...inp, width: "100%", height: "300px", boxSizing: "border-box", fontFamily: "Menlo, Consolas, monospace" }} value={edit.body || ""} onChange={set("body")} />
            <div style={{ marginTop: "10px" }}>
              <button style={btn} onClick={save}>Spara</button>
              <button style={{ ...btn, marginLeft: "8px", background: "#fff" }} onClick={() => { setEdit(null); setNote("") }}>Avbryt</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: "10px" }}><button style={btn} onClick={() => setEdit({ ...empty })}>Skapa ny nyhet »</button></div>
            <div style={{ fontWeight: 700, fontSize: "13px", background: "#e2e2e2", padding: "5px 10px", borderRadius: "3px", margin: "6px 0" }}>Befintliga nyheter</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={{ ...th, width: "100px" }}>Datum</th><th style={th}>Rubrik</th><th style={{ ...th, width: "90px" }}>Status</th><th style={{ ...th, width: "130px" }}></th></tr></thead>
              <tbody>{articles.length === 0 ? <tr><td colSpan={4} style={{ ...td, textAlign: "center", color: "#666" }}>Inga nyheter ännu.</td></tr> :
                articles.map((a) => (<tr key={a.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={td}>{fmtDate(a.article_date)}</td>
                  <td style={td}><b>{a.title}</b><div style={{ color: "#777", fontSize: "11px", marginTop: "2px" }}>{excerpt(a.body)}{(a.body || "").length > 120 ? "…" : ""}</div></td>
                  <td style={td}>{a.published ? <span style={{ color: "#2a7" }}>Publicerad</span> : <span style={{ color: "#a70" }}>Dold</span>}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setEdit({ ...empty, ...a, article_date: fmtDate(a.article_date) === "—" ? "" : fmtDate(a.article_date), published: !!a.published }) }} style={{ color: "#0060cc" }}>Redigera</a>
                    <span style={{ color: "#bbb" }}> | </span>
                    <a href="#" onClick={(e) => { e.preventDefault(); del(a) }} style={{ color: "#a00" }}>Ta bort</a>
                  </td>
                </tr>))}</tbody>
            </table>
            <div style={{ marginTop: "10px", fontSize: "12px" }}>Totalt: <b>{articles.length}</b> nyheter.</div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "12px" }}>
          <a href={`${ADMIN}/kontrollpanel`} style={{ color: "#0060cc" }}>◄ Till kontrollpanelen</a>
        </div>
      </div>
    </div>
  )
}
export const config = defineRouteConfig({ label: "Nyheter", icon: NewsIcon })
export default NyheterPage
