import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

/**
 * Teknikhouse.se — Avtalskunder (1:1 mirror of Wikinggruppen retail.php)
 * B2B/wholesale customers + price lists. Tabs: Ny avtalskund | Avtalskunder |
 * Prislistor | Villkor för ansökan. Raw-SQL tables retail_customer / retail_pricelist.
 */
const RetailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
async function jget(u: string) { return fetch(u, { credentials: "include" }).then((r) => r.json()) }
async function jsend(u: string, m: string, b?: any) { return fetch(u, { method: m, credentials: "include", headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined }).then((r) => r.json()) }

const COUNTRIES = ["Sverige", "Norge", "Danmark", "Finland", "Tyskland", "Storbritannien", "Nederländerna", "Polen", "Estland", "USA", "Övriga"]
const TABS = ["Ny avtalskund", "Avtalskunder", "Prislistor", "Villkor för ansökan"]

function AvtalskunderPage() {
  const [meta, setMeta] = useState<{ online: number | null; unread: number }>({ online: null, unread: 0 })
  const [tab, setTab] = useState("Ny avtalskund")
  const [customers, setCustomers] = useState<any[]>([])
  const [pricelists, setPricelists] = useState<any[]>([])
  const [note, setNote] = useState("")
  // new/edit customer form
  const empty = { id: "", orgnr: "", company_name: "", first_name: "", last_name: "", street: "", zip_code: "", city: "", country: "Sverige", telephone: "", cellphone: "", email: "", free_shipping: false, pricelist_id: "" }
  const [f, setF] = useState<any>({ ...empty })
  // pricelist form
  const [plName, setPlName] = useState(""); const [plPct, setPlPct] = useState("")

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
    try { const d = await jget("/admin/retail/customers"); setCustomers(d.customers || []); setPricelists(d.pricelists || []) } catch {}
  }
  useEffect(() => { load() }, [])

  const saveCustomer = async () => {
    if (!f.company_name && !f.first_name && !f.email) { setNote("Ange minst företagsnamn eller e-post."); return }
    const body = { ...f }; delete body.id; delete body.pricelist_name
    if (f.id) { const r = await jsend(`/admin/retail/customers/${f.id}`, "POST", body); if (r.customer) { setNote("Avtalskund uppdaterad."); setF({ ...empty }); setTab("Avtalskunder"); load() } }
    else { const r = await jsend("/admin/retail/customers", "POST", body); if (r.customer) { setNote("Avtalskund tillagd."); setF({ ...empty }); setTab("Avtalskunder"); load() } else setNote("Kunde inte spara.") }
  }
  const editCustomer = (c: any) => { setF({ ...empty, ...c, free_shipping: !!c.free_shipping, pricelist_id: c.pricelist_id || "" }); setTab("Ny avtalskund") }
  const delCustomer = async (c: any) => { if (!confirm(`Ta bort avtalskund "${c.company_name || c.email}"?`)) return; await jsend(`/admin/retail/customers/${c.id}`, "DELETE"); load() }
  const savePricelist = async () => {
    if (!plName.trim()) { setNote("Ange namn på prislistan."); return }
    const r = await jsend("/admin/retail/pricelists", "POST", { name: plName, default_percent: plPct === "" ? null : Number(plPct) })
    if (r.pricelist) { setPlName(""); setPlPct(""); load() }
  }
  const delPricelist = async (p: any) => { if (!confirm(`Ta bort prislistan "${p.name}"?`)) return; await jsend(`/admin/retail/pricelists/${p.id}`, "DELETE"); load() }

  const inp: any = { fontFamily: WF, fontSize: "12px", padding: "4px 6px", border: "1px solid #bbb", borderRadius: "2px" }
  const btn: any = { fontFamily: WF, fontSize: "12px", padding: "5px 16px", border: "1px solid #999", borderRadius: "3px", background: "#f0f0f0", cursor: "pointer" }
  const P: any = { fontSize: "12px", color: "#333", lineHeight: 1.6, margin: "0 0 8px" }
  const th: any = { border: "1px solid #bbb", padding: "6px 8px", fontWeight: 700, fontSize: "11px", textAlign: "left", background: "#cccccc" }
  const td: any = { border: "1px solid #e2e2e2", padding: "5px 8px", fontSize: "12px" }
  const Row = ({ label, children }: any) => (
    <tr><td style={{ ...td, border: "none", textAlign: "right", color: "#333", width: "180px", paddingRight: "10px", whiteSpace: "nowrap" }}>{label}</td><td style={{ ...td, border: "none" }}>{children}</td></tr>
  )
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })

  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny online={meta.online} unread={meta.unread} active="Avtalskunder" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px" }}>
        <div style={{ textAlign: "center", marginBottom: "14px" }}>
          <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>👥</span>
          <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>AVTALSKUNDER</span>
        </div>
        {/* tab bar */}
        <div style={{ display: "flex", gap: "2px", borderBottom: "2px solid #999", marginBottom: "16px" }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => { setTab(t); setNote(""); if (t !== "Ny avtalskund" && !f.id) {} }}
              style={{ fontFamily: WF, fontSize: "12px", padding: "6px 14px", cursor: "pointer", border: "1px solid #999", borderBottom: "none",
                borderRadius: "3px 3px 0 0", background: tab === t ? "#fff" : "#e2e2e2", fontWeight: tab === t ? 700 : 400,
                position: "relative", top: "2px" }}>{t === "Ny avtalskund" && f.id ? "Ändra avtalskund" : t}</button>
          ))}
        </div>
        {note && <div style={{ fontSize: "12px", color: "#036", marginBottom: "10px", textAlign: "center" }}>{note}</div>}

        {/* NY / ÄNDRA AVTALSKUND */}
        {tab === "Ny avtalskund" && (
          <div style={{ maxWidth: "620px", margin: "0 auto" }}>
            <div style={{ fontWeight: 700, fontSize: "13px", margin: "0 0 10px", textAlign: "center", color: "#555" }}>
              = {f.id ? "Ändra avtalskund" : "Lägga till ny avtalskund"} =
            </div>
            <table style={{ borderCollapse: "collapse", margin: "0 auto" }}><tbody>
              <Row label="Orgnr/persnr"><input style={{ ...inp, width: "200px" }} value={f.orgnr} onChange={set("orgnr")} /></Row>
              <Row label="Företagsnamn/Namn"><input style={{ ...inp, width: "260px" }} value={f.company_name} onChange={set("company_name")} /></Row>
              <Row label="Förnamn"><input style={{ ...inp, width: "200px" }} value={f.first_name} onChange={set("first_name")} /></Row>
              <Row label="Efternamn"><input style={{ ...inp, width: "200px" }} value={f.last_name} onChange={set("last_name")} /></Row>
              <Row label="Gatuadress"><input style={{ ...inp, width: "260px" }} value={f.street} onChange={set("street")} /></Row>
              <Row label="Postnr"><input style={{ ...inp, width: "100px" }} value={f.zip_code} onChange={set("zip_code")} /></Row>
              <Row label="Ort"><input style={{ ...inp, width: "200px" }} value={f.city} onChange={set("city")} /></Row>
              <Row label="Land"><select style={{ ...inp, width: "214px" }} value={f.country} onChange={set("country")}>{COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></Row>
              <Row label="Telefon"><input style={{ ...inp, width: "200px" }} value={f.telephone} onChange={set("telephone")} /></Row>
              <Row label="Mobiltelefon"><input style={{ ...inp, width: "200px" }} value={f.cellphone} onChange={set("cellphone")} /></Row>
              <Row label="E-post / Användarnamn"><input style={{ ...inp, width: "260px" }} value={f.email} onChange={set("email")} /></Row>
              <Row label="Gratis frakt"><input type="checkbox" checked={!!f.free_shipping} onChange={(e) => setF({ ...f, free_shipping: e.target.checked })} /></Row>
              <Row label="Prislista">
                <select style={{ ...inp, width: "214px" }} value={f.pricelist_id} onChange={set("pricelist_id")}>
                  <option value="">Standardpriser</option>
                  {pricelists.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Row>
            </tbody></table>
            <div style={{ textAlign: "center", marginTop: "14px" }}>
              <button style={btn} onClick={saveCustomer}>{f.id ? "Spara ändringar" : "Lägg till ny avtalskund"}</button>
              {f.id && <button style={{ ...btn, marginLeft: "8px" }} onClick={() => { setF({ ...empty }); setNote("") }}>Avbryt</button>}
            </div>
          </div>
        )}

        {/* AVTALSKUNDER LIST */}
        {tab === "Avtalskunder" && (
          <div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Företag / Namn</th><th style={th}>E-postadress</th><th style={th}>Ort</th><th style={th}>Prislista</th><th style={th}>Gratis frakt</th><th style={{ ...th, width: "120px" }}></th></tr></thead>
              <tbody>{customers.length === 0 ? <tr><td colSpan={6} style={{ ...td, textAlign: "center", color: "#666" }}>Inga avtalskunder ännu.</td></tr> :
                customers.map((c) => (<tr key={c.id} style={{ borderBottom: "1px solid #e2e2e2" }}>
                  <td style={td}>{c.company_name || `${c.first_name || ""} ${c.last_name || ""}`.trim() || "—"}</td>
                  <td style={td}>{c.email || "—"}</td>
                  <td style={td}>{c.city || "—"}</td>
                  <td style={td}>{c.pricelist_name || "Standardpriser"}</td>
                  <td style={td}>{c.free_shipping ? "Ja" : "Nej"}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); editCustomer(c) }} style={{ color: "#0060cc" }}>Ändra</a>
                    <span style={{ color: "#bbb" }}> | </span>
                    <a href="#" onClick={(e) => { e.preventDefault(); delCustomer(c) }} style={{ color: "#a00" }}>Ta bort</a>
                  </td></tr>))}</tbody>
            </table>
            <div style={{ marginTop: "12px", fontSize: "12px" }}>Totalt: <b>{customers.length}</b> avtalskunder.</div>
          </div>
        )}

        {/* PRISLISTOR */}
        {tab === "Prislistor" && (
          <div style={{ maxWidth: "640px", margin: "0 auto" }}>
            <div style={{ fontWeight: 700, fontSize: "13px", textAlign: "center", margin: "0 0 10px" }}>PRISLISTOR</div>
            <p style={P}>Här hanterar du butikens prislistor. När du skapar/hanterar en produkt sätter du dess standardpris. Prislistor kan användas för att göra avvikelser till dessa standardpriser. Flera avtalskunder kan använda samma prislista, men det går även bra att skapa en prislista till varje avtalskund — det är upp till dig. När du skapar/redigerar en avtalskund väljer du vilken prislista de ska höra till.</p>
            <table style={{ width: "100%", borderCollapse: "collapse", margin: "10px 0" }}>
              <thead><tr><th style={th}>Namn</th><th style={{ ...th, width: "140px" }}>Standardprocent*</th><th style={{ ...th, width: "120px" }}>Antal kunder</th><th style={{ ...th, width: "80px" }}></th></tr></thead>
              <tbody>{pricelists.length === 0 ? <tr><td colSpan={4} style={{ ...td, textAlign: "center", color: "#666" }}>Inga prislistor ännu.</td></tr> :
                pricelists.map((p) => (<tr key={p.id} style={{ borderBottom: "1px solid #e2e2e2" }}>
                  <td style={td}>{p.name}</td>
                  <td style={td}>{p.default_percent != null ? `${p.default_percent} %` : "—"}</td>
                  <td style={td}>{p.customer_count || 0} st</td>
                  <td style={td}><a href="#" onClick={(e) => { e.preventDefault(); delPricelist(p) }} style={{ color: "#a00" }}>Ta bort</a></td></tr>))}</tbody>
            </table>
            <div style={{ fontWeight: 700, fontSize: "12px", margin: "14px 0 6px" }}>Ny prislista</div>
            <table style={{ borderCollapse: "collapse" }}><tbody>
              <Row label="Namn"><input style={{ ...inp, width: "220px" }} value={plName} onChange={(e) => setPlName(e.target.value)} /></Row>
              <Row label="Standardprocent*"><input style={{ ...inp, width: "70px" }} value={plPct} onChange={(e) => setPlPct(e.target.value)} /> %</Row>
            </tbody></table>
            <div style={{ marginTop: "10px" }}><button style={btn} onClick={savePricelist}>Skapa prislista</button></div>
            <p style={{ ...P, color: "#888", marginTop: "12px", fontSize: "11px" }}>* Standardprocent används för att omvandla produkternas standardpriser automatiskt när ett bestämt pris saknas för produkten i prislistan. Om standardprocent är 80, kommer prislistans pris vara 80% av produktens standardpris.</p>
          </div>
        )}

        {/* VILLKOR FÖR ANSÖKAN */}
        {tab === "Villkor för ansökan" && (
          <div style={{ maxWidth: "640px", margin: "0 auto" }}>
            <div style={{ fontWeight: 700, fontSize: "13px", textAlign: "center", margin: "0 0 10px" }}>VILLKOR FÖR ANSÖKAN</div>
            <p style={P}>Här kan du styra villkorstexten som visas för besökare som ansöker om att bli avtalskund via butiken. Texten visas i ansökningsformuläret på webbplatsen.</p>
            <p style={{ ...P, color: "#888" }}>Villkorstext-redigeraren kopplas in i nästa steg (kräver en publik ansökningssida på storefront). Avtalskunder som läggs in här via "Ny avtalskund" fungerar redan fullt ut.</p>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "22px", fontSize: "12px" }}>
          <a href={`${ADMIN}/kunddatabas`} style={{ color: "#0060cc", marginRight: "14px" }}>Till kunddatabasen</a>
          <a href={`${ADMIN}/kontrollpanel`} style={{ color: "#0060cc" }}>◄ Till kontrollpanelen</a>
        </div>
      </div>
    </div>
  )
}
export const config = defineRouteConfig({ label: "Avtalskunder", icon: RetailIcon })
export default AvtalskunderPage
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"

/**
 * Teknikhouse.se — Avtalskunder (1:1 mirror of Wikinggruppen retail.php)
 * B2B/wholesale customers + price lists. Tabs: Ny avtalskund | Avtalskunder |
 * Prislistor | Villkor för ansökan. Raw-SQL tables retail_customer / retail_pricelist.
 */
const RetailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
async function jget(u: string) { return fetch(u, { credentials: "include" }).then((r) => r.json()) }
async function jsend(u: string, m: string, b?: any) { return fetch(u, { method: m, credentials: "include", headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined }).then((r) => r.json()) }

const COUNTRIES = ["Sverige", "Norge", "Danmark", "Finland", "Tyskland", "Storbritannien", "Nederländerna", "Polen", "Estland", "USA", "Övriga"]
const TABS = ["Ny avtalskund", "Avtalskunder", "Prislistor", "Villkor för ansökan"]

function AvtalskunderPage() {
  const [meta, setMeta] = useState<{ online: number | null; unread: number }>({ online: null, unread: 0 })
  const [tab, setTab] = useState("Ny avtalskund")
  const [customers, setCustomers] = useState<any[]>([])
  const [pricelists, setPricelists] = useState<any[]>([])
  const [note, setNote] = useState("")
  // new/edit customer form
  const empty = { id: "", orgnr: "", company_name: "", first_name: "", last_name: "", street: "", zip_code: "", city: "", country: "Sverige", telephone: "", cellphone: "", email: "", free_shipping: false, pricelist_id: "" }
  const [f, setF] = useState<any>({ ...empty })
  // pricelist form
  const [plName, setPlName] = useState(""); const [plPct, setPlPct] = useState("")

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
    try { const d = await jget("/admin/retail/customers"); setCustomers(d.customers || []); setPricelists(d.pricelists || []) } catch {}
  }
  useEffect(() => { load() }, [])

  const saveCustomer = async () => {
    if (!f.company_name && !f.first_name && !f.email) { setNote("Ange minst företagsnamn eller e-post."); return }
    const body = { ...f }; delete body.id; delete body.pricelist_name
    if (f.id) { const r = await jsend(`/admin/retail/customers/${f.id}`, "POST", body); if (r.customer) { setNote("Avtalskund uppdaterad."); setF({ ...empty }); setTab("Avtalskunder"); load() } }
    else { const r = await jsend("/admin/retail/customers", "POST", body); if (r.customer) { setNote("Avtalskund tillagd."); setF({ ...empty }); setTab("Avtalskunder"); load() } else setNote("Kunde inte spara.") }
  }
  const editCustomer = (c: any) => { setF({ ...empty, ...c, free_shipping: !!c.free_shipping, pricelist_id: c.pricelist_id || "" }); setTab("Ny avtalskund") }
  const delCustomer = async (c: any) => { if (!confirm(`Ta bort avtalskund "${c.company_name || c.email}"?`)) return; await jsend(`/admin/retail/customers/${c.id}`, "DELETE"); load() }
  const savePricelist = async () => {
    if (!plName.trim()) { setNote("Ange namn på prislistan."); return }
    const r = await jsend("/admin/retail/pricelists", "POST", { name: plName, default_percent: plPct === "" ? null : Number(plPct) })
    if (r.pricelist) { setPlName(""); setPlPct(""); load() }
  }
  const delPricelist = async (p: any) => { if (!confirm(`Ta bort prislistan "${p.name}"?`)) return; await jsend(`/admin/retail/pricelists/${p.id}`, "DELETE"); load() }

  const inp: any = { fontFamily: WF, fontSize: "12px", padding: "4px 6px", border: "1px solid #bbb", borderRadius: "2px" }
  const btn: any = { fontFamily: WF, fontSize: "12px", padding: "5px 16px", border: "1px solid #999", borderRadius: "3px", background: "#f0f0f0", cursor: "pointer" }
  const P: any = { fontSize: "12px", color: "#333", lineHeight: 1.6, margin: "0 0 8px" }
  const th: any = { border: "1px solid #bbb", padding: "6px 8px", fontWeight: 700, fontSize: "11px", textAlign: "left", background: "#cccccc" }
  const td: any = { border: "1px solid #e2e2e2", padding: "5px 8px", fontSize: "12px" }
  const Row = ({ label, children }: any) => (
    <tr><td style={{ ...td, border: "none", textAlign: "right", color: "#333", width: "180px", paddingRight: "10px", whiteSpace: "nowrap" }}>{label}</td><td style={{ ...td, border: "none" }}>{children}</td></tr>
  )
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })

  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", display: "flex", minHeight: "600px", fontFamily: WF }}>
      <Snabbmeny online={meta.online} unread={meta.unread} active="Avtalskunder" />
      <div style={{ flex: 1, minWidth: 0, padding: "16px 22px" }}>
        <div style={{ textAlign: "center", marginBottom: "14px" }}>
          <span style={{ fontSize: "22px", verticalAlign: "middle", marginRight: "8px" }}>👥</span>
          <span style={{ fontSize: "16px", fontWeight: 700, verticalAlign: "middle" }}>AVTALSKUNDER</span>
        </div>
        {/* tab bar */}
        <div style={{ display: "flex", gap: "2px", borderBottom: "2px solid #999", marginBottom: "16px" }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => { setTab(t); setNote(""); if (t !== "Ny avtalskund" && !f.id) {} }}
              style={{ fontFamily: WF, fontSize: "12px", padding: "6px 14px", cursor: "pointer", border: "1px solid #999", borderBottom: "none",
                borderRadius: "3px 3px 0 0", background: tab === t ? "#fff" : "#e2e2e2", fontWeight: tab === t ? 700 : 400,
                position: "relative", top: "2px" }}>{t === "Ny avtalskund" && f.id ? "Ändra avtalskund" : t}</button>
          ))}
        </div>
        {note && <div style={{ fontSize: "12px", color: "#036", marginBottom: "10px", textAlign: "center" }}>{note}</div>}

        {/* NY / ÄNDRA AVTALSKUND */}
        {tab === "Ny avtalskund" && (
          <div style={{ maxWidth: "620px", margin: "0 auto" }}>
            <div style={{ fontWeight: 700, fontSize: "13px", margin: "0 0 10px", textAlign: "center", color: "#555" }}>
              = {f.id ? "Ändra avtalskund" : "Lägga till ny avtalskund"} =
            </div>
            <table style={{ borderCollapse: "collapse", margin: "0 auto" }}><tbody>
              <Row label="Orgnr/persnr"><input style={{ ...inp, width: "200px" }} value={f.orgnr} onChange={set("orgnr")} /></Row>
              <Row label="Företagsnamn/Namn"><input style={{ ...inp, width: "260px" }} value={f.company_name} onChange={set("company_name")} /></Row>
              <Row label="Förnamn"><input style={{ ...inp, width: "200px" }} value={f.first_name} onChange={set("first_name")} /></Row>
              <Row label="Efternamn"><input style={{ ...inp, width: "200px" }} value={f.last_name} onChange={set("last_name")} /></Row>
              <Row label="Gatuadress"><input style={{ ...inp, width: "260px" }} value={f.street} onChange={set("street")} /></Row>
              <Row label="Postnr"><input style={{ ...inp, width: "100px" }} value={f.zip_code} onChange={set("zip_code")} /></Row>
              <Row label="Ort"><input style={{ ...inp, width: "200px" }} value={f.city} onChange={set("city")} /></Row>
              <Row label="Land"><select style={{ ...inp, width: "214px" }} value={f.country} onChange={set("country")}>{COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></Row>
              <Row label="Telefon"><input style={{ ...inp, width: "200px" }} value={f.telephone} onChange={set("telephone")} /></Row>
              <Row label="Mobiltelefon"><input style={{ ...inp, width: "200px" }} value={f.cellphone} onChange={set("cellphone")} /></Row>
              <Row label="E-post / Användarnamn"><input style={{ ...inp, width: "260px" }} value={f.email} onChange={set("email")} /></Row>
              <Row label="Gratis frakt"><input type="checkbox" checked={!!f.free_shipping} onChange={(e) => setF({ ...f, free_shipping: e.target.checked })} /></Row>
              <Row label="Prislista">
                <select style={{ ...inp, width: "214px" }} value={f.pricelist_id} onChange={set("pricelist_id")}>
                  <option value="">Standardpriser</option>
                  {pricelists.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Row>
            </tbody></table>
            <div style={{ textAlign: "center", marginTop: "14px" }}>
              <button style={btn} onClick={saveCustomer}>{f.id ? "Spara ändringar" : "Lägg till ny avtalskund"}</button>
              {f.id && <button style={{ ...btn, marginLeft: "8px" }} onClick={() => { setF({ ...empty }); setNote("") }}>Avbryt</button>}
            </div>
          </div>
        )}

        {/* AVTALSKUNDER LIST */}
        {tab === "Avtalskunder" && (
          <div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Företag / Namn</th><th style={th}>E-postadress</th><th style={th}>Ort</th><th style={th}>Prislista</th><th style={th}>Gratis frakt</th><th style={{ ...th, width: "120px" }}></th></tr></thead>
              <tbody>{customers.length === 0 ? <tr><td colSpan={6} style={{ ...td, textAlign: "center", color: "#666" }}>Inga avtalskunder ännu.</td></tr> :
                customers.map((c) => (<tr key={c.id} style={{ borderBottom: "1px solid #e2e2e2" }}>
                  <td style={td}>{c.company_name || `${c.first_name || ""} ${c.last_name || ""}`.trim() || "—"}</td>
                  <td style={td}>{c.email || "—"}</td>
                  <td style={td}>{c.city || "—"}</td>
                  <td style={td}>{c.pricelist_name || "Standardpriser"}</td>
                  <td style={td}>{c.free_shipping ? "Ja" : "Nej"}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); editCustomer(c) }} style={{ color: "#0060cc" }}>Ändra</a>
                    <span style={{ color: "#bbb" }}> | </span>
                    <a href="#" onClick={(e) => { e.preventDefault(); delCustomer(c) }} style={{ color: "#a00" }}>Ta bort</a>
                  </td></tr>))}</tbody>
            </table>
            <div style={{ marginTop: "12px", fontSize: "12px" }}>Totalt: <b>{customers.length}</b> avtalskunder.</div>
          </div>
        )}

        {/* PRISLISTOR */}
        {tab === "Prislistor" && (
          <div style={{ maxWidth: "640px", margin: "0 auto" }}>
            <div style={{ fontWeight: 700, fontSize: "13px", textAlign: "center", margin: "0 0 10px" }}>PRISLISTOR</div>
            <p style={P}>Här hanterar du butikens prislistor. När du skapar/hanterar en produkt sätter du dess standardpris. Prislistor kan användas för att göra avvikelser till dessa standardpriser. Flera avtalskunder kan använda samma prislista, men det går även bra att skapa en prislista till varje avtalskund — det är upp till dig. När du skapar/redigerar en avtalskund väljer du vilken prislista de ska höra till.</p>
            <table style={{ width: "100%", borderCollapse: "collapse", margin: "10px 0" }}>
              <thead><tr><th style={th}>Namn</th><th style={{ ...th, width: "140px" }}>Standardprocent*</th><th style={{ ...th, width: "120px" }}>Antal kunder</th><th style={{ ...th, width: "80px" }}></th></tr></thead>
              <tbody>{pricelists.length === 0 ? <tr><td colSpan={4} style={{ ...td, textAlign: "center", color: "#666" }}>Inga prislistor ännu.</td></tr> :
                pricelists.map((p) => (<tr key={p.id} style={{ borderBottom: "1px solid #e2e2e2" }}>
                  <td style={td}>{p.name}</td>
                  <td style={td}>{p.default_percent != null ? `${p.default_percent} %` : "—"}</td>
                  <td style={td}>{p.customer_count || 0} st</td>
                  <td style={td}><a href="#" onClick={(e) => { e.preventDefault(); delPricelist(p) }} style={{ color: "#a00" }}>Ta bort</a></td></tr>))}</tbody>
            </table>
            <div style={{ fontWeight: 700, fontSize: "12px", margin: "14px 0 6px" }}>Ny prislista</div>
            <table style={{ borderCollapse: "collapse" }}><tbody>
              <Row label="Namn"><input style={{ ...inp, width: "220px" }} value={plName} onChange={(e) => setPlName(e.target.value)} /></Row>
              <Row label="Standardprocent*"><input style={{ ...inp, width: "70px" }} value={plPct} onChange={(e) => setPlPct(e.target.value)} /> %</Row>
            </tbody></table>
            <div style={{ marginTop: "10px" }}><button style={btn} onClick={savePricelist}>Skapa prislista</button></div>
            <p style={{ ...P, color: "#888", marginTop: "12px", fontSize: "11px" }}>* Standardprocent används för att omvandla produkternas standardpriser automatiskt när ett bestämt pris saknas för produkten i prislistan. Om standardprocent är 80, kommer prislistans pris vara 80% av produktens standardpris.</p>
          </div>
        )}

        {/* VILLKOR FÖR ANSÖKAN */}
        {tab === "Villkor för ansökan" && (
          <div style={{ maxWidth: "640px", margin: "0 auto" }}>
            <div style={{ fontWeight: 700, fontSize: "13px", textAlign: "center", margin: "0 0 10px" }}>VILLKOR FÖR ANSÖKAN</div>
            <p style={P}>Här kan du styra villkorstexten som visas för besökare som ansöker om att bli avtalskund via butiken. Texten visas i ansökningsformuläret på webbplatsen.</p>
            <p style={{ ...P, color: "#888" }}>Villkorstext-redigeraren kopplas in i nästa steg (kräver en publik ansökningssida på storefront). Avtalskunder som läggs in här via "Ny avtalskund" fungerar redan fullt ut.</p>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "22px", fontSize: "12px" }}>
          <a href={`${ADMIN}/kunddatabas`} style={{ color: "#0060cc", marginRight: "14px" }}>Till kunddatabasen</a>
          <a href={`${ADMIN}/kontrollpanel`} style={{ color: "#0060cc" }}>◄ Till kontrollpanelen</a>
        </div>
      </div>
    </div>
  )
}
export const config = defineRouteConfig({ label: "Avtalskunder", icon: RetailIcon })
export default AvtalskunderPage
