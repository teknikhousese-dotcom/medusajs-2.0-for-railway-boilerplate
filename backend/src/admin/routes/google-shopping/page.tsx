import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

const TagIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
)

function GoogleShoppingPage() {
  const [mode, setMode] = useState(0)
  const [cat, setCat] = useState("")
  const [feedUrl, setFeedUrl] = useState("")
  const [invUrl, setInvUrl] = useState("")
  const [msg, setMsg] = useState("")

  const load = async () => {
    const j = await fetch("/admin/google-feed", { credentials: "include" }).then((x) => x.json()).catch(() => null)
    if (j) {
      setMode(Number(j.settings?.feed_mode) || 0)
      setCat(j.settings?.universal_category || "")
      setFeedUrl(j.feed_url || "")
      setInvUrl(j.inventory_feed_url || "")
    }
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    setMsg("Sparar…")
    await fetch("/admin/google-feed", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ feed_mode: mode, universal_category: cat }) })
    setMsg("Inställningarna sparades.")
  }

  const inp: any = { padding: "5px 7px", border: "1px solid #bbb", borderRadius: "3px", fontSize: "12px", fontFamily: WF }
  const btn: any = { padding: "6px 14px", background: "#4a90d9", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "12px" }
  const h2: any = { fontSize: "13px", fontWeight: 700, margin: "18px 0 6px", borderBottom: "1px solid #eee", paddingBottom: "4px" }
  const p: any = { fontSize: "12px", color: "#444", lineHeight: 1.6, margin: "0 0 8px" }
  const urlBox: any = { display: "block", background: "#f4f4f4", border: "1px solid #ddd", borderRadius: "3px", padding: "7px 9px", fontSize: "12px", fontFamily: "monospace", color: "#036", wordBreak: "break-all", margin: "4px 0 8px" }

  return (
    <div style={{ display: "flex", fontFamily: WF }}>
      <Snabbmeny active="Google Shopping" />
      <div style={{ flex: 1 }}>
        <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", margin: "0 0 12px" }}>
          <div style={{ background: "#f4f4f4", borderBottom: "1px solid #ddd", padding: "10px 16px", fontWeight: 700, fontSize: "14px" }}>🛍️ Google Produktfeed</div>
          <div style={{ padding: "16px", maxWidth: "760px" }}>

            <div style={h2}>Allmän information</div>
            <p style={p}>Butiksystemet tillhandahåller en produktlista (produktfeed) som kan användas bland annat i Google Shopping, Facebook och andra nätverk för att bli klickbara annonser där.</p>
            <p style={p}>I detta feed finns vissa attribut som inte används på andra ställen i butiken, såsom Googles produktkategori. Även om inte alla attribut är obligatoriska så är det rekommenderat att ge så mycket information som möjligt för bättre visning i annonserna/resultatet.</p>
            <p style={p}>De flesta attributen plockas automatiskt från produkterna i butiken. Ni kan ange Googles produktkategori när ni redigerar en varugrupp, så kommer alla produkter i den gruppen använda angiven kategori. Det går även att ange produktkategori för enskilda produkter.</p>
            <p style={p}>Använd masshanteringen under <a href={`${ADMIN}/hantera-produkter`} style={{ color: "#06c" }}>Hantera produkter</a> för att ställa in parametrarna för Googles produktfeed. För mer information om vad de olika fälten betyder, se följande länkar:</p>
            <ul style={{ fontSize: "12px", lineHeight: 1.8, margin: "0 0 8px 18px" }}>
              <li><a href="https://support.google.com/merchants/answer/188494?hl=sv" target="_blank" rel="noreferrer" style={{ color: "#06c" }}>Specifikation för produktfeed</a></li>
              <li><a href="https://support.google.com/merchants/answer/188484" target="_blank" rel="noreferrer" style={{ color: "#06c" }}>Googles policy för produktdata</a></li>
              <li><a href="https://www.google.com/basepages/producttype/taxonomy.en-US.txt" target="_blank" rel="noreferrer" style={{ color: "#06c" }}>Fullständig lista av produktkategorier</a></li>
            </ul>

            <div style={h2}>Vilka produkter ska kopplas?</div>
            <label style={{ display: "block", fontSize: "12px", margin: "4px 0", cursor: "pointer" }}>
              <input type="radio" name="mode" checked={mode === 0} onChange={() => setMode(0)} /> Alla med angiven Google produktkategori
            </label>
            <label style={{ display: "block", fontSize: "12px", margin: "4px 0", cursor: "pointer" }}>
              <input type="radio" name="mode" checked={mode === 1} onChange={() => setMode(1)} /> Alla, även om Google produktkategori saknas
            </label>

            <div style={h2}>Universell Google produktkategori</div>
            <p style={p}>Värdet du anger här kommer gälla i de fall angiven produktkategori saknas för en varugrupp eller produkt.</p>
            <input style={{ ...inp, width: "100%", boxSizing: "border-box", maxWidth: "480px" }} value={cat} onChange={(e) => setCat(e.target.value)} placeholder="t.ex. Electronics > Communications > Telephony > Mobile Phones" />

            <div style={{ margin: "16px 0" }}>
              <button style={btn} onClick={save}>Spara inställningar</button>
              {msg && <span style={{ marginLeft: "10px", fontSize: "12px", color: "#036" }}>{msg}</span>}
            </div>

            <div style={h2}>Adress till produktfeed</div>
            <p style={p}>Denna adress ska kopplas in i Google Merchant Center:</p>
            <code style={urlBox}>{feedUrl || "—"}</code>

            <div style={h2}>Feed för uppdatering av lager/pris</div>
            <p style={p}>Google kan läsa ett extra feed som bara innehåller id, lagerstatus och pris. Då skapar ni ett extra feed i Merchant Center med typen "Lageruppdatering – onlineprodukter" och anger följande adress:</p>
            <code style={urlBox}>{invUrl || "—"}</code>

            <div style={h2}>Status för kopplade produkter</div>
            <p style={p}>Genom att logga in på Google Merchant Center kan ni se status för produkterna i feedet samt eventuell anledning till att vissa produkter blivit nekade.</p>

          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: "12px" }}><a href={`${ADMIN}/kontrollpanel`} style={{ color: "#06c" }}>◄ Till kontrollpanelen</a></div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Google Shopping", icon: TagIcon })
export default GoogleShoppingPage
