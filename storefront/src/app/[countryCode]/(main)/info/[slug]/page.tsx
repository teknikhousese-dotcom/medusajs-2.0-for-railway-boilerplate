import { Metadata } from "next"
import { notFound } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Teknikhouse informationssidor — Nordic Teknik House AB.
// En dynamisk route som fångar alla /info/* länkar från sidfoten så inga länkar dör.

type Block = { h?: string; p?: string; ul?: string[] }
type Page = { title: string; intro?: string; blocks: Block[] }

const ORG = "Nordic Teknik House AB"
const ORGNR = "559118-7488"
const ADDR = "Sveavägen 139, 113 46 Stockholm"
const MAIL = "info@teknikhouse.se"

const PAGES: Record<string, Page> = {
  "om-oss": {
    title: "Om oss",
    intro:
      "Teknikhouse.se ägs och drivs av Nordic Teknik House AB med säte i Stockholm.",
    blocks: [
      {
        p: "Vi erbjuder marknadens bredaste sortiment av begagnade mobiler och surfplattor, reservdelar och tillbehör för mobiltelefoner, surfplattor, datorer och hemelektronik. Målet är absolut bästa möjliga kundservice till både privatpersoner och företagskunder. Hos oss hittar du även batterier, skärmar och baksidor.",
      },
      {
        p: "Vi har lång erfarenhet i branschen och håller högsta kvalitet på reservdelar och tillbehör. Vi hjälper företag och privatpersoner att reparera sina mobila enheter. Alla produkter testas grundligt och utbudet uppdateras hela tiden. Vi säljer produkter som är testade av experter, alltid till låga priser. Garanti ingår alltid. Det är tryggt och säkert att handla hos oss.",
      },
      {
        h: "Phone Rep — vår fysiska butik",
        p: "PhoneRep hos Teknik House på Sveavägen 139 i Stockholm är vår första fysiska butik. Här lagar vårt erfarna tekniker-team mobiler och datorer — trasig skärm, batteribyte eller mjukvarufel — snabbt och tryggt. Vi säljer även tillbehör och begagnade mobiler i butiken.",
      },
      {
        h: "Företagsuppgifter",
        ul: [
          `Bolag: ${ORG} / Teknikhouse.se`,
          `Adress: ${ADDR}`,
          `Org.nr: ${ORGNR} · Momsnr: SE559118748801`,
          `E-post: ${MAIL}`,
          "Trygghet: Ansluten till Svensk Digital Handel · “Utmärkt” på Trustpilot",
        ],
      },
    ],
  },
  villkor: {
    title: "Köpvillkor",
    intro:
      "Följande villkor gäller vid köp på Teknikhouse.se. Genom att slutföra ett köp godkänner du dessa villkor.",
    blocks: [
      { h: "Säljare", p: `${ORG}, org.nr ${ORGNR}. ${ADDR}. E-post: ${MAIL}.` },
      {
        h: "Priser och betalning",
        p: "Alla priser anges i svenska kronor (SEK) inklusive moms. Vi erbjuder betalning via Swish, Klarna samt kort (VISA/Mastercard). Vid fakturaköp gäller respektive betalpartners villkor.",
      },
      {
        h: "Leverans",
        p: "Vi levererar med PostNord och DHL, normalt inom 1–3 vardagar från eget lager. Fri frakt vid köp över 999 kr (49 kr utanför Sverige). Du väljer själv leveranssätt i kassan och alla försändelser är spårbara.",
      },
      {
        h: "Ångerrätt & öppet köp",
        p: "Du har 30 dagars öppet köp på lagervaror enligt vår retur- och ångerpolicy. Varan ska återsändas i väsentligen oförändrat skick. Se sidan Öppet köp & Retur för fullständig information och hur du anmäler en retur.",
      },
      {
        h: "Fri frakt",
        p: "Fri frakt inom Sverige vid köp över 999 kr, annars tillkommer fraktavgift. Utanför Sverige gäller 49 kr.",
      },
      {
        h: "Garanti & reklamation",
        p: "Garanti ingår alltid, med livstidsgaranti på skärmar. Enligt konsumentköplagen har du som privatperson tre års reklamationsrätt. Kontakta oss på info@teknikhouse.se vid fel så hjälper vi dig vidare.",
      },
      {
        h: "Tvist",
        p: "Vid en eventuell tvist följer vi Allmänna reklamationsnämndens (ARN) rekommendationer. Du kan även använda EU-kommissionens onlineplattform för tvistlösning.",
      },
    ],
  },
  "oppet-kop-retur": {
    title: "Öppet köp & Retur",
    intro:
      "Vi vill att du ska vara nöjd med ditt köp. Därför erbjuder vi 30 dagars öppet köp på lagervaror.",
    blocks: [
      {
        h: "30 dagars öppet köp",
        p: "Du har 30 dagar på dig att ångra ditt köp från det att du tagit emot varan. Varan ska vara i väsentligen oförändrat skick och om möjligt i sin originalförpackning.",
      },
      {
        h: "Så gör du en retur",
        ul: [
          "Anmäl din retur via sidan Anmäl retur eller mejla info@teknikhouse.se.",
          "Ange ordernummer och vilken/vilka varor det gäller.",
          "Paketera varan väl och skicka den till oss enligt instruktionerna du får.",
        ],
      },
      {
        h: "Återbetalning",
        p: "När vi tagit emot och kontrollerat returen betalar vi tillbaka beloppet med samma betalmetod du använde, normalt inom några vardagar.",
      },
      {
        h: "Reklamation",
        p: "Är varan felaktig eller skadad vid leverans? Kontakta oss så löser vi det. Garanti ingår alltid och du har reklamationsrätt enligt konsumentköplagen.",
      },
    ],
  },
  integritetspolicy: {
    title: "Integritetspolicy",
    intro:
      "Din integritet är viktig för oss. Här beskriver vi hur Nordic Teknik House AB behandlar dina personuppgifter enligt GDPR.",
    blocks: [
      {
        h: "Personuppgiftsansvarig",
        p: `${ORG}, org.nr ${ORGNR}, ${ADDR}, är personuppgiftsansvarig för behandlingen av dina uppgifter.`,
      },
      {
        h: "Vilka uppgifter vi samlar in",
        p: "Vi behandlar de uppgifter du lämnar vid köp och kontakt, t.ex. namn, adress, e-post, telefonnummer och orderhistorik, samt teknisk information som behövs för att driva webbplatsen.",
      },
      {
        h: "Varför vi behandlar uppgifterna",
        p: "Uppgifterna används för att hantera dina beställningar, leveranser, betalningar, garanti- och returärenden, kundservice samt för att uppfylla rättsliga skyldigheter, exempelvis bokföring.",
      },
      {
        h: "Dina rättigheter",
        p: "Du har rätt att begära utdrag, rättelse eller radering av dina uppgifter samt att invända mot viss behandling. Kontakta oss på info@teknikhouse.se. Du kan även vända dig till Integritetsskyddsmyndigheten (IMY).",
      },
      {
        h: "Cookies",
        p: "Webbplatsen använder cookies för att fungera korrekt och för att förbättra din upplevelse. Du kan själv styra cookies i din webbläsare.",
      },
    ],
  },
  produktklassificering: {
    title: "Produktklassificering — begagnade enheter",
    intro:
      "Alla begagnade mobiler och surfplattor genomgår ett 20-punkters test och graderas transparent så att du vet exakt vad du köper.",
    blocks: [
      {
        h: "Skickklasser",
        ul: [
          "A+ Perfekt skick — ser ut och fungerar som ny, inga synliga skador.",
          "Klass A Toppskick — får leta efter enstaka märke.",
          "Klass B Bra skick — något använd, plats för några repor.",
          "Klass C Okej skick — tydliga bruksspår, ett prisvärt budgetval.",
        ],
      },
      {
        h: "20-punkterstestet",
        p: "Vi kontrollerar bland annat start, display, touch, mikrofon, högtalare, Bluetooth, wifi, fingeravtryck, Face ID, samtliga kameror, knappar, hölje samt batteriets maxkapacitet (minst 80 %). Alla begagnade enheter är olåsta och utan abonnemang.",
      },
    ],
  },
  "phone-rep": {
    title: "Phone Rep — reparationer i butik",
    intro:
      "Vi lagar din mobil och dator enkelt, snabbt och tryggt. PhoneRep hos Teknik House på Sveavägen 139 i Stockholm.",
    blocks: [
      {
        p: "Vårt erfarna tekniker-team hjälper dig med trasig skärm, batteribyte och mjukvarufel — på både mobil och dator. Vi säljer även tillbehör (skal, skärmskydd, laddare, hörlurar) och begagnade mobiler i butiken.",
      },
      {
        h: "Kostnadsfri felsökning",
        p: "Osäker på vad som är fel? Posta enheten till oss så gör vi en kostnadsfri felsökning och lämnar ett kostnadsförslag på reparationen innan vi börjar.",
      },
      { h: "Hitta oss", p: `${ADDR}. E-post: ${MAIL}.` },
    ],
  },
  "salj-din-enhet": {
    title: "Sälj din enhet",
    intro:
      "Vi köper din iPhone, Samsung och MacBook. Få ett prisförslag och gör plats för något nytt.",
    blocks: [
      {
        p: "Byt upp dig eller töm lådan — vi köper begagnade mobiler, surfplattor och datorer i olika skick. Berätta vilken modell du har och dess skick så återkommer vi med ett prisförslag.",
      },
      { h: "Så går det till", ul: ["Välj enhet och beskriv skicket.", "Få ett prisförslag från oss.", "Skicka in enheten — vi betalar snabbt när den kontrollerats."] },
      { h: "Kontakt", p: `Mejla ${MAIL} så hjälper vi dig igång.` },
    ],
  },
  kundtjanst: {
    title: "Kundtjänst",
    intro: "Vi finns här för att hjälpa dig — före, under och efter köpet.",
    blocks: [
      { h: "Kontakta oss", p: `E-post: ${MAIL}. Vi svarar normalt inom en arbetsdag.` },
      { h: "Vanliga frågor", ul: ["Var är min order? Alla leveranser med PostNord/DHL är spårbara — kontakta oss med ditt ordernummer.", "Retur eller reklamation? Se Öppet köp & Retur.", "Garanti? Garanti ingår alltid, med livstidsgaranti på skärmar."] },
      { h: "Besök butiken", p: `Phone Rep, ${ADDR}.` },
    ],
  },
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await props.params
  const page = PAGES[slug]
  if (!page) return { title: "Information | Teknikhouse" }
  return {
    title: `${page.title} | Teknikhouse`,
    description: page.intro || page.title,
  }
}

export default async function InfoPage(props: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await props.params
  const page = PAGES[slug]
  if (!page) notFound()

  return (
    <div className="content-container py-12">
      <div className="max-w-3xl mx-auto">
        <nav className="text-small-regular text-ui-fg-muted mb-6">
          <LocalizedClientLink href="/" className="hover:text-ui-fg-base">
            Hem
          </LocalizedClientLink>
          <span className="mx-2">/</span>
          <span>{page.title}</span>
        </nav>
        <h1 className="text-3xl-semi mb-4">{page.title}</h1>
        {page.intro && (
          <p className="text-large-regular text-ui-fg-subtle mb-8">{page.intro}</p>
        )}
        <div className="flex flex-col gap-y-6 text-base-regular text-ui-fg-subtle">
          {page.blocks.map((b, i) => (
            <div key={i}>
              {b.h && (
                <h2 className="text-xl-semi text-ui-fg-base mb-2">{b.h}</h2>
              )}
              {b.p && <p className="leading-7">{b.p}</p>}
              {b.ul && (
                <ul className="list-disc pl-5 flex flex-col gap-y-1 mt-1">
                  {b.ul.map((li, j) => (
                    <li key={j}>{li}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-ui-border-base text-small-regular text-ui-fg-muted">
          {ORG} · Org.nr {ORGNR} · {ADDR}
        </div>
      </div>
    </div>
  )
}
