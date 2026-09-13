import { Metadata } from "next"

import { sdk } from "@lib/config"
import { getRegion } from "@lib/data/regions"
import { getProductPrice } from "@lib/util/get-product-price"
import ProductPreview from "@modules/products/components/product-preview"
import { HttpTypes } from "@medusajs/types"

export const metadata: Metadata = {
  title: "Kampanjer – Våra Erbjudanden | Teknikhouse",
  description:
    "Ett stort urval av populära produkter till kampanjpris hos Teknikhouse. Fynda reservdelar, tillbehör och mer till rea-pris.",
}

const onSale = (product: any) => {
  try {
    const { cheapestPrice } = getProductPrice({ product })
    return !!cheapestPrice && cheapestPrice.price_type === "sale"
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
  for (let i = 0; i < 4 && found.length < 60; i++) {
    let res: any
    try {
      res = await sdk.client.fetch("/store/products", {
        method: "GET",
        query: {
          limit: 100,
          offset: i * 100,
          region_id: region.id,
          order: "-created_at",
          fields:
            "*variants.calculated_price,+variants.inventory_quantity,*images,+metadata",
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
    <div className="content-container py-8">
      <div className="flex flex-col items-center text-center mb-8">
        <span style={{ color: "#F50000", fontWeight: 700, letterSpacing: ".06em", fontSize: "13px" }}>
          ★ VÅRA ERBJUDANDEN ★
        </span>
        <h1
          style={{
            fontFamily: '"Poppins",ui-rounded,system-ui,sans-serif',
            fontWeight: 600,
            fontSize: "28px",
            color: "#1b1714",
            margin: "6px 0 4px",
          }}
        >
          Kampanjer
        </h1>
        <p style={{ color: "#6f685f", fontSize: "15px" }}>
          Ett stort urval av populära produkter till kampanjpris.
        </p>
      </div>

      {found.length ? (
        <ul
          className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
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
          Inga aktiva kampanjer just nu — kika in snart igen!
        </p>
      )}
    </div>
  )
}
