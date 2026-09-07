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
      <nav className="text-sm text-ui-fg-muted mb-3">
        <a href={`/${countryCode}`} className="hover:text-ui-fg-base">Hem</a>
        <span className="mx-2">/</span>
        <span className="text-ui-fg-base">Alla produkter</span>
      </nav>
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
