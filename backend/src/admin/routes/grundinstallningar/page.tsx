import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

const CogIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const WRAP: any = { fontFamily: WF, fontSize: "13px", color: "#333", maxWidth: 900, margin: "0 auto", padding: "0 12px 60px" }
const BAR: any = { background: "#e6e6e6", border: "1px solid #bbb", borderBottom: "none", fontWeight: 700, fontSize: "14px", padding: "8px 12px", marginTop: 22 }
const BOX: any = { border: "1px solid #bbb", background: "#fff", padding: "14px 16px" }
const ROW: any = { padding: "10px 0", borderBottom: "1px solid #eee" }
const LBL: any = { display: "block", fontWeight: 700, marginBottom: 6 }
const HINT: any = { color: "#888", fontWeight: 400, fontSize: "12px" }
const INP: any = { width: "100%", maxWidth: 460, padding: "6px 8px", border: "1px solid #bbb", borderRadius: 3, fontFamily: WF, fontSize: "13px", boxSizing: "border-box" }
const TA: any = { ...INP, maxWidth: 640, minHeight: 90, fontFamily: "monospace" }
const OPT: any = { display: "block", padding: "3px 0", cursor: "pointer" }
const LINK: any = { color: "#2b6cb0", textDecoration: "none" }

function Section(props: any) {
  return (<div><div style={BAR}>{props.title}</div><div style={BOX}>{props.children}</div></div>)
}

const Page = () => {
  const [f, setF] = useState<any>({})
  const [msg, setMsg] = useState("")
  useEffect(() => {
    fetch("/admin/wiki-settings?group=config", { credentials: "include" })
      .then((r) => r.json()).then((j) => setF(j.data || {})).catch(() => {})
  }, [])
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }))
  const save = async () => {
    setMsg("Sparar...")
    const r = await fetch("/admin/wiki-settings", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ group: "config", data: f }) })
    setMsg(r.ok ? "Inställningarna sparades." : "Kunde inte spara.")
    setTimeout(() => setMsg(""), 3500)
  }

  const Text = (name: string, label: string, hint?: string, area?: boolean) => (
    <div style={ROW}>
      <label style={LBL}>{label}{hint ? <span style={HINT}> {hint}</span> : null}</label>
      {area
        ? <textarea style={TA} value={f[name] || ""} onChange={(e) => set(name, e.target.value)} />
        : <input style={INP} value={f[name] || ""} onChange={(e) => set(name, e.target.value)} />}
    </div>
  )
  const Radio = (name: string, label: string, opts: any[], hint?: string) => (
    <div style={ROW}>
      <label style={LBL}>{label}{hint ? <span style={HINT}> {hint}</span> : null}</label>
      {opts.map((o: any) => (
        <label key={o[0]} style={OPT}>
          <input type="radio" name={name} checked={String(f[name] ?? opts[0][0]) === String(o[0])} onChange={() => set(name, o[0])} /> {o[1]}
        </label>
      ))}
    </div>
  )
  const Select = (name: string, label: string, opts: any[]) => (
    <div style={ROW}>
      <label style={LBL}>{label}</label>
      <select style={{ ...INP, maxWidth: 200 }} value={String(f[name] ?? opts[0])} onChange={(e) => set(name, e.target.value)}>
        {opts.map((o: any) => <option key={o} value={String(o)}>{o}</option>)}
      </select>
    </div>
  )
  const JaNej = (name: string, label: string, hint?: string) => Radio(name, label, [["1", "Ja"], ["0", "Nej"]], hint)

  return (
    <div style={WRAP}>
      <Snabbmeny active="Grundinställningar" />
      <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "16px 0 4px" }}>Grundinställningar</h1>
      <p style={{ color: "#777", margin: "0 0 8px" }}>Butikens grundinställningar – motsvarar Wikinggruppens config.</p>

      <Section title="Kontaktuppgifter">
        {Text("companyName", "Företagsnamn")}
        {Text("orgNumber", "Organisationsnummer")}
        {Text("address", "Adress", "", true)}
        {Text("telephoneNumber", "Telefonnummer")}
        {Text("emailContact", "Epost för kontakt")}
        {Text("emailOrder", "Epost för ordrar")}
        {Text("emailNewsletter", "Epost för nyhetsbrev")}
        {Text("emailReturn", "Epost för retur/reklamation")}
        {Text("emailSubject", "Subject på kontakt-epost")}
        <div style={ROW}>
          <label style={LBL}>Avancerat</label>
          <a href={ADMIN + "/smtp"} style={LINK}>Inställningar för e-postutskick (SMTP) »</a>
        </div>
      </Section>

      <Section title="Presentation">
        {Radio("productListGallery", "Listning av produkter", [["gallery", "Galleri"], ["list", "Lista"]])}
        {Radio("buyButtonAction", "Klick på köpknapp", [["stay_fly", "Stanna på sidan med flygande produktbild"], ["stay", "Stanna på sidan utan flygande produktbild"], ["checkout", "Ladda kassan direkt"]])}
        {JaNej("wishlistActive", "Använd önskelista")}
        {JaNej("showSubCategories", "Visa bilder för undergrupper")}
        {JaNej("showSortingOptions", "Visa sorteringsfunktioner")}
        {JaNej("showProductDirectLink", "Visa direktlänk på produktsidan")}
        {JaNej("socialButtonsActive", "Visa delningsknappar på produktsidan")}
        {JaNej("HTMLDescriptions", "HTML-editor för produkt- och varugruppsbeskrivning samt nyhetsinlägg")}
        {JaNej("stockRemindersActive", "Erbjud bevakning av produkter som är slut i lager", "[info]")}
        {Radio("newsletterInCheckout", "Erbjud nyhetsbrev i kassan", [["checked", "Ja, visa kryssruta (ikryssad)"], ["unchecked", "Ja, visa kryssruta (urkryssad)"], ["off", "Nej, visa inget"], ["always", "Lägg alltid till beställare som mottagare"]])}
        {JaNej("backToTopButton", "Visa 'Tillbaka till toppen'-knapp")}
        {JaNej("mobilePicker", "Visa mobilväljare")}
      </Section>

      <Section title="Villkor">
        {Radio("showCompanySelector", "Kundtyper i kassan", [["both", "Både privat och företag"], ["private", "Bara privat"], ["company", "Bara företag"]])}
        {JaNej("clientSignInActive", "Tillåt kundinloggning")}
        {JaNej("retailSignInActive", "Tillåt avtalskunder")}
        {JaNej("discountsActive", "Tillåt rabattkoder")}
        {Text("minOrder_SEK", "Minimiorder")}
        {JaNej("requireCheckedTerms", "Kräv ikryssad ruta för att godkänna villkor i kassan")}
        {JaNej("cookieBannerActive", "Visa banner om cookies")}
        {JaNej("cookieControlWikingActive", "Använd cookie control istället")}
      </Section>

      <Section title="Order- och prishantering">
        {Select("ordersPerPage", "Orderlistan: antal ordrar per sida", [25, 50, 100, 200, 300])}
        {JaNej("staggeringActive", "Aktivera stafflande priser för produkter och prislistor", "[info]")}
        {Radio("selectableVATMode", "Momsläge för slutkund (moms redovisas alltid i kassan)", [["sel_incl", "Valbart, inkl. moms förvalt"], ["sel_excl", "Valbart, exkl. moms förvalt"], ["incl", "Inkl. moms"], ["excl", "Exkl. moms"]])}
      </Section>

      <Section title="Uppföljning och statistik">
        {JaNej("logVisitors", "Räkna 'besökare just nu'")}
        <div style={ROW}>
          <label style={LBL}>Uppföljningsmail <span style={HINT}>[info]</span></label>
          <div>Skicka <input style={{ ...INP, width: 70, display: "inline-block" }} value={f["followupDiscount"] || ""} onChange={(e) => set("followupDiscount", e.target.value)} /> % rabattkod automatiskt efter <input style={{ ...INP, width: 70, display: "inline-block" }} value={f["followupAutoDays"] || ""} onChange={(e) => set("followupAutoDays", e.target.value)} /> dagar.</div>
        </div>
        {Text("googleAnalyticsID", "Google Analytics-ID")}
        {Text("googleTagManagerID", "Google Tag Manager ID")}
        {Text("facebookPixelID", "Facebook Pixel ID")}
        {Text("counterCodeEarly", "Egen HTML/Javascript (ej Google Analytics/GTM) som infogas i början av <body>", "", true)}
        {Text("counterCode", "Egen HTML/Javascript (ej Google Analytics/GTM) som infogas innan </body>", "", true)}
        {Text("extraHeadCode", "Egen HTML/Javascript inom <head> t.ex. meta-tagg för verifikation hos Google", "", true)}
        {Text("trackerCode", "Trackerkod för godkända köp (visas på sidan 'tack för din order')", "", true)}
      </Section>

      <Section title="Sökmotoroptimering">
        <div style={ROW}>
          <label style={LBL}>Meta-data</label>
          <a href={ADMIN + "/redigerbara-sidor"} style={LINK}>Redigera meta-data för statiska sidor »</a>
        </div>
      </Section>

      <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={save} style={{ background: "#c00", color: "#fff", border: "none", padding: "10px 22px", fontWeight: 700, borderRadius: 3, cursor: "pointer", fontFamily: WF }}>Spara inställningar</button>
        {msg ? <span style={{ color: "#127b12", fontWeight: 700 }}>{msg}</span> : null}
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Grundinställningar (Wiki)", icon: CogIcon })
export default Page
