import { Metadata } from "next"
import { notFound } from "next/navigation"

import ProductTemplate from "@modules/products/templates"
import { getRegion, listRegions } from "@lib/data/regions"
import { getProductByHandle, getProductsList } from "@lib/data/products"
import { getStoreName } from "@lib/util/env"
import {
  SITE_NAME,
  absUrl,
  breadcrumbLd,
  jsonLd,
  metaDescription,
  pageAlternates,
  productDescription,
  productLd,
  productTitle,
} from "@lib/seo"
import { productReviews, productSeoContext } from "@lib/seo-data"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
}

export async function generateStaticParams() {
  const countryCodes = await listRegions().then(
    (regions) =>
      regions
        ?.map((r) => r.countries?.map((c) => c.iso_2))
        .flat()
        .filter(Boolean) as string[]
  )

  // generateStaticParams must return an array; returning null makes the build
  // fail rather than fall back to on-demand rendering.
  if (!countryCodes) {
    return []
  }

  const products = await Promise.all(
    countryCodes.map((countryCode) => {
      return getProductsList({ countryCode })
    })
  ).then((responses) =>
    responses.map(({ response }) => response.products).flat()
  )

  const staticParams = countryCodes
    ?.map((countryCode) =>
      products.map((product) => ({
        countryCode,
        handle: product.handle,
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, countryCode } = await params
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  const product = await getProductByHandle(handle, region.id)

  if (!product) {
    notFound()
  }

  const _md: any = product.metadata || {}
  const _metaTitle = productTitle(product)
  const _metaDesc = productDescription(product)
  const { path } = await productSeoContext(product)
  const _url = absUrl(path)
  const _images = [product.thumbnail, ...(product.images || []).map((i) => i.url)]
    .filter((u, i, a): u is string => !!u && a.indexOf(u) === i)
    .slice(0, 4)

  return {
    title: _metaTitle,
    description: _metaDesc,
    alternates: pageAlternates(path),
    openGraph: {
      type: "website",
      url: _url,
      siteName: SITE_NAME,
      locale: "sv_SE",
      title: _metaTitle,
      description: _metaDesc,
      images: _images.map((url) => ({ url, alt: product.title })),
    },
    twitter: {
      card: "summary_large_image",
      title: _metaTitle,
      description: _metaDesc,
      images: _images.slice(0, 1),
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { handle, countryCode } = await params
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  const pricedProduct = await getProductByHandle(handle, region.id)
  if (!pricedProduct) {
    notFound()
  }

  const seo = await productSeoContext(pricedProduct)
  const productJsonLd = productLd(
    pricedProduct,
    absUrl(seo.path),
    await productReviews(pricedProduct.id)
  )
  const hasRichData = !!(productJsonLd.offers || productJsonLd.aggregateRating)

  return (
    <>
      {hasRichData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd(seo.crumbs)) }}
      />
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode={countryCode}
      />
    </>
  )
}
