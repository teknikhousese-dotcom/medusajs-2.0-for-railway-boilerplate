import LocalizedClientLink from "@modules/common/components/localized-client-link"

/* Teknikhouse footer, own-branded. */
const CSS = `
.thf{background:#0B0C10;color:#AEB6C4;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5}
.thf *{box-sizing:border-box}
.thf .w{max-width:1200px;margin:0 auto;padding:44px 20px 26px}
.thf a{color:#98A1B0;text-decoration:none;display:block;padding:5px 0}
.thf a:hover{color:#fff}
.thf .grid{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:24px}
.thf h5{color:#fff;font-size:13px;text-transform:uppercase;letter-spacing:.06em;margin:0 0 12px}
.thf .brand{font-weight:900;font-size:22px;color:#fff;letter-spacing:-.04em;margin-bottom:12px}
.thf .brand .h{color:#F50000}
.thf .desc{max-width:300px;color:#98A1B0;margin:0 0 14px}
.thf .pay{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.thf .pay span{background:#fff;color:#111;border-radius:6px;padding:4px 8px;font-size:11px;font-weight:800;line-height:1.3}
.thf .note{color:#98A1B0;margin:10px 0 0;max-width:260px}
.thf .note a{display:inline;padding:0;color:#fff;text-decoration:underline;text-underline-offset:2px}
.thf .addr{display:block;padding:5px 0;color:#98A1B0;font-style:normal}
.thf .bot{border-top:1px solid #1f2530;margin-top:26px;padding-top:18px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:12px;color:#6b7280}
.thf .bot b{color:#98A1B0;font-weight:600}
@media(max-width:820px){.thf .grid{grid-template-columns:1fr 1fr;gap:28px 20px}.thf .grid>div:first-child,.thf .grid>div:last-child{grid-column:1/-1}.thf .note{max-width:none}.thf .desc{max-width:none}.thf a{display:flex;align-items:center;min-height:44px;padding:0}.thf .note a{display:inline;min-height:0;padding:12px 0}.thf .bot{flex-direction:column}}
`

export default async function Footer() {
  return (
    <footer className="thf">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="w">
        <div className="grid">
          <div>
            <div className="brand">teknik<span className="h">house</span></div>
            <p className="desc">Reservdelar, tillbehör och begagnade mobiler från Nordic Teknik House AB i Stockholm. Hittar du inte rätt del? Mejla oss modellen så hjälper vi dig.</p>
            <div className="pay"><span>Swish</span><span>Klarna</span><span>VISA</span><span>Mastercard</span></div>
            <div className="pay" style={{ marginTop: "8px" }}><span>PostNord</span><span>DHL</span></div>
          </div>
          <div>
            <h5>Handla</h5>
            <LocalizedClientLink href="/contact">Kundtjänst</LocalizedClientLink>
            <LocalizedClientLink href="/info/villkor">Köpvillkor</LocalizedClientLink>
            <LocalizedClientLink href="/info/oppet-kop-retur">Öppet köp &amp; Retur</LocalizedClientLink>
            <LocalizedClientLink href="/return">Anmäl retur</LocalizedClientLink>
            <LocalizedClientLink href="/info/salj-din-enhet">Sälj din enhet</LocalizedClientLink>
            <LocalizedClientLink href="/info/phone-rep">Phone Rep (Butik)</LocalizedClientLink>
            <LocalizedClientLink href="/retail-application">Avtalskund</LocalizedClientLink>
            <LocalizedClientLink href="/account">Logga in</LocalizedClientLink>
          </div>
          <div>
            <h5>Information</h5>
            <LocalizedClientLink href="/info/om-oss">Om oss</LocalizedClientLink>
            <LocalizedClientLink href="/info/produktklassificering">Produktklassificering</LocalizedClientLink>
            <LocalizedClientLink href="/blogg">Blogg</LocalizedClientLink>
            <LocalizedClientLink href="/info/integritetspolicy">Integritetspolicy</LocalizedClientLink>
          </div>
          <div>
            <h5>Kontakta oss</h5>
            <a href="mailto:info@teknikhouse.se">info@teknikhouse.se</a>
            <address className="addr">Sveavägen 139<br />113 46 Stockholm</address>
            <a href="https://www.trustindex.io/reviews/teknikhouse.se" target="_blank" rel="noopener noreferrer">Läs våra omdömen</a>
            <p className="note">Undrar du var din order är? <LocalizedClientLink href="/contact">Skriv till oss</LocalizedClientLink> med ordernumret så kollar vi.</p>
          </div>
        </div>
        <div className="bot">
          <span>© {new Date().getFullYear()} Nordic Teknik House AB · Teknikhouse.se · Org.nr 559118-7488</span>
          <span><b>Fri frakt över 999 kr · Öppet köp i 30 dagar · Garanti ingår alltid</b></span>
        </div>
      </div>
    </footer>
  )
}
