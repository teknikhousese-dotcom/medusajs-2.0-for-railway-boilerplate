import { notFound } from "next/navigation"
import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

export default function CategoryTemplate({
  categories,
  sortBy,
  page,
  countryCode,
}: {
  categories: HttpTypes.StoreProductCategory[]
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  const category = categories[categories.length - 1]
  const parents = categories.slice(0, categories.length - 1)

  if (!category || !countryCode) notFound()

  return (
    <div className="content-container py-6" data-testid="category-container">
      <nav className="text-sm text-ui-fg-muted mb-3 flex flex-wrap items-center gap-x-2">
        <LocalizedClientLink href="/" className="hover:text-ui-fg-base">Hem</LocalizedClientLink>
        <span>/</span>
        {parents &&
          parents.map((parent) => (
            <span key={parent.id} className="flex items-center gap-x-2">
              <LocalizedClientLink className="hover:text-ui-fg-base" href={`/categories/${parent.handle}`} data-testid="sort-by-link">
                {parent.name}
              </LocalizedClientLink>
              <span>/</span>
            </span>
          ))}
        <span className="text-ui-fg-base">{category.name}</span>
      </nav>
      <div className="mb-8 border-b border-ui-border-base pb-6">
        <h1 data-testid="category-page-title" className="text-3xl font-semibold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-ui-fg-subtle max-w-2xl">{category.description}</p>
        )}
        {category.category_children && category.category_children.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {category.category_children.map((c) => (
              <LocalizedClientLink key={c.id} href={`/categories/${c.handle}`} className="text-sm font-medium px-4 py-2 rounded-full border border-ui-border-base bg-ui-bg-subtle hover:border-ui-fg-base transition-colors">
                {c.name}
              </LocalizedClientLink>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col small:flex-row small:items-start">
        <RefinementList sortBy={sort} data-testid="sort-by-container" />
        <div className="w-full">
          <Suspense fallback={<SkeletonProductGrid />}>
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              categoryId={category.id}
              countryCode={countryCode}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
