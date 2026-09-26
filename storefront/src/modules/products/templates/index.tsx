import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import ProductReviews from "@modules/products/components/product-reviews"
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
  { t: "Snabb leverans", s: "Skickas idag · 1-3 dagar", p: "M3 13h6l2-8 3 16 2-6h5" },
  { t: "Öppet köp 30 dagar", s: "Enkelt att returnera", p: "M4 8a8 8 0 0116 0M20 4v4h-4|M20 16a8 8 0 01-16 0M4 20v-4h4" },
  { t: "Garanti ingår", s: "Handla tryggt och säkert hos oss", p: "M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z|M9 12l2 2 4-4" },
  { t: "Säker betalning", s: "Swish · Klarna · Kort", p: "M3 6h18v12H3z|M3 10h18" },
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

      <div className="content-container pb-2 pt-1 small:py-6">
        <div
          className="relative flex flex-col min-[768px]:flex-row min-[768px]:items-start min-[768px]:gap-x-6 small:gap-x-10"
          data-testid="product-container"
        >
          <div className="relative w-full min-w-0 min-[768px]:w-1/2 min-[768px]:sticky min-[768px]:top-24 medium:w-[600px] medium:flex-none">
            <ImageGallery images={product?.images || []} />
          </div>
          <div className="flex w-full min-w-0 flex-col gap-y-5 pt-6 pb-4 min-[768px]:w-1/2 min-[768px]:py-0 medium:ml-auto medium:w-[440px] medium:flex-none">
            <ProductInfo product={product} />
            <ProductActionsWrapper id={product.id} region={region} />
          </div>
        </div>
      </div>

      {/* Full-width tabs (Produktbeskrivning / Specifikationer / Frakt & Retur) */}
      <div className="content-container" style={{ paddingTop: "8px", paddingBottom: "8px" }}>
        <ProductTabs product={product} />
      </div>

      <ProductReviews productId={product.id} productTitle={product.title} />

      {/* USP / trygghetsband */}
      <div style={{ background: "#faf8f6", borderTop: "1px solid #efeae5", borderBottom: "1px solid #efeae5", marginTop: "28px" }}>
        <div
          className="content-container"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,210px),1fr))", gap: "16px 20px", paddingTop: "22px", paddingBottom: "22px" }}
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
        className="content-container my-10 small:my-20"
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
