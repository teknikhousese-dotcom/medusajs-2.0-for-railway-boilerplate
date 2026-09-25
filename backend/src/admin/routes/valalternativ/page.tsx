import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

/**
 * Teknikhouse.se — Valalternativ (spegling av Wikinggruppen combinations.php)
 * Visar produktens val (options) och värden samt en redigerbar tabell över
 * varianterna: artikelnummer, inpris, pris, lager, vikt, lagerplats, EAN.
 * Lager läses/skrivs i variantens metadata.antal (manage_inventory är alltid false).
 * Baspriset är ordinarie pris — kampanjpriser hanteras i produktformuläret.
 */
async function jget(u: string) { return fetch(u, { credentials: "include" }).then((r) => r.json()) }
async function jsend(u: string, m: string, b?: any) {
  const r = await fetch(u, { method: m, credentials: "include", headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((j && j.message) || "HTTP " + r.status)
  return j
}

const FIELDS = "id,title,thumbnail,metadata,*options,*options.values,*variants,*variants.options,*variants.prices"
const inp: any = { fontFamily: WF, fontSize: "12px", padding: "3px 5px", border: "1px solid #bbb", borderRadius: "2px", boxSizing: "border-box" }
const btn: any = { fontFamily: WF, fontSize: "12px", padding: "3px 10px", border: "1px solid #999", borderRadius: "3px", background: "#f0f0f0", cursor: "pointer" }
const th: any = { border: "1px solid #bbb", padding: "5px 6px", fontWeight: 700, fontSize: "11px", textAlign: "left", background: "#cccccc", verticalAlign: "bottom" }
const td: any = { border: "1px solid #e2e2e2", padding: "4px 5px", fontSize: "12px", verticalAlign: "middle" }

const num = (s: any) => { const n = Number(String(s ?? "").replace(",", ".").trim()); return Number.isFinite(n) ? n : 0 }
const sekPrice = (v: any) => (v.prices || []).find((p: any) => String(p.currency_code || "").toLowerCase() === "sek" && !p.price_list_id)

function toRow(v: any) {
  const m = v.metadata || {}
  const pr = sekPrice(v)
  const opts: Record<string, string> = {}
  for (const o of v.options || []) opts[o.option_id] = o.value
  return {
    id: v.id,
    opts,
    sku: v.sku || "",
    inpris: m.inpris != null ? String(m.inpris) : "",
    pris: pr && pr.amount != null ? String(pr.amount) : "",
    antal: m.antal != null ? String(m.antal) : "",
    vikt: v.weight != null ? String(v.weight) : "",
    lagerplats: m.lagerplats || "",
    ean: v.barcode || m.ean || "",
    exkl: m.exclude_google_shopping === true || m.exclude_google_shopping === "true",
  }
}

const tomNy = () => ({ opts: {} as Record<string, string>, sku: "", inpris: "", pris: "", antal: "", vikt: "", lagerplats: "", ean: "" })

function ValalternativPage() {
  const [pid, setPid] = useState("")
  const [prod, setProd] = useState<any>(null)
  const [rows, setRows] = useState<any[]>([])
  const [optTitles, setOptTitles] = useState<Record<string, string>>({})
  const [nyttVarde, setNyttVarde] = useState<Record<string, string>>({})
  const [ny, setNy] = useState<any>(tomNy())
  const [msg, setMsg] = useState("")
  const [busy, setBusy] = useState(false)
  const [laddar, setLaddar] = useState(true)

  useEffect(() => {
    const el = Array.from(document.querySelectorAll("div")).find((d) => {
      const c = typeof d.className === "string" ? d.className : ""
      return c.includes("w-[220px]") && c.includes("lg:flex") && c.includes("border-e")
    }) as HTMLElement | undefined
    const prev = el ? el.style.display : ""
    if (el) el.style.display = "none"
    return () => { if (el) el.style.display = prev }
  }, [])

  const load = async (id: string) => {
    setLaddar(true)
    try {
      const d = await jget(`/admin/products/${id}?fields=${encodeURIComponent(FIELDS)}`)
      const p = d.product
      if (!p) { setMsg("Fel: produkten hittades inte."); setLaddar(false); return }
      setProd(p)
      setRows((p.variants || []).map(toRow))
      const t: Record<string, string> = {}
      for (const o of p.options || []) t[o.id] = o.title
      setOptTitles(t)
    } catch (e: any) { setMsg("Fel: kunde inte hämta produkten. " + String((e && e.message) || e)) }
    setLaddar(false)
  }

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id") || ""
    setPid(id)
    if (id) load(id)
    else setLaddar(false)
  }, [])

  const options: any[] = (prod && prod.options) || []
  const variants: any[] = (prod && prod.variants) || []
  const optText = (r: any) => options.map((o) => `${o.title}: ${r.opts[o.id] || ""}`).join(", ")

  /* Ser till att värdet finns på valet och är kopplat till produkten. */
  const ensureValue = async (opt: any, value: string) => {
    const linked = (opt.values || []).find((v: any) => v.value === value)
    if (linked) return linked.id
    const all = await jget(`/admin/product-options/${opt.id}?fields=id,title,*values`)
    const existing: any[] = (all.product_option && all.product_option.values) || []
    let hit = existing.find((v: any) => v.value === value)
    if (!hit) {
      const r = await jsend(`/admin/product-options/${opt.id}`, "POST", { values: [...existing.map((v: any) => v.value), value] })
      hit = ((r.product_option && r.product_option.values) || []).find((v: any) => v.value === value)
      if (!hit) {
        const again = await jget(`/admin/product-options/${opt.id}?fields=id,title,*values`)
        hit = ((again.product_option && again.product_option.values) || []).find((v: any) => v.value === value)
      }
    }
    if (!hit) throw new Error(`kunde inte skapa värdet "${value}"`)
    await jsend(`/admin/products/${pid}/options/batch`, "POST", { update: [{ product_option_id: opt.id, add: [hit.id] }] })
    return hit.id
  }

  const sparaValTitel = async (opt: any) => {
    const t = (optTitles[opt.id] || "").trim()
    if (!t) { setMsg("Fel: benämningen får inte vara tom."); return }
    if (t === opt.title) { setMsg("Ingen ändring av benämningen."); return }
    setBusy(true); setMsg("Sparar benämning…")
    try {
      const all = await jget(`/admin/product-options/${opt.id}?fields=id,title,*values`)
      const vals = ((all.product_option && all.product_option.values) || []).map((v: any) => v.value)
      await jsend(`/admin/product-options/${opt.id}`, "POST", { title: t, values: vals })
      setMsg("✔ Benämningen sparades.")
      await load(pid)
    } catch (e: any) { setMsg("Fel: " + String((e && e.message) || e)) }
    setBusy(false)
  }

  const laggTillVarde = async (opt: any) => {
    const v = (nyttVarde[opt.id] || "").trim()
    if (!v) { setMsg("Fel: ange ett värde."); return }
    setBusy(true); setMsg("Lägger till värde…")
    try {
      await ensureValue(opt, v)
      setNyttVarde({ ...nyttVarde, [opt.id]: "" })
      setMsg(`✔ Värdet "${v}" lades till. Skapa en variant nedan för att kunna sälja det.`)
      await load(pid)
    } catch (e: any) { setMsg("Fel: " + String((e && e.message) || e)) }
    setBusy(false)
  }

  const setRow = (i: number, k: string, val: any) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: val } : r)))
  const setRowOpt = (i: number, oid: string, val: string) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, opts: { ...r.opts, [oid]: val } } : r)))

  const kombinationFinns = (opts: Record<string, string>, skipId?: string) =>
    rows.some((r) => r.id !== skipId && options.every((o) => (r.opts[o.id] || "") === (opts[o.id] || "")))

  const sparaRad = async (i: number) => {
    const r = rows[i]
    const v = variants.find((x) => x.id === r.id)
    if (!v) return
    if (!r.sku.trim()) { setMsg("Fel: artikelnummer krävs."); return }
    for (const o of options) if (!(r.opts[o.id] || "").trim()) { setMsg(`Fel: ange ${o.title}.`); return }
    if (kombinationFinns(r.opts, r.id)) { setMsg("Fel: det finns redan en variant med samma valalternativ."); return }
    setBusy(true); setMsg("Sparar variant…")
    try {
      const old = toRow(v)
      const body: any = {
        sku: r.sku.trim(),
        manage_inventory: false,
        barcode: r.ean.trim() || null,
        weight: r.vikt.trim() ? num(r.vikt) : null,
        metadata: {
          ...(v.metadata || {}),
          inpris: r.inpris.trim() ? String(num(r.inpris)) : "",
          antal: r.antal.trim() ? String(Math.round(num(r.antal))) : "0",
          lagerplats: r.lagerplats.trim(),
          ean: r.ean.trim(),
          exclude_google_shopping: !!r.exkl,
        },
      }
      const optsChanged = options.some((o) => (r.opts[o.id] || "").trim() !== (old.opts[o.id] || ""))
      if (optsChanged) {
        const o2: Record<string, string> = {}
        for (const o of options) {
          const val = (r.opts[o.id] || "").trim()
          await ensureValue(o, val)
          o2[o.title] = val
        }
        body.options = o2
        body.title = options.map((o) => (r.opts[o.id] || "").trim()).join(" / ")
      }
      if (r.pris.trim() !== old.pris) {
        const pr = sekPrice(v)
        const amount = num(r.pris)
        body.prices = pr && pr.id ? [{ id: pr.id, amount, currency_code: "sek" }] : [{ amount, currency_code: "sek" }]
      }
      await jsend(`/admin/products/${pid}/variants/${v.id}`, "POST", body)
      setMsg(`✔ Varianten ${r.sku.trim()} sparades.`)
      await load(pid)
    } catch (e: any) { setMsg("Fel: " + String((e && e.message) || e)) }
    setBusy(false)
  }

  const taBortRad = async (i: number) => {
    const r = rows[i]
    if (variants.length <= 1) { setMsg("Fel: produkten måste ha minst en variant. Ta bort hela produkten i stället."); return }
    if (!confirm(`Vill du verkligen ta bort varianten ${optText(r)} (${r.sku})?`)) return
    setBusy(true); setMsg("Tar bort variant…")
    try {
      await jsend(`/admin/products/${pid}/variants/${r.id}`, "DELETE")
      setMsg(`✔ Varianten ${r.sku} togs bort.`)
      await load(pid)
    } catch (e: any) { setMsg("Fel: " + String((e && e.message) || e)) }
    setBusy(false)
  }

  const skapaVariant = async () => {
    for (const o of options) if (!(ny.opts[o.id] || "").trim()) { setMsg(`Fel: ange ${o.title} för den nya varianten.`); return }
    if (!ny.sku.trim()) { setMsg("Fel: ange ett artikelnummer för den nya varianten."); return }
    if (rows.some((r) => r.sku.trim().toLowerCase() === ny.sku.trim().toLowerCase())) { setMsg("Fel: artikelnumret används redan av en annan variant."); return }
    const trimmed: Record<string, string> = {}
    for (const o of options) trimmed[o.id] = (ny.opts[o.id] || "").trim()
    if (kombinationFinns(trimmed)) { setMsg("Fel: det finns redan en variant med samma valalternativ."); return }
    setBusy(true); setMsg("Skapar variant…")
    try {
      const o2: Record<string, string> = {}
      for (const o of options) { await ensureValue(o, trimmed[o.id]); o2[o.title] = trimmed[o.id] }
      const pm = (prod && prod.metadata) || {}
      const v0m = (variants[0] && variants[0].metadata) || {}
      const body: any = {
        title: options.map((o) => trimmed[o.id]).join(" / "),
        sku: ny.sku.trim(),
        options: o2,
        prices: [{ amount: num(ny.pris), currency_code: "sek" }],
        manage_inventory: false,
        allow_backorder: false,
        metadata: {
          antal: ny.antal.trim() ? String(Math.round(num(ny.antal))) : "0",
          inpris: ny.inpris.trim() ? String(num(ny.inpris)) : "0",
          momssats: String(v0m.momssats || pm.momssats || "25"),
          lagerplats: ny.lagerplats.trim(),
          ean: ny.ean.trim(),
        },
      }
      if (ny.ean.trim()) body.barcode = ny.ean.trim()
      if (ny.vikt.trim()) body.weight = num(ny.vikt)
      await jsend(`/admin/products/${pid}/variants`, "POST", body)
      setMsg(`✔ Varianten ${ny.sku.trim()} skapades.`)
      setNy(tomNy())
      await load(pid)
    } catch (e: any) { setMsg("Fel: " + String((e && e.message) || e)) }
    setBusy(false)
  }

  const P: any = { fontSize: "12px", color: "#333", lineHeight: 1.6, margin: "0 0 6px" }
  const box: any = { border: "1px solid #ddd", borderRadius: "4px", background: "#fafafa", padding: "10px 14px", marginBottom: "14px" }

  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny active="Hantera produkter" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px" }}>
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>🎛</span>
          <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>VALALTERNATIV{prod ? " FÖR: " + prod.title : ""}</span>
        </div>
        <p style={P}>Här ställer du in vilka valmöjligheter som ska finnas för produkten, t.ex. modell, storlek eller färg. För varje kombination av val kan du sätta pris, lagersaldo och artikelnummer.</p>
        {pid && <p style={P}>Vill du redigera produktens huvudinställningar? Gå då till <a href={`${ADMIN}/produkt-form?id=${pid}`} style={{ color: "#0060cc" }}>Redigera produkt</a>.</p>}
        {msg && <div style={{ padding: "7px 10px", margin: "8px 0", borderRadius: "3px", fontSize: "12px", background: msg.startsWith("Fel") ? "#fdecea" : "#e8f5e9", color: msg.startsWith("Fel") ? "#a00" : "#256029" }}>{msg}</div>}

        {!pid ? <div style={{ fontSize: "12px", color: "#a00" }}>Ingen produkt vald. Öppna Valalternativ från produktlistan.</div> :
         laddar && !prod ? <div style={{ fontSize: "12px", color: "#666" }}>Hämtar…</div> :
         !prod ? null : (
          <>
            <div style={box}>
              <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "6px" }}>Val</div>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead><tr><th style={{ ...th, width: "230px" }}>Benämning</th><th style={th}>Valalternativ</th><th style={{ ...th, width: "260px" }}>Nytt valalternativ</th></tr></thead>
                <tbody>
                  {options.length === 0 ? <tr><td colSpan={3} style={{ ...td, color: "#888" }}>Produkten har inga val.</td></tr> :
                    options.map((o) => (
                      <tr key={o.id}>
                        <td style={td}>
                          <input style={{ ...inp, width: "140px" }} value={optTitles[o.id] ?? o.title} onChange={(e) => setOptTitles({ ...optTitles, [o.id]: e.target.value })} />
                          <button style={{ ...btn, marginLeft: "4px" }} disabled={busy} onClick={() => sparaValTitel(o)}>Spara</button>
                        </td>
                        <td style={td}>
                          <span style={{ color: "#555" }}>({(o.values || []).length} st) </span>
                          {(o.values || []).map((v: any) => <span key={v.id} style={{ display: "inline-block", background: "#eef3fa", border: "1px solid #cdd9ea", borderRadius: "3px", padding: "1px 6px", margin: "2px 4px 2px 0" }}>{v.value}</span>)}
                        </td>
                        <td style={td}>
                          <input style={{ ...inp, width: "170px" }} placeholder="Nytt värde…" value={nyttVarde[o.id] || ""} onChange={(e) => setNyttVarde({ ...nyttVarde, [o.id]: e.target.value })} />
                          <button style={{ ...btn, marginLeft: "4px" }} disabled={busy} onClick={() => laggTillVarde(o)}>Lägg till</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div style={{ fontWeight: 700, fontSize: "13px", margin: "6px 0" }}>Beställningsbara alternativ</div>
            <p style={P}>Ange utpriser inklusive moms. Alla artikelnummer måste vara unika. Klicka på Spara på raden när du har ändrat den. Kampanjpris sätts i produktformuläret.</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead><tr>
                  <th style={th}>Valalternativ</th>
                  <th style={th}>Artikelnummer</th>
                  <th style={th}>Inpris<br />(exkl moms)</th>
                  <th style={th}>Pris</th>
                  <th style={th}>Kvar i lagret</th>
                  <th style={th}>Vikt (g)</th>
                  <th style={th}>Lagerplats</th>
                  <th style={th}>EAN-kod</th>
                  <th style={th}>Exkludera Google Shopping</th>
                  <th style={th}></th>
                </tr></thead>
                <tbody>
                  {rows.length === 0 ? <tr><td colSpan={10} style={{ ...td, color: "#888" }}>Inga varianter.</td></tr> :
                    rows.map((r, i) => (
                      <tr key={r.id}>
                        <td style={td}>
                          {options.map((o) => (
                            <div key={o.id} style={{ whiteSpace: "nowrap", margin: "1px 0" }}>
                              <span style={{ color: "#555" }}>{o.title}: </span>
                              <input style={{ ...inp, width: "190px" }} list={`vals-${o.id}`} value={r.opts[o.id] || ""} onChange={(e) => setRowOpt(i, o.id, e.target.value)} />
                            </div>
                          ))}
                        </td>
                        <td style={td}><input style={{ ...inp, width: "100px" }} value={r.sku} onChange={(e) => setRow(i, "sku", e.target.value)} /></td>
                        <td style={td}><input style={{ ...inp, width: "60px" }} value={r.inpris} onChange={(e) => setRow(i, "inpris", e.target.value)} /></td>
                        <td style={td}><input style={{ ...inp, width: "60px" }} value={r.pris} onChange={(e) => setRow(i, "pris", e.target.value)} /></td>
                        <td style={td}><input style={{ ...inp, width: "50px" }} value={r.antal} onChange={(e) => setRow(i, "antal", e.target.value)} /></td>
                        <td style={td}><input style={{ ...inp, width: "50px" }} value={r.vikt} onChange={(e) => setRow(i, "vikt", e.target.value)} /></td>
                        <td style={td}><input style={{ ...inp, width: "80px" }} value={r.lagerplats} onChange={(e) => setRow(i, "lagerplats", e.target.value)} /></td>
                        <td style={td}><input style={{ ...inp, width: "110px" }} value={r.ean} onChange={(e) => setRow(i, "ean", e.target.value)} /></td>
                        <td style={{ ...td, textAlign: "center" }}><input type="checkbox" checked={!!r.exkl} onChange={(e) => setRow(i, "exkl", e.target.checked)} /></td>
                        <td style={{ ...td, whiteSpace: "nowrap" }}>
                          <button style={btn} disabled={busy} onClick={() => sparaRad(i)}>Spara</button>
                          <button style={{ ...btn, marginLeft: "4px", color: "#a00" }} disabled={busy} onClick={() => taBortRad(i)}>Ta bort</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {options.map((o) => (
              <datalist key={o.id} id={`vals-${o.id}`}>
                {(o.values || []).map((v: any) => <option key={v.id} value={v.value} />)}
              </datalist>
            ))}

            {options.length > 0 && (
              <div style={{ ...box, marginTop: "16px" }}>
                <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "6px" }}>Lägg till ny variant</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "flex-end", fontSize: "12px" }}>
                  {options.map((o) => (
                    <label key={o.id}>{o.title}<br /><input style={{ ...inp, width: "200px" }} list={`vals-${o.id}`} placeholder="Välj eller skriv nytt…" value={ny.opts[o.id] || ""} onChange={(e) => setNy({ ...ny, opts: { ...ny.opts, [o.id]: e.target.value } })} /></label>
                  ))}
                  <label>Artikelnummer<br /><input style={{ ...inp, width: "110px" }} value={ny.sku} onChange={(e) => setNy({ ...ny, sku: e.target.value })} /></label>
                  <label>Inpris<br /><input style={{ ...inp, width: "60px" }} value={ny.inpris} onChange={(e) => setNy({ ...ny, inpris: e.target.value })} /></label>
                  <label>Pris<br /><input style={{ ...inp, width: "60px" }} value={ny.pris} onChange={(e) => setNy({ ...ny, pris: e.target.value })} /></label>
                  <label>Lager<br /><input style={{ ...inp, width: "50px" }} value={ny.antal} onChange={(e) => setNy({ ...ny, antal: e.target.value })} /></label>
                  <label>Vikt (g)<br /><input style={{ ...inp, width: "50px" }} value={ny.vikt} onChange={(e) => setNy({ ...ny, vikt: e.target.value })} /></label>
                  <label>Lagerplats<br /><input style={{ ...inp, width: "80px" }} value={ny.lagerplats} onChange={(e) => setNy({ ...ny, lagerplats: e.target.value })} /></label>
                  <label>EAN-kod<br /><input style={{ ...inp, width: "110px" }} value={ny.ean} onChange={(e) => setNy({ ...ny, ean: e.target.value })} /></label>
                  <button style={{ ...btn, background: "#2e7d32", color: "#fff", border: "1px solid #2e7d32" }} disabled={busy} onClick={skapaVariant}>Skapa variant</button>
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ textAlign: "center", marginTop: "18px", fontSize: "12px" }}>
          <a href={`${ADMIN}/hantera-produkter`} style={{ color: "#0060cc" }}>◄ Tillbaka till produktlistan</a>
        </div>
      </div>
    </div>
  )
}

export default ValalternativPage
