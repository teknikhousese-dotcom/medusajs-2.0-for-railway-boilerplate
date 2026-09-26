import { Metadata } from "next"

import SearchResultsTemplate from "@modules/search/templates/search-results-template"
import { searchProducts, type SearchSort } from "@modules/search/actions"

export const metadata: Metadata = {
  title: "Sök",
  description: "Sök i hela vårt sortiment.",
  robots: { index: false, follow: true },
}

// Always render fresh: search results must never be served from a stale
// per-query static cache (Railway persists .next/cache across deploys).
export const dynamic = "force-dynamic"

type Params = {
  params: Promise<{ query: string; countryCode: string }>
  searchParams: Promise<{
    sort?: string
    sortBy?: string
    page?: string
  }>
}

const SORTS: SearchSort[] = ["relevance", "price_asc", "price_desc", "newest", "name"]

function pickSort(sort?: string, sortBy?: string): SearchSort {
  const s = sort || (sortBy === "created_at" ? "newest" : sortBy === "title" ? "name" : sortBy)
  return SORTS.includes(s as SearchSort) ? (s as SearchSort) : "relevance"
}

export default async function SearchResults({ params, searchParams }: Params) {
  const { query, countryCode } = await params
  const sp = await searchParams
  const sort = pickSort(sp.sort, sp.sortBy)
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1)

  const result = await searchProducts({ query, page, limit: 24, sort })

  return <SearchResultsTemplate result={result} sort={sort} page={page} countryCode={countryCode} />
}
