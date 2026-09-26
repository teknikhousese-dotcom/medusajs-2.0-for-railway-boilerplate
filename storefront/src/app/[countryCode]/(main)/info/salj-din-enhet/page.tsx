import type { Metadata } from "next"
import ValuationForm from "@modules/valuation/ValuationForm"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://backend-production-c278d.up.railway.app"
const PUBKEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_59ff167578b5ec25a84af9a76d15c105da93e6f06e6b49a88a9bba24f9e02b85"
const CANONICAL = "https://teknikhouse.se/info/salj-din-enhet/"
const TITLE = "Sälj din mobil, iPhone, Samsung & MacBook | Teknikhouse"
const DESC = "Sälj din iPhone, MacBook, iPad, Apple Watch eller Android-mobil till Teknikhouse och få marknadens högsta bud. Kostnadsfri värdering, snabb betalning och säker dataradering."
const KEYWORDS = "sälj iphone, sälj mobil, sälj macbook, sälj samsung, sälj ipad, sälj apple watch, sälj android, sälj surfplatta, köp begagnad mobil, värdering mobil, sälj din enhet, teknikhouse"

export const revalidate = 300

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  keywords: KEYWORDS,
  alternates: { canonical: CANONICAL },
  openGraph: { title: TITLE, description: DESC, url: CANONICAL, type: "website", siteName: "Teknikhouse", locale: "sv_SE" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
  robots: { index: true, follow: true },
}

async function getContent(): Promise<string> {
  try {
    const r = await fetch(`${BACKEND}/store/editable/salj-din-enhet`, { headers: { "x-publishable-api-key": PUBKEY }, next: { revalidate: 300 } })
    if (!r.ok) return ""
    const j = await r.json()
    return String(j?.content || "")
  } catch { return "" }
}

const FAQ: [string, string][] = [["Hur snabbt får jag betalt?","När din enhet kommit fram testar vi den, ofta samma dag. Stämmer skicket betalar vi ut direkt via banköverföring in på ditt konto."],["Kostar det något att få ett bud?","Nej. Det är helt kostnadsfritt och oförbindande att få en värdering. Du bestämmer själv om du vill sälja efter att du sett ditt bud."],["Köper ni trasiga eller operatörslåsta enheter?","Ja! Vi köper enheter med sprucken skärm, dåligt batteri, operatörslås eller andra fel. Eftersom vi reparerar och återanvänder delar kan vi ändå ge ett bud."],["Vad händer med min data?","All din data raderas säkert och permanent när vi tagit emot enheten. Logga gärna ut från iCloud/Google och stäng av Hitta min innan du skickar."],["Vilka enheter köper ni?","iPhone, MacBook, iPad, Apple Watch, Android-mobiler (Samsung, Sony, Huawei, OnePlus, Xiaomi m.fl.) och surfplattor av alla märken."],["Hur får jag det högsta budet?","Beskriv skicket ärligt och bifoga tydliga bilder på framsida, baksida och laddningsport i god belysning. Ju mer information, desto träffsäkrare och högre bud."],["Var kan jag sälja min iPhone?","Du säljer din iPhone enkelt och tryggt online direkt till Teknikhouse. Fyll i formuläret med modell och skick, så mejlar vi ett personligt prisförslag och betalar snabbt in på ditt konto när vi tagit emot din iPhone."],["Hur säljer jag min Samsung-mobil?","Vi köper alla Samsung Galaxy och andra Android-mobiler. Skicka in uppgifterna om din mobil via formuläret så får du ett bud på mejl. Du skickar in mobilen och får betalt snabbt."],["Vad får jag betalt för min MacBook?","Priset på din MacBook beror på modell, årsmodell och skick. Vi är specialister på Mac och ger ofta marknadens högsta bud. Fyll i formuläret så mejlar vi ett personligt prisförslag på din MacBook Air eller MacBook Pro."],["Kan jag sälja en gammal eller trasig mobil?","Ja. Vi köper gamla, trasiga och defekta mobiler med sprucken skärm, dåligt batteri eller fel. Eftersom vi reparerar och återanvänder delar får du ett bud även på enheter andra inte köper."]]

export default async function SaljDinEnhetPage() {
  const content = await getContent()
  const [before, after] = content.includes("[FORMULAR]") ? content.split("[FORMULAR]") : [content, ""]

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": CANONICAL,
        "url": CANONICAL,
        "name": TITLE,
        "description": DESC,
        "inLanguage": "sv-SE",
        "isPartOf": { "@type": "WebSite", "name": "Teknikhouse", "url": "https://teknikhouse.se/" }
      },
      {
        "@type": "Organization",
        "name": "Teknikhouse",
        "url": "https://teknikhouse.se/",
        "email": "info@teknikhouse.se",
        "address": { "@type": "PostalAddress", "streetAddress": "Sveavägen 139", "postalCode": "113 46", "addressLocality": "Stockholm", "addressCountry": "SE" }
      },
      {
        "@type": "Service",
        "serviceType": "Uppköp av begagnad elektronik",
        "name": "Sälj din enhet till Teknikhouse",
        "description": DESC,
        "areaServed": { "@type": "Country", "name": "Sverige" },
        "provider": { "@type": "Organization", "name": "Teknikhouse", "url": "https://teknikhouse.se/" }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://teknikhouse.se/" },
          { "@type": "ListItem", "position": 2, "name": "Sälj din enhet", "item": CANONICAL }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": FAQ.map(([q, a]) => ({ "@type": "Question", "name": q, "acceptedAnswer": { "@type": "Answer", "text": a } }))
      }
    ]
  }

  return (
    <div className="content-container py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article style={{ maxWidth: 980, margin: "0 auto" }}>
        <div dangerouslySetInnerHTML={{ __html: before }} />
        {content.includes("[FORMULAR]") && <ValuationForm />}
        {after && <div dangerouslySetInnerHTML={{ __html: after }} />}
      </article>
    </div>
  )
}
