import { Metadata } from "next"
import { HttpTypes } from "@medusajs/types"
import { pageAlternates } from "@lib/seo"

import ThHome from "@modules/home/components/th-home"
import { getRegion } from "@lib/data/regions"
import { getHomeRails } from "@modules/home/components/th-home/home-rails"

export const metadata: Metadata = {
  alternates: pageAlternates("/"),
  title: "Mobilreservdelar till iPhone och Samsung | Teknikhouse",
  description:
    "Reservdelar till iPhone och Samsung, mobiltillbehör, laddare, hörlurar, datortillbehör och begagnade mobiler. Butik i Stockholm, fri frakt över 999 kr och 30 dagars öppet köp.",
}

export default async function Home({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // Startsidans tre produktrader (Bästsäljare, Produkter på rea, Nyss
  // inkommet) i den ordning ThHome delar upp dem. Reglerna står i home-rails.ts.
  let homeProducts: HttpTypes.StoreProduct[] = []
  try {
    homeProducts = await getHomeRails(countryCode)
  } catch (e) {
    homeProducts = []
  }

  return <ThHome region={region} products={homeProducts} />
}
