import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import { StoreProductCategory, StoreRegion } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getStoreName } from "@lib/util/env"
import { SITE_NAME, absUrl, breadcrumbLd, categoryChain, categoryDescription, categoryTitle, jsonLd } from "@lib/seo"
import { categoryCrumbs, categoryPaths } from "@lib/seo-data"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
}

export async function generateStaticParams() {
  const product_categories = await listCategories()

  if (!product_categories) {
    return []
  }

  const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
    regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
  )

  const categoryHandles = product_categories.map(
    (category: any) => category.handle
  )

  const staticParams = countryCodes
    ?.map((countryCode: string | undefined) =>
      categoryHandles.map((handle: any) => ({
        countryCode,
        category: [handle],
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { category } = await params
  const { page: __page } = await searchParams
  const __pageNo = Math.max(1, parseInt(String(__page || "1"), 10) || 1)

  try {
    const { product_categories } = await getCategoryByHandle(category)


    const __last: any = product_categories[product_categories.length - 1]

    const __md: any = __last?.metadata || {}

    const { categories: __all, pathMap } = await categoryPaths()
    const __chain: any[] = categoryChain(__all as any, __last.handle)
    if (__chain.length) __chain[__chain.length - 1] = __last
    else __chain.push(__last)
    const __path = `/${pathMap.get(__last.handle) || category.join("/")}`
    const __canonical = __md.canonical
      ? absUrl(String(__md.canonical))
      : absUrl(__path) + (__pageNo > 1 ? `?page=${__pageNo}` : "")
    const __title = categoryTitle(__chain, __pageNo)
    const __desc = categoryDescription(__chain)

    return {
      title: __title,
      description: __desc,
      alternates: {
        canonical: __canonical,
        languages: { "sv-SE": __canonical, "x-default": __canonical },
      },
      openGraph: {
        type: "website",
        url: __canonical,
        siteName: SITE_NAME,
        locale: "sv_SE",
        title: __md.og_title || __title,
        description: __md.og_desc || __desc,
        ...(__md.og_image ? { images: [__md.og_image] } : {}),
      },
      ...(__md.noindex === "1"
        ? { robots: { index: false, follow: false } }
        : {}),
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

  const __seo = await categoryPaths()
  const __crumbs = categoryCrumbs(
    __seo.categories,
    __seo.pathMap,
    product_categories[product_categories.length - 1]?.handle
  )

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd(__crumbs)) }}
    />
    <CategoryTemplate
      categories={product_categories}
      sortBy={sortBy}
      page={page}
      countryCode={countryCode}
    />
    </>
  )
}
