import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type SearchResultsTemplateProps = {
  query: string
  ids: string[]
  sortBy?: SortOptions
  page?: string
  countryCode: string
}

const SUGGEST: [string, string][] = [
  ["Mobilreservdelar", "/mobilreservdelar"],
  ["Mobiltillbehör", "/mobiltillbehor"],
  ["Batterier", "/batterier"],
  ["Kablar & Laddare", "/kablar-laddare"],
  ["Kampanjer", "/kampanjer"],
]

const FONT = '"Poppins",ui-rounded,system-ui,sans-serif'

const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

const SearchResultsTemplate = ({
  query,
  ids,
  sortBy,
  page,
  countryCode,
}: SearchResultsTemplateProps) => {
  const pageNumber = page ? parseInt(page) : 1
  const q = safeDecode(query)

  return (
    <div className="content-container py-6" data-testid="search-results">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p style={{ fontSize: "13px", color: "#6f685f", margin: 0 }}>Sökresultat för</p>
          <h1
            className="break-words"
            style={{ fontFamily: FONT, fontWeight: 600, fontSize: "clamp(22px, 5.5vw, 27px)", color: "#1b1714", margin: "2px 0 0", lineHeight: 1.25 }}
          >
            &quot;{q}&quot;{" "}
            <span style={{ fontSize: "15px", fontWeight: 500, color: "#6f685f" }}>
              ({ids.length} {ids.length === 1 ? "träff" : "träffar"})
            </span>
          </h1>
        </div>
        <LocalizedClientLink
          href="/store"
          className="text-sm text-ui-fg-subtle underline-offset-2 hover:text-ui-fg-base hover:underline"
        >
          Rensa sökningen
        </LocalizedClientLink>
      </div>

      {ids.length > 0 ? (
        <>
          <RefinementList sortBy={sortBy || "created_at"} search data-testid="sort-by-container" />
          <PaginatedProducts
            productsIds={ids}
            sortBy={sortBy}
            page={pageNumber}
            countryCode={countryCode}
          />
        </>
      ) : (
        <div
          className="mx-auto max-w-xl text-center"
          style={{ border: "1px solid #efeae5", borderRadius: "16px", background: "#faf8f6", padding: "32px 20px" }}
        >
          <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: "18px", color: "#1b1714", margin: "0 0 6px" }}>
            Vi hittade inget som matchar
          </p>
          <p style={{ fontSize: "14.5px", color: "#6f685f", margin: "0 0 18px", lineHeight: 1.55 }}>
            Kolla stavningen eller sök på modellen, till exempel &quot;iPhone 13 skärm&quot;. Du kan också bläddra i kategorierna.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGEST.map(([label, href]) => (
              <LocalizedClientLink
                key={href}
                href={href}
                className="rounded-full border border-ui-border-base bg-white px-4 py-2 text-sm font-medium text-ui-fg-base transition-colors hover:border-ui-fg-base"
              >
                {label}
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchResultsTemplate
