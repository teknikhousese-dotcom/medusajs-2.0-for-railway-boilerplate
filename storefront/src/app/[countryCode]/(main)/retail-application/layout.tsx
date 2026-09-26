import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Bli företagskund | Teknikhouse",
  description:
    "Ansök om företagskonto hos Teknikhouse och få fakturaköp, volympriser och en fast kontaktperson för mobilreservdelar, skärmar, batterier och tillbehör.",
  alternates: { canonical: "https://www.teknikhouse.se/retail-application" },
}

export default function RetailApplicationLayout({ children }: { children: React.ReactNode }) {
  return children
}
