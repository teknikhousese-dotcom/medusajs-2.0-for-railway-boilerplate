import { Metadata } from "next"

import { sdk } from "@lib/config"
import { getRegion } from "@lib/data/regions"
import { getProductPrice } from "@lib/util/get-product-price"
import ProductPreview from "@modules/products/components/product-preview"
import { HttpTypes } from "@medusajs/types"

export const metadata: Metadata = {
  title: "Kampanjer och erbjudanden | Teknikhouse",
  description:
    "Fynda reservdelar, mobiltillbehör och mer till kampanjpris hos Teknikhouse. Eget lager i Stockholm, fri frakt över 999 kr och 30 dagars öppet köp.",
  alternates: { canonical: "https://www.teknikhouse.se/campaigns" },
}

const onSale = (product: any) => {
  try {
    const { cheapestPrice } = getProductPrice({ product })
    if (!cheapestPrice) return false
    if (cheapestPrice.price_type === "sale") return true
    const c = (cheapestPrice as any).calculated_price_number
    const o = (cheapestPrice as any).original_price_number
    return typeof c === "number" && typeof o === "number" && c < o
  } catch {
    return false
  }
}

export default async function KampanjerPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const region = await getRegion(countryCode)
  if (!region) return null

  // Products on rea are ~45% of the catalog, so a bounded scan fills the page.
  const found: HttpTypes.StoreProduct[] = []
  for (let i = 0; i < 12 && found.length < 60; i++) {
    let res: any
    try {
      res = await sdk.client.fetch("/store/products", {
        method: "GET",
        query: {
          limit: 100,
          offset: i * 100,
          region_id: region.id,
          fields:
            "thumbnail,handle,title,*variants.calculated_price,+variants.inventory_quantity,*images,+metadata",
        },
        next: { tags: ["products"], revalidate: 600 },
      } as any)
    } catch {
      break
    }
    const prods: any[] = (res as any)?.products || []
    for (const p of prods) if (onSale(p)) found.push(p)
    if (prods.length < 100) break
  }

  return (
    <div className="content-container py-6 small:py-8">
      <div className="flex flex-col items-center text-center mb-8">
        <span style={{ color: "#F50000", fontWeight: 700, letterSpacing: ".06em", fontSize: "13px" }}>
          ★ VÅRA ERBJUDANDEN ★
        </span>
        <h1
          style={{
            fontFamily: '"Poppins",ui-rounded,system-ui,sans-serif',
            fontWeight: 600,
            fontSize: "clamp(24px, 6vw, 30px)",
            color: "#1b1714",
            margin: "6px 0 4px",
          }}
        >
          Kampanjer
        </h1>
        <p style={{ color: "#6f685f", fontSize: "15px", maxWidth: "36rem" }}>
          Ett stort urval av populära produkter till kampanjpris.
        </p>
      </div>

      {found.length ? (
        <ul
          className="grid grid-cols-2 min-[768px]:grid-cols-3 medium:grid-cols-4 large:grid-cols-5 gap-3 min-[768px]:gap-4 medium:gap-5"
          data-testid="kampanjer-grid"
        >
          {found.map((p) => (
            <li key={p.id}>
              <ProductPreview product={p} region={region} />
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ textAlign: "center", color: "#6f685f", padding: "48px 0" }}>
          Inga aktiva kampanjer just nu. Kika in snart igen!
        </p>
      )}
    </div>
  )
}
