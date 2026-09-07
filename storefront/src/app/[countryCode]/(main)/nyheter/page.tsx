import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Nyheter | Teknikhouse",
  description: "Senaste nytt om produkter, kampanjer och uppdateringar från Teknikhouse.",
}

export default function NyheterPage() {
  return (
    <div className="content-container py-10">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#F50000] mb-2">
          Teknikhouse
        </p>
        <h1 className="text-3xl small:text-4xl font-semibold tracking-tight">Nyheter</h1>
        <p className="mt-3 text-ui-fg-subtle text-base leading-relaxed">
          Här samlar vi nyheter om nya produkter, kampanjer och uppdateringar från Teknikhouse.
        </p>
      </div>
      <div className="mt-10 rounded-2xl border border-ui-border-base p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFECEC] text-[#F50000] text-xl">
          ✦
        </div>
        <h2 className="text-lg font-semibold">Inga nyheter publicerade än</h2>
        <p className="mt-2 text-ui-fg-subtle text-sm max-w-md mx-auto">
          Vi fyller snart den här sidan. Under tiden hittar du våra senaste produkter i butiken —
          eller prenumerera på nyhetsbrevet för att inte missa något.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/se/store"
            className="rounded-xl bg-[#F50000] px-5 py-3 text-white text-sm font-semibold hover:bg-[#C90000] transition-colors"
          >
            Till butiken
          </a>
          <a
            href="/se/info/om-oss"
            className="rounded-xl border border-ui-border-base px-5 py-3 text-sm font-medium hover:border-ui-fg-base transition-colors"
          >
            Om Teknikhouse
          </a>
        </div>
      </div>
    </div>
  )
}
