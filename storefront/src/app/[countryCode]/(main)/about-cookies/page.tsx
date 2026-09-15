export const metadata = { title: "Om cookies | Teknikhouse" }

export default function AboutCookiesPage() {
  return (
    <div className="content-container py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold mb-4">Om cookies</h1>
        <div className="space-y-4 text-[15px] leading-7 text-gray-700">
          <p>
            Teknikhouse.se använder cookies för att webbplatsen ska fungera, för att komma ihåg dina inställningar och din varukorg, samt för att analysera trafik och förbättra din upplevelse.
          </p>
          <h2 className="text-xl font-semibold text-gray-900 pt-2">Vad är cookies?</h2>
          <p>En cookie är en liten textfil som sparas i din webbläsare. Den innehåller ingen information som direkt identifierar dig som person.</p>
          <h2 className="text-xl font-semibold text-gray-900 pt-2">Vilka cookies vi använder</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><b>Nödvändiga</b> — krävs för att kassan, inloggning och varukorgen ska fungera.</li>
            <li><b>Funktionella</b> — kommer ihåg val som språk och senast visade produkter.</li>
            <li><b>Analys</b> — hjälper oss förstå hur webbplatsen används så att vi kan förbättra den.</li>
          </ul>
          <h2 className="text-xl font-semibold text-gray-900 pt-2">Hantera cookies</h2>
          <p>
            Du kan när som helst radera eller blockera cookies i din webbläsares inställningar. Om du blockerar nödvändiga cookies kan vissa delar av webbplatsen sluta fungera.
          </p>
          <h2 className="text-xl font-semibold text-gray-900 pt-2">Frågor?</h2>
          <p>
            Kontakta oss på <a className="text-[#D10000] hover:underline" href="mailto:info@teknikhouse.se">info@teknikhouse.se</a> om du har frågor om hur vi hanterar cookies och personuppgifter. Läs mer i vår <a className="text-[#D10000] hover:underline" href="/info/integritetspolicy">integritetspolicy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
