import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { WF, Snabbmeny } from "../../lib/butikadmin"

const BagIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
)

const OUTER: any = { display: "flex", minHeight: "600px", background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden" }
const INNER: any = { flex: 1, fontFamily: WF, fontSize: "12px", color: "#222", padding: "0 0 60px", minWidth: 0 }
const HEAD: any = { display: "flex", alignItems: "center", gap: 9, padding: "16px 18px 2px" }
const BAR: any = { background: "#dddddd", padding: "5px 14px", fontWeight: 700, fontSize: "12.5px", color: "#000", marginTop: 16, borderTop: "1px solid #cfcfcf", borderBottom: "1px solid #cfcfcf" }
const BODY: any = { padding: "10px 18px" }
const INP: any = { flex: 1, minWidth: 0, padding: "7px 9px", border: "1px solid #bcbcbc", borderRadius: 4, fontFamily: "monospace", fontSize: "12px", background: "#f7f8fa", color: "#111" }
const BTN: any = { background: "#c00", color: "#fff", border: "none", padding: "8px 16px", fontWeight: 700, borderRadius: 4, cursor: "pointer", fontFamily: WF, fontSize: "12px", whiteSpace: "nowrap" }
const BTN2: any = { background: "#f3f3f3", color: "#2b6cb0", border: "1px solid #cbd5e1", padding: "8px 16px", fontWeight: 700, borderRadius: 4, cursor: "pointer", fontFamily: WF, fontSize: "12px", textDecoration: "none", whiteSpace: "nowrap" }
const STAT: any = { border: "1px solid #eee", borderRadius: 6, padding: "12px 14px", background: "#fafbfc", minWidth: 120 }
const CHECK: any = { color: "#127b12", fontWeight: 800, marginRight: 7 }

const ATTRS: any[] = [
  ["id", "Unikt produkt-ID (SKU)"],
  ["title", "Titel – varumärke + modell (max 150 tecken)"],
  ["description", "Ren beskrivning (HTML borttaget, max 5000 tecken)"],
  ["link / mobile_link", "Direktlänk till produktsidan"],
  ["image_link", "Huvudbild"],
  ["additional_image_link", "Upp till 10 extra produktbilder"],
  ["availability", "Lagerstatus (in_stock / out_of_stock)"],
  ["price", "Ordinarie pris i SEK, inkl. moms"],
  ["sale_price", "Reapris – sätts automatiskt när produkten är på REA"],
  ["brand", "Varumärke (Apple, Samsung, …)"],
  ["condition", "Skick (new / used / refurbished)"],
  ["gtin", "EAN/UPC när streckkod finns"],
  ["mpn", "Tillverkarens artikelnummer / SKU"],
  ["identifier_exists", "Sätts till 'no' när varken GTIN eller MPN finns"],
  ["google_product_category", "Googles produktkategori (auto-mappad från titel)"],
  ["product_type", "Din egen kategoristig"],
  ["custom_label_0-2", "Varumärke, REA-flagga och kategori – för kampanjstyrning"],
]

function Section(props: any) {
  return (<div><div style={BAR}>{props.title}</div><div style={BODY}>{props.children}</div></div>)
}

const Page = () => {
  const [count, setCount] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const feedUrl = (typeof window !== "undefined" ? window.location.origin : "") + "/google-feed"
  useEffect(() => {
    fetch("/admin/products?limit=1&status[]=published", { credentials: "include" }).then((r) => r.json()).then((j) => setCount(j.count)).catch(() => {})
  }, [])
  const copy = () => { try { navigator.clipboard.writeText(feedUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch (e) {} }

  return (
    <div style={OUTER}>
      <Snabbmeny active="Google Shopping" />
      <div style={INNER}>
        <div style={HEAD}>
          <img src="https://www.google.com/favicon.ico" width={22} height={22} alt="Google" style={{ display: "block" }} onError={(e: any) => { e.currentTarget.style.display = "none" }} />
          <h1 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Google Shopping – Produktflöde</h1>
        </div>
        <p style={{ color: "#666", margin: 0, padding: "4px 18px 0", fontSize: "12.5px" }}>Ett komplett, modernt produktflöde (RSS 2.0) enligt Googles senaste produktdataspecifikation – redo att skickas till Google Merchant Center för Shopping-annonser och gratis produktlistningar.</p>

        <Section title="Feed-URL">
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <input readOnly value={feedUrl} style={INP} onFocus={(e: any) => e.target.select()} />
            <button style={BTN} onClick={copy}>{copied ? "Kopierat!" : "Kopiera"}</button>
            <a style={BTN2} href={feedUrl} target="_blank" rel="noreferrer">Öppna feed »</a>
          </div>
          <p style={{ color: "#888", fontSize: "11.5px", marginTop: 8 }}>Klistra in denna URL i Google Merchant Center → Produkter → Datakällor → Lägg till → Schemalagd hämtning (rekommenderat: daglig). Feeden uppdateras automatiskt varje timme.</p>
        </Section>

        <Section title="Innehåll">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={STAT}><div style={{ fontSize: "22px", fontWeight: 800, color: "#c00" }}>{count == null ? "…" : count.toLocaleString("sv-SE")}</div><div style={{ color: "#777" }}>publicerade produkter</div></div>
            <div style={STAT}><div style={{ fontSize: "22px", fontWeight: 800 }}>SEK</div><div style={{ color: "#777" }}>valuta, inkl. moms</div></div>
            <div style={STAT}><div style={{ fontSize: "22px", fontWeight: 800 }}>Sverige</div><div style={{ color: "#777" }}>målland</div></div>
            <div style={STAT}><div style={{ fontSize: "22px", fontWeight: 800 }}>RSS 2.0</div><div style={{ color: "#777" }}>XML-format (g:-namespace)</div></div>
          </div>
        </Section>

        <Section title="Attribut som ingår i varje produkt">
          <div style={{ columnWidth: 330, columnGap: 26 }}>
            {ATTRS.map((a: any) => (
              <div key={a[0]} style={{ breakInside: "avoid", padding: "3px 0", fontSize: "12px" }}>
                <span style={CHECK}>✓</span><code style={{ background: "#eef2f7", padding: "1px 5px", borderRadius: 3, color: "#2b4a6f" }}>{a[0]}</code> <span style={{ color: "#555" }}>{a[1]}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Så här kopplar du feeden i Google Merchant Center">
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7, color: "#444" }}>
            <li>Öppna Google Merchant Center och verifiera domänen teknikhouse.se.</li>
            <li>Gå till Produkter → Datakällor → Lägg till produktdatakälla.</li>
            <li>Välj “Schemalagd hämtning” och klistra in feed-URL:en ovan.</li>
            <li>Ställ in hämtning till daglig och land = Sverige, valuta = SEK.</li>
            <li>Spara – Google läser in alla produkter automatiskt.</li>
          </ol>
        </Section>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Google Shopping", icon: BagIcon })
export default Page
