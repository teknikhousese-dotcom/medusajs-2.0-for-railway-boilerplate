import type { Metadata } from "next"
import SearchModal from "@modules/search/templates/search-modal"

export const metadata: Metadata = {
  title: "Sök | Teknikhouse",
  description: "Sök bland mobilreservdelar, skärmar, batterier och tillbehör hos Teknikhouse.",
  robots: { index: false, follow: true },
}

export default function SearchModalRoute() {
  return <SearchModal />
}
