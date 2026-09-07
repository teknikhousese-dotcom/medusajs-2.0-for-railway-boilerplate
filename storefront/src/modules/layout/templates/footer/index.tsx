import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Teknikhouse footer — fully own-branded. No third-party credits.
const CSS = `
.thf{background:#0B0C10;color:#AEB6C4;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5}
.thf *{box-sizing:border-box}
.thf .w{max-width:1200px;margin:0 auto;padding:44px 20px 26px}
.thf a{color:#98A1B0;text-decoration:none;display:block;margin:6px 0}
.thf a:hover{color:#fff}
.thf .grid{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:24px}
.thf h5{color:#fff;font-size:13px;text-transform:uppercase;letter-spacing:.06em;margin:0 0 12px}
.thf .brand{font-weight:900;font-size:22px;color:#fff;letter-spacing:-.04em;margin-bottom:12px}
.thf .brand .h{color:#F50000}
.thf .desc{max-width:300px;color:#98A1B0;margin:0 0 14px}
.thf .pay{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.thf .pay span{background:#fff;color:#111;border-radius:6px;padding:4px 8px;font-size:11px;font-weight:800}
.thf .bot{border-top:1px solid #1f2530;margin-top:26px;padding-top:18px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:12px;color:#6b7280}
.thf .bot b{color:#98A1B0;font-weight:600}
@media(max-width:820px){.thf .grid{grid-template-columns:1fr 1fr}}
`

export default async function Footer() {
  return (
    <footer className="thf">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="w">
        <div className="grid">
          <div>
            <div className="brand">teknik<span className="h">house</span></div>
            <p className="desc">Nordic Teknik House AB, Stockholm. Sveriges bredaste sortiment av reservdelar, tillbehör och begagnade mobiler. Rätt del, första gången.</p>
            <div className="pay"><span>Swish</span><span>Klarna</span><span>VISA</span><span>Mastercard</span></div>
            <div className="pay" style={{ marginTop: "8px" }}><span>PostNord</span><span>DHL</span></div>
          </div>
          <div>
            <h5>Handla</h5>
            <LocalizedClientLink href="/kundtjanst">Kundtjänst</LocalizedClientLink>
            <LocalizedClientLink href="/info/villkor">Köpvillkor</LocalizedClientLink>
            <LocalizedClientLink href="/info/oppet-kop-retur">Öppet köp &amp; Retur</LocalizedClientLink>
            <LocalizedClientLink href="/retur">Anmäl retur</LocalizedClientLink>
            <LocalizedClientLink href="/info/salj-din-enhet">Sälj din enhet</LocalizedClientLink>
            <LocalizedClientLink href="/info/phone-rep">Phone Rep (Butik)</LocalizedClientLink>
          </div>
          <div>
            <h5>Information</h5>
            <LocalizedClientLink href="/info/om-oss">Om oss</LocalizedClientLink>
            <LocalizedClientLink href="/info/produktklassificering">Produktklassificering</LocalizedClientLink>
            <LocalizedClientLink href="/blogg">Blogg</LocalizedClientLink>
            <LocalizedClientLink href="/nyheter">Nyheter</LocalizedClientLink>
            <LocalizedClientLink href="/info/integritetspolicy">Integritetspolicy</LocalizedClientLink>
          </div>
          <div>
            <h5>Kontakta oss</h5>
            <a href="mailto:info@teknikhouse.se">info@teknikhouse.se</a>
            <span style={{ display: "block", margin: "6px 0", color: "#98A1B0" }}>Sveavägen 139<br />113 46 Stockholm</span>
            <a href="https://se.trustpilot.com/review/teknikhouse.se" target="_blank" rel="noreferrer">Trustpilot ★ 4,9</a>
          </div>
        </div>
        <div className="bot">
          <span>© {new Date().getFullYear()} Nordic Teknik House AB · Teknikhouse.se · Org.nr 559118-7488</span>
          <span><b>Trygg e-handel · Fri frakt över 199 kr · Garanti ingår alltid</b></span>
        </div>
      </div>
    </footer>
  )
}
