import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import ThHome from "@modules/home/components/th-home"
import LatestProducts from "@modules/home/components/latest-products"
import { getCollectionsWithProducts } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { getProductsList } from "@lib/data/products"
import { getStoreName } from "@lib/util/env"

export const metadata: Metadata = {
  title: getStoreName(),
  description: `Shop the latest at ${getStoreName()}.`,
}

export default async function Home({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const collections = await getCollectionsWithProducts(countryCode)
  const region = await getRegion(countryCode)

  let homeProducts: any[] = []
  try {
    const homeProductsRes: any = await getProductsList({
      countryCode,
      queryParams: { limit: 20 } as any,
    })
    homeProducts = homeProductsRes?.response?.products ?? []
  } catch (e) {
    homeProducts = []
  }

  if (!collections || !region) {
    return null
  }

  // The seed creates categories but no collections, so on a fresh store the
  // featured section would render nothing at all.
  const hasFeaturedProducts = collections.some(
    (collection) => collection.products?.length
  )

  return (
    <>
      {/* ===================================================================
        * EXAMPLE SECTION START
        *
        * <ThHome region={region} products={homeProducts} /> is the dashed placeholder block on your homepage. To delete
        * it: remove the <ThHome region={region} products={homeProducts} /> line just below, remove its import at the top
        * of this file, then delete the folder
        * src/modules/home/components/hero. Nothing else depends on it.
        * =================================================================== */}
      <ThHome region={region} products={homeProducts} />
      {/* ===================================================================
        * EXAMPLE SECTION END
        * =================================================================== */}
    
    </>
  )
}
