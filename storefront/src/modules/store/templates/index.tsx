import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div className="content-container py-6" data-testid="category-container">
      <div className="mb-6 flex flex-wrap gap-2">
        {["Mobilreservdelar", "Mobiltillbehör", "Batterier & Powerbank", "Kablar & Laddare", "Hörlurar & Högtalare", "Begagnade mobiler"].map((c) => (
          <a key={c} href={({"Mobilreservdelar":"/mobilreservdelar","Mobiltillbehör":"/mobiltillbehor","Batterier & Powerbank":"/batterier","Kablar & Laddare":"/kablar-laddare","Hörlurar & Högtalare":"/horlurar-hogtalare","Begagnade mobiler":"/mobiler-surfplattor"} as Record<string, string>)[c] || "/store"} className="text-sm font-medium px-4 py-2 rounded-full border border-ui-border-base bg-ui-bg-subtle hover:border-ui-fg-base hover:text-ui-fg-base transition-colors">
            {c}
          </a>
        ))}
      </div>
      <div className="mb-8 border-b border-ui-border-base pb-6">
        <h1 data-testid="store-page-title" className="text-3xl font-semibold tracking-tight">Alla produkter</h1>
        <p className="mt-2 text-ui-fg-subtle max-w-2xl">Utforska hela vårt sortiment av mobilreservdelar, tillbehör och verktyg — fri frakt över 999 kr och öppet köp i 30 dagar.</p>
      </div>
      <div className="flex flex-col small:flex-row small:items-start">
        <RefinementList sortBy={sort} data-testid="sort-by-container" />
        <div className="w-full">
          <Suspense fallback={<SkeletonProductGrid />}>
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              countryCode={countryCode}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default StoreTemplate
