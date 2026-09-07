import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Alla produkter",
  description: "Utforska hela vårt sortiment.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage({ searchParams, params }: Params) {
  const { sortBy, page } = await searchParams
  const { countryCode } = await params

  return <StoreTemplate sortBy={sortBy} page={page} countryCode={countryCode} />
}
