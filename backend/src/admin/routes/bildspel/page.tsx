import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

/**
 * Teknikhouse.se — Bildspel på 1:a sidan (1:1 mirror of Wikinggruppen slideshow.php)
 * Homepage slideshow manager: "Ny bild" upload form + "Befintliga bilder" editable cards.
 * Image via file upload (/admin/uploads) or pasted Bild-URL. Raw-SQL table home_slide
 * under /admin/slides (single dispatch route).
 */
const SlideIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
)
async function jget(u: string) { return fetch(u, { credentials: "include" }).then((r) => r.json()) }
async function jsend(u: string, m: string, b?: any) { return fetch(u, { method: m, credentials: "include", headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined }).then((r) => r.json()) }
async function uploadFile(file: File): Promise<string> {
  const fd = new FormData(); fd.append("files", file)
  const r = await fetch("/admin/uploads", { method: "POST", credentials: "include", body: fd }).then((x) => x.json()).catch(() => null)
  const f = r && (r.files || r.uploads)
  return f && f[0] ? (f[0].url || f[0].location || "") : ""
}

function BildspelPage() {
  const [meta, setMeta] = useState<{ online: number | null; unread: number }>({ online: null, unread: 0 })
  const [slides, setSlides] = useState<any[]>([])
  const [note, setNote] = useState("")
  const [nf, setNf] = useState<any>({ image_url: "", link_url: "", title: "", ingress: "", bg_color: "#ffffff", active: true })
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

  const load = async () => {
    try { const o = await jget("/admin/orders?limit=1"); setMeta((s) => ({ ...s, unread: o.count || 0 })) } catch {}
    try { const d = await jget("/admin/slides"); setSlides(d.slides || []) } catch {}
  }
  useEffect(() => { load() }, [])

  const pickFile = async (e: any, cb: (url: string) => void) => {
    const file = e.target.files && e.target.files[0]; if (!file) return
    setBusy(true); setNote("Laddar upp bild…")
    const url = await uploadFile(file); setBusy(false)
    if (url) { cb(url); setNote("Bild uppladdad.") } else { setNote("Kunde inte ladda upp bild – klistra in en Bild-URL istället.") }
  }
  const add = async () => {
    if (!nf.image_url.trim()) { setNote("Välj en bild eller ange en Bild-URL först."); return }
    const r = await jsend("/admin/slides", "POST", { kind: "new", ...nf })
    if (r.slide) { setNf({ image_url: "", link_url: "", title: "", ingress: "", bg_color: "#ffffff", active: true }); setNote("Bild tillagd."); load() }
  }
  const saveSlide = async (s: any) => { const r = await jsend("/admin/slides", "POST", { kind: "update", id: s.id, link_url: s.link_url, title: s.title, ingress: s.ingress, active: s.active }); if (r.slide) { setNote("Bild sparad.") } }
  const del = async (s: any) => { if (!confirm("Radera denna bild?")) return; await jsend("/admin/slides", "POST", { kind: "delete", id: s.id }); load() }
  const patch = (id: string, k: string, v: any) => setSlides((arr) => arr.map((x) => x.id === id ? { ...x, [k]: v } : x))

  const inp: any = { fontFamily: WF, fontSize: "12px", padding: "4px 6px", border: "1px solid #bbb", borderRadius: "2px", background: "#e9e9d8" }
  const btn: any = { fontFamily: WF, fontSize: "12px", padding: "5px 16px", border: "1px solid #999", borderRadius: "3px", background: "#3a9", color: "#fff", cursor: "pointer" }
  const bar: any = { fontWeight: 700, fontSize: "13px", background: "#ddd", padding: "8px 12px", textAlign: "center", margin: "12px 0 0" }

  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny online={meta.online} unread={meta.unread} active="Bildspel på 1:a sidan" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px" }}>
        <div style={{ textAlign: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>🖼️</span>
          <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>Bildspel på 1:a sidan</span>
        </div>
        <div style={{ textAlign: "center", marginBottom: "10px", fontSize: "12px" }}>
          <a href={`${ADMIN}/kontrollpanel`} style={{ color: "#0060cc" }}>◄ Till kontrollpanelen</a>
        </div>
        {note && <div style={{ fontSize: "12px", color: "#036", marginBottom: "10px", textAlign: "center" }}>{note}</div>}

        {/* Ny bild */}
        <div style={bar}>Ny bild</div>
        <div style={{ border: "1px solid #ddd", padding: "16px", maxWidth: "880px" }}>
          <div style={{ border: "2px dashed #bbb", background: "#fafafa", minHeight: "160px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "12px" }}>
            {nf.image_url
              ? <img src={nf.image_url} alt="" style={{ maxHeight: "150px", maxWidth: "100%" }} />
              : <><div style={{ fontWeight: 700, color: "#555" }}>Dra och släpp din bild här</div><div style={{ color: "#888" }}>eller</div></>}
            <label style={{ ...btn, display: "inline-block" }}>
              Välj bild
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => pickFile(e, (url) => setNf((s: any) => ({ ...s, image_url: url })))} />
            </label>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
            <tr>
              <td style={{ verticalAlign: "top", paddingRight: "16px", width: "40%" }}>
                <div style={{ fontSize: "11px", color: "#333" }}>Länka till (valfritt):</div>
                <input style={{ ...inp, width: "100%", boxSizing: "border-box" }} placeholder="http://" value={nf.link_url} onChange={(e) => setNf({ ...nf, link_url: e.target.value })} />
                <div style={{ marginTop: "8px", fontSize: "11px" }}><label><input type="checkbox" checked={nf.active} onChange={(e) => setNf({ ...nf, active: e.target.checked })} /> Aktiv just nu</label></div>
                <div style={{ marginTop: "8px", fontSize: "11px", color: "#333" }}>Bild-URL (om du inte laddar upp):</div>
                <input style={{ ...inp, width: "100%", boxSizing: "border-box" }} value={nf.image_url} onChange={(e) => setNf({ ...nf, image_url: e.target.value })} />
              </td>
              <td style={{ verticalAlign: "top", paddingRight: "16px", width: "40%" }}>
                <div style={{ fontSize: "11px", color: "#333" }}>Rubrik (valfritt):</div>
                <input style={{ ...inp, width: "100%", boxSizing: "border-box" }} value={nf.title} onChange={(e) => setNf({ ...nf, title: e.target.value })} />
                <div style={{ marginTop: "8px", fontSize: "11px", color: "#333" }}>Ingress (valfritt):</div>
                <input style={{ ...inp, width: "100%", boxSizing: "border-box" }} value={nf.ingress} onChange={(e) => setNf({ ...nf, ingress: e.target.value })} />
              </td>
              <td style={{ verticalAlign: "top", width: "20%" }}>
                <div style={{ fontSize: "11px", color: "#333" }}>Ändra bakgrundsfärg:</div>
                <input type="color" value={nf.bg_color} onChange={(e) => setNf({ ...nf, bg_color: e.target.value })} style={{ width: "48px", height: "26px", verticalAlign: "middle" }} />
                <span style={{ fontSize: "11px", marginLeft: "6px" }}>{nf.bg_color}</span>
                <div style={{ marginTop: "12px" }}><button style={btn} disabled={busy} onClick={add}>Ladda upp</button></div>
              </td>
            </tr>
          </tbody></table>
        </div>

        {/* Befintliga bilder */}
        <div style={bar}>Befintliga bilder</div>
        {slides.length === 0 ? <div style={{ fontSize: "12px", color: "#666", padding: "12px", border: "1px solid #ddd" }}>Inga bilder ännu.</div> :
          <div style={{ border: "1px solid #ddd", padding: "12px", display: "flex", flexWrap: "wrap", gap: "16px" }}>
            {slides.map((s) => (
              <div key={s.id} style={{ width: "260px", border: "1px solid #ccc", borderRadius: "4px", padding: "8px", background: s.bg_color || "#fff" }}>
                {s.image_url ? <img src={s.image_url} alt="" style={{ width: "100%", height: "110px", objectFit: "cover", borderRadius: "2px", background: "#eee" }} /> : <div style={{ width: "100%", height: "110px", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: "11px" }}>Ingen bild</div>}
                <div style={{ fontSize: "11px", marginTop: "6px" }}>Länka till:</div>
                <input style={{ ...inp, width: "100%", boxSizing: "border-box" }} value={s.link_url || ""} onChange={(e) => patch(s.id, "link_url", e.target.value)} />
                <div style={{ fontSize: "11px", marginTop: "4px" }}><label><input type="checkbox" checked={!!s.active} onChange={(e) => patch(s.id, "active", e.target.checked)} /> Aktiv just nu</label></div>
                <div style={{ fontSize: "11px", marginTop: "4px" }}>Rubrik:</div>
                <input style={{ ...inp, width: "100%", boxSizing: "border-box" }} value={s.title || ""} onChange={(e) => patch(s.id, "title", e.target.value)} />
                <div style={{ fontSize: "11px", marginTop: "4px" }}>Ingress:</div>
                <input style={{ ...inp, width: "100%", boxSizing: "border-box" }} value={s.ingress || ""} onChange={(e) => patch(s.id, "ingress", e.target.value)} />
                <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                  <button style={{ ...btn, padding: "4px 12px" }} onClick={() => saveSlide(s)}>Spara</button>
                  <button style={{ fontFamily: WF, fontSize: "12px", padding: "4px 12px", border: "1px solid #999", borderRadius: "3px", background: "#f0f0f0", color: "#a00", cursor: "pointer" }} onClick={() => del(s)}>Radera</button>
                </div>
              </div>
            ))}
          </div>}
        <div style={{ marginTop: "10px", fontSize: "12px" }}>Totalt: <b>{slides.length}</b> bilder.</div>
        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "12px" }}>
          <a href={`${ADMIN}/kontrollpanel`} style={{ color: "#0060cc" }}>◄ Till kontrollpanelen</a>
        </div>
      </div>
    </div>
  )
}
export const config = defineRouteConfig({ label: "Bildspel på 1:a sidan", icon: SlideIcon })
export default BildspelPage
