import { Metadata } from "next"
import { notFound } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Teknikhouse informationssidor — Nordic Teknik House AB.
// Innehållet är kopierat frn teknikhouse.se (lätt redigerat). Dynamisk route som fångar alla /info/*.

type Block = { h?: string; p?: string; ul?: string[] }
type Page = { title: string; intro?: string; blocks: Block[] }

const ORG = "Nordic Teknik House AB"
const ORGNR = "559118-7488"
const ADDR = "Sveavägen 139, 113 46 Stockholm"

const PAGES: Record<string, Page> = {
  "om-oss": {
    "title": "Om oss",
    "intro": "Teknikhouse.se ägs och drivs av Nordic Teknik House AB med säte i Stockholm.",
    "blocks": [
      {
        "h": "Vilka vi är",
        "p": "Vi erbjuder marknadens bredaste sortiment av begagnade mobiler & surfplattor, reservdelar och tillbehör för mobiltelefoner, surfplattor, datorer och hemelektronik. Målet är att erbjuda absolut bästa möjliga kundservice till både privatpersoner och företagskunder. Hos oss hittar du även batterier, skärmar och baksidor."
      },
      {
        "h": "Därför handlar du tryggt hos oss",
        "ul": [
          "Vi har lång erfarenhet i branschen och högsta kvalitet på reservdelar och tillbehör.",
          "Vi hjälper företag och privatpersoner att reparera sina mobila enheter.",
          "Vi testar alla produkter grundligt och utbudet uppdateras hela tiden — det finns alltid nya saker att upptäcka.",
          "Vi säljer produkter som är testade av experter, alltid till låga priser.",
          "Garanti ingår alltid. Det är säkert att handla hos oss.",
          "Alla begagnade mobiler och surfplattor är olåsta och säljs utan abonnemang, till lågt pris utan att kompromissa med kvaliteten.",
          "Vi samarbetar med PostNord och DHL.",
          "Vi är anslutna till Svensk Digital Handel för din trygghet, och våra kunder ger oss betyget ”Utmärkt” på Trustpilot."
        ]
      },
      {
        "h": "Kostnadsfri felsökning",
        "p": "Vi erbjuder alltid kostnadsfri felsökning av din enhet. Posta den till oss så återkommer vi med ett kostnadsförslag på reparationen. Du väljer själv fraktsätt (PostNord eller DHL) — skicka enheten spårbart så att den är försäkrad under hela transporten."
      },
      {
        "h": "Företagsuppgifter",
        "ul": [
          "Bolag: Nordic Teknik House AB / Teknikhouse.se",
          "Adress: Sveavägen 139, 113 46 Stockholm",
          "Organisationsnummer: 559118-7488",
          "Momsregistreringsnummer: SE559118748801",
          "Nordic Teknik House AB är registrerat för F-skatt.",
          "E-post: info@teknikhouse.se"
        ]
      }
    ]
  },
  "villkor": {
    "title": "Köpvillkor",
    "intro": "Köp- och leveransvillkor för Teknikhouse.se (Nordic Teknik House AB). Genom att slutföra ett köp godkänner du dessa villkor.",
    "blocks": [
      {
        "h": "Köp- och leveransvillkor",
        "ul": [
          "Din order skickas från vårt lager i Stockholm. Ändringar och tillägg måste göras innan din order behandlas och skickas från oss. Om du upptäcker eventuella felaktigheter på din order är det därför viktigt att du omgående kontaktar vår kundservice för att om möjligt ändra din order.",
          "Samtliga priser anges inklusive moms för privatpersoner. Priserna inkluderar frakt och inkluderar inte returkostnader inom Sverige, om inte annat anges. Särskilda avgifter kan tillkomma för fakturaupplägg, snabbleverans och för outlösta paket.",
          "Begagnade mobiler & surfplattor som vi säljer säljs med vinstmarginalbeskattning. Det innebär att det inte finns någon moms som ett företag kan göra avdrag för. För säkerhets skull rekommenderar vi våra kunder att kolla informationen i kassan innan utcheckning."
        ]
      },
      {
        "h": "Leveransvillkor",
        "ul": [
          "Normal leveranstid är cirka 3 dagar. Under högsäsong kan det ta längre tid.",
          "Vi skickar beställningar med PostNord och DHL.",
          "Vi tar inte ekonomiskt ansvar för eventuella förseningar som beror på fraktföretaget.",
          "Upptäcker du skador på paketet ska du omedelbart anmäla detta till postkontoret eller annan transportör och göra en skadeanmälan. Hämta inte ut ett skadat paket! Upptäcker du inte skadan förrän du öppnat paketet, och skadan kan hänföras till postens eller transportföretagets hantering, ska du kontakta dem och göra en skadeanmälan. Om en eventuell tvist med posten eller transportföretaget inte kan lösas tar du kontakt med oss.",
          "Outlösta paket / fel angiven adress: För ej utlösta paket med ett varuvärde under 500 kr debiterar vi en avgift på 199 kr; för ej utlösta paket med ett varuvärde över 500 kr debiterar vi 399 kr för att täcka uppkomna kostnader. Tänk därför på att alltid hämta ut dina beställningar inom 6 dagar från det att paketet ankommit till postombudet. Outlösta paket omfattas inte av ångerrätten. Om vi får tillbaka försändelsen pga okänd adress eller att du flyttat debiterar vi 49 kr för hanteringskostnaden.",
          "Fraktkostnaden — vi bjuder på frakten vid alla beställningar över 999 kr. Detta sker automatiskt i webbutiken och kostnaden redovisas i kassan.",
          "För beställningar med produktvärde under 1000 kr erbjuder vi brev/varubrev 1:a klass för mindre vikt och volym; beställningar över 1000 kr skickas med DHL eller PostNord och går att spåra."
        ]
      },
      {
        "h": "Ångerrätt / Reklamation",
        "ul": [
          "Du kan ångra ditt köp direkt via vår ångerfunktion på teknikhouse.se/return/.",
          "Vi följer lagen om distansavtal enligt Konsumentverkets rekommendationer. Du har rätt att returnera beställda felfria varor utan att ange någon anledning. Meddelande ska lämnas så snart som möjligt, dock senast inom fjorton (14) dagar från det att varan mottagits (gäller ej specialbeställda varor). Det är alltid garanti på produkterna du köper. Kan man påvisa fabrikationsfel får man alltid nya delar; garantin gäller dock inte vid förslitningsskador. Du betalar själv returfrakten.",
          "Har du fått en trasig eller fellevererad vara kan du kontakta oss på info@teknikhouse.se och få en frisvarsadress så att du kan returnera utan kostnad.",
          "Ångerrätten gäller inte vissa produkter vid öppnad plomberad förpackning: reservdelar, minneskort, USB-stickor, batterier, hörlurar/headset samt andra plomberade produkter.",
          "Vid ångerrätt/öppet köp ersätter vi inte fraktkostnader till oss, och ansvaret att försändelsen når oss ligger hos dig som kund. Vid defekt förpackning eller uppenbar åverkan görs prisavdrag på 30–100 % av produktens värde. Vid godkänd retur återbetalas varuvärdet, ej frakten.",
          "Vid köp av begagnad enhet gäller ångerrätten/öppet köp endast om enheten är i obruten förpackning (att klistermärket över förpackningen är obrutet).",
          "Produkten måste vara oanvänd och i samma skick som när den mottogs, i sin förpackning med intakta skyddsmärken och etiketter. Om varan inte är i oförändrat skick kan vi göra ett prisavdrag som motsvarar värdeminskningen.",
          "Ångerrätten är ej tillämplig för företag. Vid retur rekommenderar vi transportemballage för extra skydd. Saknas tillbehör eller finns fysisk skada förbehåller vi oss rätten att ta ut en avgift för att återställa varan.",
          "Nordic Teknik House AB förbehåller sig rätten att ta ut en avgift på 300–500 kr vid felbeställning; returfrakt bekostas då av konsument.",
          "För glasskärmar och displayer får skyddsfilmen/transportskyddet inte avlägsnats (skärmen får ej ha varit monterad), inga repor/sprickor på touchen. LCD-skärmar ska testas innan montering genom att koppla ihop kablarna utan att limma fast dem. Vid fel: skicka foto som visar defekten till info@teknikhouse.se tillsammans med en kort förklaring. Endast ursprungliga fel omfattas av reklamationsrätten (ej normalt slitage). Garanti för skärmar gäller endast touch- och skärmfunktion; kosmetiska fel täcks ej, och garantin går förlorad vid tappskador, slitage, felaktig montering eller yttre påverkan.",
          "Reklamation ska göras inom skälig tid efter att felet upptäckts, dock senast inom sex (6) månader — utom uppladdningsbara batterier och begagnade mobiler & surfplattor som säljs med 3 månaders garanti. Vi avhjälper i första hand felet, i andra hand omleverans, i sista hand återköp. Vid reklamation skickar vi en fraktsedel för fri returfrakt.",
          "Ditt garantibevis är orderbekräftelsen du får via e-post, som även bifogas i paketet.",
          "Alla produkter säljs med garanti mot fabrikationsfel enligt konsumentköplagen: ett år på nya produkter, tre månader på begagnade varor och uppladdningsbara batterier. Avvikande garantivillkor framgår i produktspecifikationen. En vara kan reklameras i upp till 3 år efter mottagandet men ska reklameras inom skälig tid.",
          "Felaktiga reklamationer som beror på handhavandefel eller bristande erfarenhet av reparationer debiteras med lägst 199 kr inkl. moms, plus kostnad för retur av den felfria produkten.",
          "Ansvar vid skada: Nordic Teknik House AB kan ej hållas ansvariga ekonomiskt eller juridiskt för skador på hårdvara, mjukvara eller förlust av sparat minne i samband med reparationer. Vi rekommenderar att en fackman utför reparationen."
        ]
      },
      {
        "h": "Byten",
        "p": "Returnera produkten du vill byta och gör en ny beställning på teknikhouse.se på önskad produkt. När vi mottagit din retur krediterar vi dig och du får pengarna tillbaka. Vid bruten förpackning omfattas ej hörlurar, headset, minneskort eller andra plomberade produkter av bytesrätten."
      },
      {
        "h": "Egen fraktsedel & returadress",
        "p": "När du informerat oss om din retur kan du välja valfri transportör och ange våra returuppgifter. Skicka paketet direkt till returadressen (vi hämtar inte ut paket hos ombud). Skriv ut sidan och bifoga retursändningen, eller ange ordernummer och felbeskrivning på ett papper. Returadress: Nordic Teknik House AB, Sveavägen 139, 113 46 Stockholm."
      },
      {
        "h": "Återbetalning",
        "p": "Väljer du pengarna tillbaka krediteras du till kontot du betalade med. Har du betalat med faktura, logga in på Klarna och förläng förfallodatumet så vi hinner hantera returen. Hanteringstid vid reklamation är upp till 10 dagar."
      },
      {
        "h": "Betalningsalternativ",
        "ul": [
          "Klarna Checkout — faktura, konto/delbetalning, kortbetalning eller direktbetalning via bank. Klarna hanterar betalningstransaktionen medan köpet görs hos butiken.",
          "Swish — snabb betalning som verifieras med BankID/Mobilt BankID. Eventuell återbetalning sker via Swish.",
          "Payson — betala tryggt med VISA, Mastercard eller svenska banker, eller dela upp betalningen."
        ]
      },
      {
        "h": "Övrigt",
        "ul": [
          "Minimiorder är 29 kr inklusive moms.",
          "Personuppgifter hanteras enligt gällande dataskyddslagstiftning. Det mobilnummer du anger i kassan kan användas för SMS-avisering av leverans eller kommunikation kring din order.",
          "Nyhetsbrev är frivilligt och du kan avregistrera dig när som helst.",
          "Genom att lämna omdömen ger du Teknikhouse rätt att publicera dem. Vi förbehåller oss rätten att inte publicera och/eller ta bort omdömen."
        ]
      },
      {
        "h": "Tvist",
        "p": "Eventuella tvister löser vi i första hand tillsammans med vår kundtjänst. Vi följer Allmänna reklamationsnämndens (ARN) rekommendationer och hänvisar i övrigt till EU-kommissionens plattform för tvistlösning online."
      },
      {
        "h": "Upphovsrätt",
        "p": "Samtliga texter och bilder på teknikhouse.se är skyddade av svensk och internationell lag. Våra texter och egna bilder får inte användas i kommersiella syften utan vårt tillstånd. Otillåten användning anmäls och faktureras."
      }
    ]
  },
  "oppet-kop-retur": {
    "title": "Öppet köp & Retur",
    "intro": "Handla tryggt online. Du har 30 dagars öppet köp från beställningsdatum. Ångra köp / anmäl retur på teknikhouse.se/return/.",
    "blocks": [
      {
        "h": "Öppet köp & Retur",
        "ul": [
          "Vi följer lagen om distansavtal enligt Konsumentverkets rekommendationer. Du har rätt att returnera beställda felfria varor utan att ange någon anledning. Meddelande ska lämnas så snart som möjligt, dock senast inom fjorton (14) dagar från det att varan mottagits (gäller ej specialbeställda varor). Öppet köp gäller i 30 dagar från beställningsdatum.",
          "Det är alltid garanti på produkterna du köper (standard 6 månader; se undantag nedan). Kan man påvisa fabrikationsfel får man alltid nya delar; garantin gäller inte vid förslitningsskador. Du betalar själv returfrakten. För återbetalning, ange ditt bankkontonummer."
        ]
      },
      {
        "h": "Trasig eller fellevererad vara",
        "p": "Har du fått en fellevererad vara, kontakta oss med bifogad bild på info@teknikhouse.se och få en frisvarsadress så att du kan returnera utan kostnad. Är varan trasig behöver du uppvisa detta innan du får en returfraktsedel — se till att bilderna är tydliga och skarpa. Vid felaktigt användande av frisvarsadressen debiteras den faktiska portokostnaden i efterhand."
      },
      {
        "h": "Ångerrätt / Öppet köp",
        "ul": [
          "OBS: Ångerrätten är ej tillämplig för företag.",
          "Meddela oss så snart du vet att du vill ångra köpet och skicka sedan varan till vår returadress.",
          "Ångerrätten gäller inte vissa produkter — reservdelar, minneskort, USB-stickor, batterier, hörlurar/headset och andra plomberade produkter — så att nästa kund får varan i nytt och hygieniskt skick.",
          "Vid ångerrätt/öppet köp utgår ingen gratis fraktsedel; du står för kostnaden och ansvaret att försändelsen når oss. Vid godkänd retur återbetalas varuvärdet, ej frakten. Defekt förpackning eller uppenbar åverkan ger prisavdrag på 30–100 % av produktens värde.",
          "Vid köp av begagnad enhet gäller ångerrätten/öppet köp endast om enheten är i obruten förpackning (klistermärket över förpackningen obrutet)."
        ]
      },
      {
        "h": "Förväntat skick",
        "p": "Använd transportemballage för extra skydd — du står för risken om produkten skadas på vägen tillbaka. Produkten måste vara oanvänd och i samma skick som vid mottagandet, i sin förpackning med intakta skyddsmärken och etiketter. Saknas tillbehör eller finns fysisk skada förbehåller vi oss rätten att ta ut en avgift för att återställa varan."
      },
      {
        "h": "Vid felbeställning",
        "p": "Nordic Teknik House AB förbehåller sig rätten att ta ut en avgift på 300–500 kr vid felbeställning. Returfrakt bekostas då av konsument."
      },
      {
        "h": "Reservdelar — krav för godkänd retur",
        "ul": [
          "Glasskärmar och displayer: skyddsfilmen/transportskyddet får inte ha avlägsnats, skärmen får ej ha varit monterad, inga repor/sprickor på touchen.",
          "LCD-skärmar ska testas innan montering genom att koppla ihop kablarna utan att limma fast dem. Vid fel, skicka foto som visar defekten (och eventuell synlig skada) till info@teknikhouse.se med en kort förklaring.",
          "Endast ursprungliga fel omfattas av reklamationsrätten (ej normalt slitage). Reklamation ska göras inom skälig tid, dock senast inom sex (6) månader — utom uppladdningsbara batterier och begagnade mobiler & surfplattor som säljs med 3 månaders garanti. Vi avhjälper i första hand felet, i andra hand omleverans, i sista hand återköp. Vid reklamation skickar vi en fraktsedel för fri returfrakt."
        ]
      },
      {
        "h": "Garanti",
        "ul": [
          "Ditt garantibevis är orderbekräftelsen du får via e-post och som bifogas i paketet.",
          "Alla produkter säljs med garanti mot fabrikationsfel enligt konsumentköplagen: ett år på nya produkter, tre månader på begagnade varor och uppladdningsbara batterier. Avvikande garantivillkor från tillverkaren framgår i produktspecifikationen. Alla garantier gäller i Sverige.",
          "En vara kan reklameras i upp till 3 år efter mottagandet men ska reklameras inom skälig tid. Förändringar till följd av normalt användande, eller modifiering via mjukvara, kan ge avslag på retur.",
          "Felaktiga reklamationer som beror på handhavandefel eller bristande reparationsvana debiteras med lägst 199 kr inkl. moms, plus kostnad för retur av den felfria produkten.",
          "Ansvar vid skada: Nordic Teknik House AB kan ej hållas ansvariga ekonomiskt eller juridiskt för skador på hårdvara, mjukvara eller förlust av sparat minne i samband med kundens egna reparationer. Vi rekommenderar att en fackman utför reparationen."
        ]
      },
      {
        "h": "Skicka varor i retur",
        "ul": [
          "Egen fraktsedel: välj valfri transportör och ange våra returuppgifter. Skicka paketet direkt till returadressen — vi hämtar inte ut paket hos ombud (t.ex. Rekommenderat Brev eller MyPack Collect). Avgifter för paket som hamnat hos ombud betalas av kund.",
          "Bifoga returföljesedel, eller ett papper med: ordernummer, ditt namn, antal och namn på produkterna samt anledning/felbeskrivning.",
          "Packa säkert med gott om emballage utan för högt tryck.",
          "Returadress: Nordic Teknik House AB, Sveavägen 139, 113 46 Stockholm. Frågor? info@teknikhouse.se."
        ]
      }
    ]
  },
  "integritetspolicy": {
    "title": "Integritetspolicy",
    "intro": "Så här samlar Nordic Teknik House AB in, använder, lämnar ut, lagrar och i övrigt hanterar dina personuppgifter enligt gällande lagstiftning (GDPR).",
    "blocks": [
      {
        "h": "1. Allmänt",
        "p": "Datahantering är en viktig säkerhetsfråga och därför är det bra att känna till hur personuppgifter och övrig överlämnad data hanteras hos Nordic Teknik House AB. I denna integritetspolicy kan du läsa om hur vi samlar in, använder, lämnar ut, lagrar och i övrigt hanterar dina personuppgifter enligt gällande lagstiftning."
      },
      {
        "h": "2. Vem är personuppgiftsansvarig?",
        "p": "Nordic Teknik House AB (”Teknikhouse”), Sveavägen 139, 113 46 Stockholm, org.nr 559118-7488, är personuppgiftsansvarig för behandlingen av dina personuppgifter. Ansvaret gäller när Teknikhouse tillhandahåller och marknadsför produkter och tjänster samt vid köp — i webbutiken och vid kundtjänstärenden via e-post och telefon. Det är Teknikhouse ansvar att uppgifterna förvaras säkert."
      },
      {
        "h": "3. Vilka personuppgifter behandlar vi?",
        "ul": [
          "Kontaktuppgifter: namn, titel, attesträttighet, e-postadress, leveransadress, fakturaadress och telefonnummer.",
          "Orderinformation: ordernummer, beställda produkter/tjänster, orderdatum, pris, rabatt och köphistorik.",
          "Betalningsuppgifter: betalningssätt, transaktionstidpunkt, belopp, IP-adress och betalningshistorik.",
          "Korrespondens och supportärenden: t.ex. anteckningar och e-post vid kontakt med kundtjänst.",
          "Användargenererade data om interaktion med vår marknadskommunikation och webbplats: IP-adress, enhetsinformation, tidszon och operativsystem, samt om och hur du interagerar med våra nyhetsbrev.",
          "Medlemskap/avtal som ger tillgång till rabatter och erbjudanden, samt uppgifter som lämnats vid tävlingar.",
          "För företag sparas även organisationsnummer, för att kunna fakturera (särskilt för kommuner, regioner och företag).",
          "Sparas EJ hos oss: personnummer, kortnummer, bankkontonummer eller liknande känsliga uppgifter — dessa hanteras av Klarna. Frågor om den datahanteringen ställs till Klarna."
        ]
      },
      {
        "h": "4. Från vilka källor samlar vi in uppgifterna?",
        "p": "Vi samlar in uppgifter när du gör en beställning, besöker vår hemsida, klickar på länkar i nyhetsbrev eller bloggen, samt vid kontakt med kundtjänst. Har du ett konto samlar vi in t.ex. köphistorik och hur du navigerar. Vi kan även komplettera med uppgifter från offentliga register (t.ex. adressuppdatering via extern tjänst) och kreditupplysning från upplysningsföretag."
      },
      {
        "h": "5. Varför samlar vi in data om dig?",
        "p": "I huvudsak för att fullfölja köpeavtalet, ge support och snabba upp processen från beställning till leverans. Uppgifterna används även för anpassade erbjudanden och förifyllda uppgifter i kassan, för bokföring enligt lag, för att hantera reklamationer, för att förhindra och utreda bedrägeri och stöld, samt för att analysera och förbättra våra tjänster, kampanjer och webbplats."
      },
      {
        "h": "6. Är det lagligt?",
        "p": "Ja. Enligt bokföringslagen har vi rättslig förpliktelse att dokumentera betalningsuppgifter. Behandlingen krävs för att fullgöra avtalet med dig. Har du ett konto har du ingått avtal med oss om nödvändig behandling. Viss behandling sker även med stöd av berättigat intresse, t.ex. vid misstanke om brott och för att förhindra bedrägeri."
      },
      {
        "h": "7. Hur länge sparas uppgifterna?",
        "p": "Uppgifterna sparas så länge de behövs för att fullgöra våra förpliktelser mot kunder och rättsliga skyldigheter. När det inte längre finns skäl att spara dem gallras och raderas de. Är du inte aktiv tas uppgifterna bort — detta kan ta upp till 3 år efter genomfört köp."
      },
      {
        "h": "8. Delar ni mina uppgifter med andra?",
        "p": "Vi kan dela vissa uppgifter med tredjepart som är inblandad i en beställning. Vi säljer aldrig dina personuppgifter. Vi kan dela uppgifter med: företag som tillhandahåller offentlig registerinformation (adresskontroll); analys- och marknadsföringsföretag (för mer relevant information); statliga myndigheter som Polismyndigheten och Skatteverket (vid myndighetsbeslut eller misstanke om brott); leverantörer/tillverkare/underleverantörer (för support, reparation, retur); logistikföretag som PostNord och DHL (för leverans); försäkringsbolag; samt banker/kortinlösare/kreditinstitut (för betalning). Dina uppgifter lagras inom EU/EES och överförs endast utanför EU/EES med lagliga skyddsåtgärder."
      },
      {
        "h": "9. Vilka rättigheter har jag?",
        "p": "Du har rätt att få felaktiga uppgifter rättade, kompletterade, avidentifierade eller raderade; att begära registerutdrag och en kopia av dina uppgifter under behandling; att i vissa fall begära begränsning av behandlingen; att få dina uppgifter i ett strukturerat, maskinläsbart format (dataportabilitet); samt att invända mot direktmarknadsföring — då upphör vi med bl.a. nyhetsbrev och erbjudanden. Radering kan begränsas av rättsliga förpliktelser (t.ex. bokföringslagen) eller rättsliga anspråk. Kontakta oss om du anser att vi hanterar dina uppgifter fel."
      },
      {
        "h": "10. Hur skyddar ni personuppgifter?",
        "p": "Uppgifterna sparas via mejlkontakt och på våra egna skyddade plattformar, bakom brandvägg som försvårar åtkomst. Vi ser till att informationen inte sprids till tredje parter eller plattformar där information lagras och spåras i onödan."
      },
      {
        "h": "11. Ändring av policyn",
        "p": "Den senaste gällande versionen finns alltid på vår webbplats och är den som gäller vid ditt besök. Vi förbehåller oss rätten att när som helst ändra policyn; större förändringar meddelas via nyhetsbrev. Vill du inte acceptera policyn avslutar du ditt konto."
      },
      {
        "h": "12. Kontakt",
        "p": "Har du frågor om vår integritetspolicy, eller vill få dina lagrade personuppgifter ändrade, mejla info@teknikhouse.se. Du kan även vända dig till Integritetsskyddsmyndigheten (IMY)."
      }
    ]
  },
  "produktklassificering": {
    "title": "Produktklassificering",
    "intro": "Egenskapstest för begagnade enheter. Alla begagnade mobiler, surfplattor och datorer graderas transparent och genomgår ett 20-punkterstest.",
    "blocks": [
      {
        "h": "Vad betyder klassificeringarna?",
        "ul": [
          "Klass A+ — Perfekt skick. Ser ut och fungerar som ny. Inga märkbara skador. För dig som är perfektionist.",
          "Klass A — Toppskick. Ser ny ut, kan finnas något enstaka märke men då får man leta. För dig som vill glida runt med stil.",
          "Klass B — Bra skick. Något använd med utrymme för några repor, men inte för stora. Bra val för den genomsnittlige användaren.",
          "Klass C — Okej skick. Tydliga spår av användning. Grymt val för den budgetinställde som är okej med att enheten ser använd ut."
        ]
      },
      {
        "h": "20-punkterstest — begagnad smartmobil",
        "p": "1) Enheten startar  2) Displayen  3) Touchscreen  4) Mikrofon  5) Huvudhögtalare  6) Samtalshögtalare  7) Skärm  8) Bluetooth  9) Wifi  10) Fingeravtrycksläsare  11) Ansiktsidentifiering  12) Simkortshållare  13) Bakre kamera  14) Främre kamera  15) Volymknappar  16) Låsknapp  17) Hemknapp  18) Batteri (minst 80 % maxkapacitet)  19) Hölje  20) Övriga komponenter."
      },
      {
        "h": "20-punkterstest — begagnad surfplatta",
        "p": "1) Enheten startar  2) Displayen  3) Touchscreen  4) Mikrofon  5) Huvudhögtalare  6) Skärmlås  7) Skärm  8) Bluetooth  9) Wifi  10) Fingeravtrycksläsare  11) Ansiktsidentifiering  12) Simkortshållare  13) Bakre kamera  14) Främre kamera  15) Volymknappar  16) Låsknapp  17) Hemknapp  18) Batteri (minst 80 % maxkapacitet)  19) Hölje  20) Övriga komponenter."
      },
      {
        "h": "20-punkterstest — begagnad laptop",
        "p": "1) Enheten startar  2) Displayen  3) Touchpad  4) Knappar för touchpad  5) Tangentbord  6) Mikrofon  7) Bluetooth  8) Wifi  9) Fingeravtrycksläsare  10) Webbkamera  11) Huvudhögtalare  12) Lysindikatorer  13) Fästen för skärm  14) Operativsystem  15) Ev. bakgrundsljus för knappar  16) Strömbrytare  17) Laddningsadapter  18) Batteri (minst 80 % maxkapacitet)  19) Hölje  20) Övriga komponenter."
      }
    ]
  },
  "phone-rep": {
    "title": "Phone Rep",
    "intro": "Vi lagar din mobil & dator enkelt, snabbt och tryggt. Välkommen till PhoneRep hos Teknik House på Sveavägen 139 i Stockholm.",
    "blocks": [
      {
        "h": "Vår butik",
        "p": "Vi är glada att presentera PhoneRep, vår första butik i Stockholm! Hos PhoneRep, en del av Nordic Teknik House AB, strävar vi efter enkel, pålitlig och prisvärd service för mobil- och datorreparationer samt ett brett utbud av tillbehör."
      },
      {
        "h": "Våra tjänster",
        "p": "Vårt erfarna team av tekniker hjälper dig med alla dina teknikproblem — oavsett om det är en trasig skärm, ett batteribyte eller ett mjukvarufel får vi din enhet att fungera som ny igen. Vi erbjuder även reparationer för datorer, så att du kan få hjälp med både mobila och stationära enheter."
      },
      {
        "h": "Våra tillbehör",
        "p": "För att komplettera din enhet erbjuder vi ett brett sortiment av högkvalitativa tillbehör — från skyddande skal och skärmskydd till kraftfulla laddare och hörlurar av hög kvalitet."
      },
      {
        "h": "Begagnade mobiltelefoner",
        "p": "Letar du efter en ny telefon? Utforska vårt urval av kvalitetstestade begagnade mobiltelefoner. Varje enhet har genomgått noggranna tester för att säkerställa prestanda och tillförlitlighet."
      },
      {
        "h": "Besök oss",
        "p": "Du hittar oss på Sveavägen 139 i Stockholm. Butiken är öppen för att välkomna dig och hjälpa till med alla dina teknikbehov."
      },
      {
        "h": "Öppettider",
        "ul": [
          "Måndag–Fredag: 10:00–18:00",
          "Lördag: 11:00–17:00",
          "Söndag: 12:00–16:00"
        ]
      },
      {
        "h": "Kontakt",
        "p": "Butik (PhoneRep): info@phonerep.se · Webbutik (Teknikhouse): info@teknikhouse.se · Sveavägen 139, 113 46 Stockholm."
      }
    ]
  },
  "salj-din-enhet": {
    "title": "Sälj din enhet",
    "intro": "Vi köper din iPhone, Samsung och MacBook. Få ett prisförslag och gör plats för något nytt.",
    "blocks": [
      {
        "p": "Byt upp dig eller töm lådan — vi köper begagnade mobiler, surfplattor och datorer i olika skick. Berätta vilken modell du har och dess skick så återkommer vi med ett prisförslag."
      },
      {
        "h": "Så går det till",
        "ul": [
          "Välj enhet och beskriv skicket.",
          "Få ett prisförslag från oss.",
          "Skicka in enheten — vi betalar snabbt när den kontrollerats."
        ]
      },
      {
        "h": "Kontakt",
        "p": "Mejla info@teknikhouse.se så hjälper vi dig igång."
      }
    ]
  },
  "kundtjanst": {
    "title": "Kundtjänst",
    "intro": "Vi finns här för att hjälpa dig — före, under och efter köpet.",
    "blocks": [
      {
        "h": "Kontakta oss",
        "p": "E-post: info@teknikhouse.se. Vi svarar normalt inom en arbetsdag."
      },
      {
        "h": "Vanliga frågor",
        "ul": [
          "Var är min order? Alla leveranser med PostNord/DHL är spårbara — kontakta oss med ditt ordernummer.",
          "Retur eller reklamation? Se Öppet köp & Retur.",
          "Garanti? Garanti ingår alltid, med livstidsgaranti på skärmar."
        ]
      },
      {
        "h": "Besök butiken",
        "p": "Phone Rep, Sveavägen 139, 113 46 Stockholm. Öppet mån–fre 10–18, lör 11–17, sön 12–16."
      }
    ]
  }
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await props.params
  const page = PAGES[slug]
  if (!page) return { title: "Information | Teknikhouse" }
  return { title: `${page.title} | Teknikhouse`, description: page.intro || page.title }
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
          <LocalizedClientLink href="/" className="hover:text-ui-fg-base">Hem</LocalizedClientLink>
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
              {b.h && <h2 className="text-xl-semi text-ui-fg-base mb-2">{b.h}</h2>}
              {b.p && <p className="leading-7">{b.p}</p>}
              {b.ul && (
                <ul className="list-disc pl-5 flex flex-col gap-y-1 mt-1">
                  {b.ul.map((li, j) => (<li key={j}>{li}</li>))}
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
