import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

const BoxIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="M3.27 6.96 12 12.01l8.73-5.05" /><path d="M12 22.08V12" />
  </svg>
)

function ProduktFormPage() {
  const [cats, setCats] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [catFilter, setCatFilter] = useState("")
  const [msg, setMsg] = useState("")
  const [busy, setBusy] = useState(false)
  const [editId, setEditId] = useState("")

  const [f, setF] = useState<any>({
    artnr: "", namn: "", googleNamn: "", category_ids: [] as string[],
    skick: "Nyskick", momssats: "25", inpris: "", utpris: "", kampanj: false, kampanjpris: "", kampanjStart: "", kampanjSlut: "",
    antal: "", oandligt: false, lagervarning: "", weight: "", skrymmande: false, bestallningsvara: false, emptyStockText: "", customText: "",
    beskrivning: "", images: "", htmlFalt: "", lagerplats: "", leverantor: "",
    tillverkare: "", ean: "", modell: "", sokord: "", visning: "show",
    metaTitle: "", metaDesc: "", h1: "",
  })
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }))

  useEffect(() => {
    const u = new URL(window.location.href)
    const id = u.searchParams.get("id") || ""
    fetch("/admin/wiki-products", { credentials: "include" }).then((r) => r.json()).then((j) => {
      setCats(j.categories || []); setSuppliers(j.suppliers || [])
    }).catch(() => {})
    if (id) {
      setEditId(id)
      fetch("/admin/wiki-products?id=" + encodeURIComponent(id), { credentials: "include" }).then((r) => r.json()).then((j) => {
        const p = j.product; if (!p) return
        const m = p.metadata || {}
        setF((prev: any) => ({
          ...prev, artnr: p.artnr, namn: p.namn, googleNamn: p.googleNamn, beskrivning: p.beskrivning,
          ean: p.ean, weight: p.weight, utpris: p.utpris, category_ids: p.category_ids || [],
          images: (p.images || []).join("\n"), skick: m.skick || "Nyskick", momssats: m.momssats || "25",
          inpris: m.inpris || "", leverantor: m.leverantor || "", tillverkare: m.tillverkare || "",
          modell: m.modell || "", lagerplats: m.lagerplats || "", sokord: m.sokord || "",
          antal: m.antal || "", oandligt: m.oandligt === true || m.oandligt === "true",
          visning: m.visning || "show", metaTitle: m.seo_title || "", metaDesc: m.seo_desc || "", h1: m.h1 || "",
          kampanj: m.kampanj === true || m.kampanj === "true", kampanjpris: m.kampanjpris || "", kampanjStart: m.kampanj_start || "", kampanjSlut: m.kampanj_slut || "", htmlFalt: m.html_falt || "", bestallningsvara: m.bestallningsvara === true || m.bestallningsvara === "true", emptyStockText: m.empty_stock_text || "", customText: m.custom_text || "",
        }))
      }).catch(() => {})
    }
  }, [])

  const toggleCat = (id: string) => set("category_ids", f.category_ids.includes(id) ? f.category_ids.filter((x: string) => x !== id) : [...f.category_ids, id])

  const save = async () => {
    if (!f.artnr.trim() || !f.namn.trim()) { setMsg("Fyll i artikelnummer och produktnamn."); return }
    setBusy(true); setMsg("Sparar…")
    const body = { ...f, id: editId || undefined, images: f.images.split("\n").map((s: string) => s.trim()).filter(Boolean) }
    try {
      const r = await fetch("/admin/wiki-products", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const j = await r.json()
      if (r.ok && j.ok) { setMsg("✔ Produkten sparades."); if (!editId && j.id) setEditId(j.id) }
      else setMsg("Fel: " + (j.error || "kunde inte spara"))
    } catch (e: any) { setMsg("Fel: " + String(e && e.message || e)) }
    setBusy(false)
  }

  const lbl: any = { fontSize: "12px", fontWeight: 700, display: "block", margin: "12px 0 3px" }
  const hint: any = { fontSize: "11px", color: "#888", margin: "0 0 4px" }
  const inp: any = { padding: "6px 8px", border: "1px solid #bbb", borderRadius: "3px", fontSize: "12px", fontFamily: WF, width: "100%", boxSizing: "border-box" }
  const sect: any = { fontSize: "13px", fontWeight: 700, margin: "22px 0 4px", borderBottom: "2px solid #ccc", paddingBottom: "4px" }
  const btn: any = { padding: "8px 20px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "13px", fontWeight: 700 }
  const radio = (name: string, val: string, cur: string, txt: string) => (
    <label style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginRight: "14px", fontSize: "12px", cursor: "pointer" }}>
      <input type="radio" name={name} checked={cur === val} onChange={() => set(name, val)} /> {txt}
    </label>
  )
  const shownCats = catFilter ? cats.filter((c) => c.label.toLowerCase().includes(catFilter.toLowerCase())) : cats.slice(0, 60)

  return (
    <div style={{ display: "flex", fontFamily: WF }}>
      <Snabbmeny active="Hantera produkter" />
      <div style={{ flex: 1 }}>
        <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", margin: "0 0 12px" }}>
          <div style={{ background: "#f4f4f4", borderBottom: "1px solid #ddd", padding: "10px 16px", fontWeight: 700, fontSize: "14px" }}>🛍 {editId ? "Redigera produkt" : "Ny produkt"}</div>
          <div style={{ padding: "16px", maxWidth: "820px" }}>
            {msg && <div style={{ padding: "8px 10px", marginBottom: "10px", borderRadius: "3px", background: msg.startsWith("Fel") ? "#fdecea" : "#e8f5e9", color: msg.startsWith("Fel") ? "#a00" : "#256029", fontSize: "12px" }}>{msg}</div>}

            <div style={sect}>Obligatoriska fält</div>

            <label style={lbl}>Artikelnummer</label>
            <div style={hint}>Endast bokstäver, siffror och bindestreck/punkt. T.ex. ARTICLE-5.67</div>
            <input style={inp} value={f.artnr} onChange={(e) => set("artnr", e.target.value)} disabled={!!editId} />

            <label style={lbl}>Produktens namn / visuell rubrik</label>
            <input style={inp} value={f.namn} onChange={(e) => set("namn", e.target.value)} placeholder="ex Volvo S80" />

            <label style={lbl}>Produktens namn för Google Shopping</label>
            <div style={hint}>Ej synlig i butik</div>
            <input style={inp} value={f.googleNamn} onChange={(e) => set("googleNamn", e.target.value)} />

            <label style={lbl}>Placeras i Varugrupper</label>
            <div style={hint}>Kryssa för de varugrupper där produkten ska visas.</div>
            <input style={{ ...inp, marginBottom: "6px" }} placeholder="Sök varugrupp…" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} />
            <div style={{ border: "1px solid #ddd", borderRadius: "3px", maxHeight: "180px", overflowY: "auto", padding: "6px 8px" }}>
              {shownCats.length === 0 ? <div style={{ fontSize: "12px", color: "#999" }}>Inga varugrupper…</div> :
                shownCats.map((c) => (
                  <label key={c.id} style={{ display: "block", fontSize: "12px", padding: "2px 0", cursor: "pointer" }}>
                    <input type="checkbox" checked={f.category_ids.includes(c.id)} onChange={() => toggleCat(c.id)} /> {c.label}
                  </label>
                ))}
              {!catFilter && cats.length > 60 && <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>Sök för att se fler ({cats.length} totalt)…</div>}
            </div>

            <label style={lbl}>Skick</label>
            <div>{radio("skick", "Nyskick", f.skick, "Nyskick")}{radio("skick", "Restaurerad", f.skick, "Restaurerad")}{radio("skick", "Begagnad", f.skick, "Begagnad")}</div>

            <label style={lbl}>Momssats</label>
            <div>{radio("momssats", "0", f.momssats, "Momsfritt")}{radio("momssats", "6", f.momssats, "6%")}{radio("momssats", "12", f.momssats, "12%")}{radio("momssats", "25", f.momssats, "25%")}</div>

            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Inpris (SEK, exkl. moms)</label>
                <input style={inp} value={f.inpris} onChange={(e) => set("inpris", e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Utpris (SEK, inkl. moms)</label>
                <input style={inp} value={f.utpris} onChange={(e) => set("utpris", e.target.value)} />
              </div>
            </div>

            <label style={{ ...lbl, fontWeight: 400 }}><input type="checkbox" checked={f.kampanj} onChange={(e) => set("kampanj", e.target.checked)} /> Aktivera kampanj</label>
            {f.kampanj && (
              <div style={{ border: "1px solid #f0c36d", background: "#fffdf5", borderRadius: "4px", padding: "10px 12px", margin: "4px 0 8px" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>Kampanjpris (SEK, inkl. moms)</label>
                    <input style={inp} value={f.kampanjpris} onChange={(e) => set("kampanjpris", e.target.value)} placeholder="Lägre än utpris" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>Kampanj startdatum</label>
                    <input style={inp} value={f.kampanjStart} onChange={(e) => set("kampanjStart", e.target.value)} placeholder="ÅÅÅÅ-MM-DD (valfritt)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>Kampanj slutdatum</label>
                    <input style={inp} value={f.kampanjSlut} onChange={(e) => set("kampanjSlut", e.target.value)} placeholder="ÅÅÅÅ-MM-DD (valfritt)" />
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: "#8a6d3b", marginTop: "4px" }}>Kampanjpriset blir produktens aktiva pris. Ordinarie utpris sparas som jämförpris.</div>
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Antal i lagret</label>
                <input style={inp} value={f.antal} onChange={(e) => set("antal", e.target.value)} disabled={f.oandligt} />
              </div>
              <label style={{ fontSize: "12px", paddingBottom: "8px" }}><input type="checkbox" checked={f.oandligt} onChange={(e) => set("oandligt", e.target.checked)} /> Oändligt antal?</label>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Gränsvärde lagervarning</label>
                <input style={inp} value={f.lagervarning} onChange={(e) => set("lagervarning", e.target.value)} placeholder="0 = av" />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Vikt (gram)</label>
                <input style={inp} value={f.weight} onChange={(e) => set("weight", e.target.value)} />
              </div>
              <label style={{ fontSize: "12px", paddingBottom: "8px" }}><input type="checkbox" checked={f.skrymmande} onChange={(e) => set("skrymmande", e.target.checked)} /> Skrymmande?</label>
            </div>

            <label style={{ ...lbl, fontWeight: 400 }}><input type="checkbox" checked={f.bestallningsvara} onChange={(e) => set("bestallningsvara", e.target.checked)} /> Beställningsvara (går att köpa även när den är slut i lager)</label>
            {f.bestallningsvara && (<><label style={lbl}>Text som visas när varan är slut i lager</label><input style={inp} value={f.emptyStockText} onChange={(e) => set("emptyStockText", e.target.value)} placeholder="t.ex. Beställningsvara – leverans 5–7 dagar" /></>)}

            <label style={lbl}>Produktbeskrivning</label>
            <textarea style={{ ...inp, height: "150px" }} value={f.beskrivning} onChange={(e) => set("beskrivning", e.target.value)} />

            <div style={sect}>Valfria fält</div>

            <label style={lbl}>Produktbilder (en URL per rad)</label>
            <textarea style={{ ...inp, height: "70px", fontFamily: "monospace" }} value={f.images} onChange={(e) => set("images", e.target.value)} placeholder="https://…/bild1.jpg" />

            <label style={lbl}>HTML-fält (t.ex. YouTube-embed, max bredd 400px)</label>
            <textarea style={{ ...inp, height: "50px", fontFamily: "monospace" }} value={f.htmlFalt} onChange={(e) => set("htmlFalt", e.target.value)} />

            <label style={lbl}>Egen text (visas på produktsidan)</label>
            <textarea style={{ ...inp, height: "60px" }} value={f.customText} onChange={(e) => set("customText", e.target.value)} />

            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Lagerplats</label>
                <input style={inp} value={f.lagerplats} onChange={(e) => set("lagerplats", e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Leverantör</label>
                <select style={inp} value={f.leverantor} onChange={(e) => set("leverantor", e.target.value)}>
                  <option value="">Välj…</option>
                  {suppliers.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Tillverkare / varumärke</label>
                <input style={inp} value={f.tillverkare} onChange={(e) => set("tillverkare", e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>EAN-kod</label>
                <input style={inp} value={f.ean} onChange={(e) => set("ean", e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Modell</label>
                <input style={inp} value={f.modell} onChange={(e) => set("modell", e.target.value)} />
              </div>
            </div>

            <label style={lbl}>Visning i butiken</label>
            <div>
              {radio("visning", "show", f.visning, "Visa produkten")}
              {radio("visning", "hide_shop", f.visning, "Dölj i butiken men inte för sökmotorer")}
              {radio("visning", "hide_full", f.visning, "Dölj fullständigt")}
            </div>

            <label style={lbl}>Extra sökord</label>
            <div style={hint}>Synonymer/felstavningar för butikens sökmotor, separerade med mellanslag.</div>
            <input style={inp} value={f.sokord} onChange={(e) => set("sokord", e.target.value)} />

            <div style={sect}>Meta och h1 – sökmotoroptimering</div>
            <label style={lbl}>Meta-titel</label>
            <input style={inp} value={f.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} />
            <label style={lbl}>Meta-beskrivning</label>
            <textarea style={{ ...inp, height: "50px" }} value={f.metaDesc} onChange={(e) => set("metaDesc", e.target.value)} />
            <label style={lbl}>H1-rubrik</label>
            <input style={inp} value={f.h1} onChange={(e) => set("h1", e.target.value)} />

            <div style={{ margin: "20px 0 4px" }}>
              <button style={{ ...btn, opacity: busy ? 0.6 : 1 }} onClick={save} disabled={busy}>{editId ? "Spara ändringar" : "Skapa produkt"}</button>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: "12px" }}><a href={`${ADMIN}/hantera-produkter`} style={{ color: "#06c" }}>◄ Till Hantera produkter</a></div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Ny produkt (Wiki)", icon: BoxIcon })
export default ProduktFormPage
