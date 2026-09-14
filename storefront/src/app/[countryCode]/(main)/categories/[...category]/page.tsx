import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle } from "@lib/data/categories"
import { StoreProductCategory } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getStoreName } from "@lib/util/env"

// Category pages read the sortBy search param, so they must render per request
// rather than be statically prerendered (a static page ignores ?sortBy).
export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params

  try {
    const { product_categories } = await getCategoryByHandle(category)

    const title = product_categories
      .map((category: StoreProductCategory) => category.name)
      .join(" | ")

    const description =
      product_categories[product_categories.length - 1].description ??
      `${title} category.`

    return {
      title: `${title} | ${getStoreName()}`,
      description,
      alternates: {
        canonical: `${category.join("/")}`,
      },
    }
  } catch (error) {
    notFound()
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category, countryCode } = await params
  const { sortBy, page } = await searchParams

  const { product_categories } = await getCategoryByHandle(category)

  if (!product_categories) {
    notFound()
  }

  return (
    <CategoryTemplate
      categories={product_categories}
      sortBy={sortBy}
      page={page}
      countryCode={countryCode}
    />
  )
}
