import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

const CogIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const TOGGLES: [string, string][] = [
  ["productListGallery", "Visa produkter i galleri-läge"],
  ["buyButtonAction", "Köp-knapp går direkt till kassan"],
  ["wishlistActive", "Aktivera önskelista"],
  ["showSubCategories", "Visa underkategorier"],
  ["showSortingOptions", "Visa sorteringsval"],
  ["showProductDirectLink", "Visa direktlänk till produkt"],
  ["socialButtonsActive", "Visa delningsknappar"],
  ["HTMLDescriptions", "Tillåt HTML i beskrivningar"],
  ["stockRemindersActive", "Aktivera lagerpåminnelser"],
  ["newsletterInCheckout", "Erbjud nyhetsbrev i kassan"],
  ["backToTopButton", "Visa \"Till toppen\"-knapp"],
  ["mobilePicker", "Aktivera mobilanpassad väljare"],
  ["showCompanySelector", "Visa företagsväljare"],
  ["clientSignInActive", "Tillåt inloggning för privatkunder"],
  ["retailSignInActive", "Tillåt inloggning för avtalskunder"],
  ["discountsActive", "Aktivera rabattkoder"],
  ["requireCheckedTerms", "Kräv godkända köpvillkor"],
  ["cookieBannerActive", "Visa cookie-banner"],
  ["cookieControlWikingActive", "Aktivera cookie-kontroll"],
  ["staggeringActive", "Aktivera stafflad prissättning"],
  ["selectableVATMode", "Låt kund välja momsvisning"],
  ["logVisitors", "Logga besökare"],
]

function GrundPage() {
  const [f, setF] = useState<any>({})
  const [msg, setMsg] = useState("")
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }))

  useEffect(() => {
    fetch("/admin/wiki-settings?group=config", { credentials: "include" }).then((r) => r.json()).then((j) => setF(j.data || {})).catch(() => {})
  }, [])
  const save = async () => {
    setMsg("Sparar…")
    const r = await fetch("/admin/wiki-settings", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ group: "config", data: f }) })
    const j = await r.json(); setMsg(j.ok ? "✔ Grundinställningar sparade." : "Fel: " + (j.error || ""))
  }

  const lbl: any = { fontSize: "12px", fontWeight: 700, display: "block", margin: "10px 0 3px" }
  const inp: any = { padding: "6px 8px", border: "1px solid #bbb", borderRadius: "3px", fontSize: "12px", fontFamily: WF, width: "100%", boxSizing: "border-box" }
  const sect: any = { fontSize: "13px", fontWeight: 700, margin: "20px 0 6px", borderBottom: "2px solid #ccc", paddingBottom: "4px" }
  const btn: any = { padding: "8px 20px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "13px", fontWeight: 700 }
  const card: any = { background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", margin: "0 0 12px" }

  const T = (name: string) => (
    <label style={{ display: "inline-flex", gap: "4px", alignItems: "center", marginRight: "16px", fontSize: "12px" }}>
      <input type="radio" checked={f[name] === "1"} onChange={() => set(name, "1")} /> Ja
      <input type="radio" style={{ marginLeft: "8px" }} checked={f[name] !== "1"} onChange={() => set(name, "0")} /> Nej
    </label>
  )
  const txt = (name: string, w = "100%") => <input style={{ ...inp, maxWidth: w }} value={f[name] || ""} onChange={(e) => set(name, e.target.value)} />

  return (
    <div style={{ display: "flex", fontFamily: WF }}>
      <Snabbmeny active="Grundinställningar" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={card}>
          <div style={{ background: "#f4f4f4", borderBottom: "1px solid #ddd", padding: "10px 16px", fontWeight: 700, fontSize: "14px" }}>⚞️ Grundinställningar</div>
          <div style={{ padding: "16px", maxWidth: "860px" }}>
            {msg && <div style={{ padding: "8px 10px", marginBottom: "10px", borderRadius: "3px", background: msg.startsWith("Fel") ? "#fdecea" : "#e8f5e9", color: msg.startsWith("Fel") ? "#a00" : "#256029", fontSize: "12px" }}>{msg}</div>}

            <div style={sect}>Företagsuppgifter</div>
            <label style={lbl}>Företagsnamn</label>{txt("companyName")}
            <label style={lbl}>Organisationsnummer</label>{txt("orgNumber", "260px")}
            <label style={lbl}>Adress</label><textarea style={{ ...inp, height: "60px" }} value={f.address || ""} onChange={(e) => set("address", e.target.value)} />
            <label style={lbl}>Telefonnummer</label>{txt("telephoneNumber", "260px")}

            <div style={sect}>E-postadresser</div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "220px" }}><label style={lbl}>Kontakt-e-post</label>{txt("emailContact")}</div>
              <div style={{ flex: 1, minWidth: "220px" }}><label style={lbl}>Order-e-post</label>{txt("emailOrder")}</div>
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "220px" }}><label style={lbl}>Nyhetsbrev-e-post</label>{txt("emailNewsletter")}</div>
              <div style={{ flex: 1, minWidth: "220px" }}><label style={lbl}>Retur-e-post</label>{txt("emailReturn")}</div>
            </div>
            <label style={lbl}>E-postämne (orderbekräftelse)</label>{txt("emailSubject")}

            <div style={sect}>Butiksbeteende</div>
            {TOGGLES.map(([name, label]) => (
              <div key={name} style={{ display: "flex", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #f2f2f2" }}>
                <div style={{ width: "300px", fontSize: "12px" }}>{label}</div>{T(name)}
              </div>
            ))}

            <div style={sect}>Övrigt</div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ minWidth: "160px" }}><label style={lbl}>Lägsta ordervärde (kr)</label>{txt("minOrder_SEK", "150px")}</div>
              <div style={{ minWidth: "160px" }}><label style={lbl}>Ordrar per sida</label>
                <select style={{ ...inp, maxWidth: "150px" }} value={f.ordersPerPage || "50"} onChange={(e) => set("ordersPerPage", e.target.value)}>
                  {["25", "50", "100", "200", "300"].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ minWidth: "160px" }}><label style={lbl}>Uppföljningsrabatt (%)</label>{txt("followupDiscount", "120px")}</div>
              <div style={{ minWidth: "160px" }}><label style={lbl}>Uppföljning efter (dagar)</label>{txt("followupAutoDays", "120px")}</div>
            </div>

            <div style={sect}>Spårning &amp; kod</div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "200px" }}><label style={lbl}>Google Analytics-ID</label>{txt("googleAnalyticsID")}</div>
              <div style={{ flex: 1, minWidth: "200px" }}><label style={lbl}>Google Tag Manager-ID</label>{txt("googleTagManagerID")}</div>
              <div style={{ flex: 1, minWidth: "200px" }}><label style={lbl}>Facebook Pixel-ID</label>{txt("facebookPixelID")}</div>
            </div>
            <label style={lbl}>Extra kod i &lt;head&gt;</label><textarea style={{ ...inp, height: "70px", fontFamily: "monospace" }} value={f.extraHeadCode || ""} onChange={(e) => set("extraHeadCode", e.target.value)} />
            <label style={lbl}>Egen HTML/JavaScript tidigt i sidhuvudet (ej Google Analytics/GTM)</label><textarea style={{ ...inp, height: "60px", fontFamily: "monospace" }} value={f.counterCodeEarly || ""} onChange={(e) => set("counterCodeEarly", e.target.value)} />
            <label style={lbl}>Egen HTML/JavaScript i sidfoten (ej Google Analytics/GTM)</label><textarea style={{ ...inp, height: "60px", fontFamily: "monospace" }} value={f.counterCode || ""} onChange={(e) => set("counterCode", e.target.value)} />
            <label style={lbl}>Trackerkod för godkända köp (visas på tack-sidan)</label><textarea style={{ ...inp, height: "60px", fontFamily: "monospace" }} value={f.trackerCode || ""} onChange={(e) => set("trackerCode", e.target.value)} />

            <div style={{ marginTop: "16px" }}><button style={btn} onClick={save}>Spara grundinställningar</button></div>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: "12px" }}><a href={`${ADMIN}/kontrollpanel`} style={{ color: "#06c" }}>◄ Till kontrollpanelen</a></div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Grundinställningar (Wiki)", icon: CogIcon })
export default GrundPage
