import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import ProductBreadcrumb from "@modules/products/components/product-breadcrumb"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import ProductActionsWrapper from "./product-actions-wrapper"
import { HttpTypes } from "@medusajs/types"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const USP = [
  { t: "Snabb leverans", s: "Skickas idag · 1–3 dagar", p: "M3 13h6l2-8 3 16 2-6h5" },
  { t: "Öppet köp 30 dagar", s: "Enkelt att returnera", p: "M4 8a8 8 0 0116 0M20 4v4h-4|M20 16a8 8 0 01-16 0M4 20v-4h4" },
  { t: "Garanti ingår", s: "Trygg e-handel", p: "M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z|M9 12l2 2 4-4" },
  { t: "Trygg betalning", s: "Swish · Klarna · Kort", p: "M3 6h18v12H3z|M3 10h18" },
]

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      <ProductBreadcrumb title={product.title} />

      <div
        className="content-container flex flex-col small:flex-row small:items-start small:gap-x-12 py-2 small:py-6 relative"
        data-testid="product-container"
      >
        <div className="w-full small:flex-1 relative">
          <ImageGallery images={product?.images || []} />
        </div>
        <div className="flex flex-col w-full small:max-w-[440px] small:sticky small:top-24 py-8 small:py-0 gap-y-6">
          <ProductInfo product={product} />
          <ProductActionsWrapper id={product.id} region={region} />
        </div>
      </div>

      {/* Full-width tabs (Produktbeskrivning / Specifikationer / Frakt & Retur) */}
      <div className="content-container" style={{ paddingTop: "8px", paddingBottom: "8px" }}>
        <ProductTabs product={product} />
      </div>

      {/* USP / trygghetsband */}
      <div style={{ background: "#faf8f6", borderTop: "1px solid #efeae5", borderBottom: "1px solid #efeae5", marginTop: "28px" }}>
        <div
          className="content-container"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "20px", padding: "24px" }}
        >
          {USP.map((u) => (
            <div key={u.t} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#F50000" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                {u.p.split("|").map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </svg>
              <div>
                <b style={{ fontFamily: '"Poppins",ui-rounded,system-ui,sans-serif', fontSize: "14px", display: "block", color: "#1b1714" }}>{u.t}</b>
                <span style={{ fontSize: "12px", color: "#6f685f" }}>{u.s}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="content-container my-16 small:my-24"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
