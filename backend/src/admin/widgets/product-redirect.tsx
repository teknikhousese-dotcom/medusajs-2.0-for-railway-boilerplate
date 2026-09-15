import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"

/**
 * Teknikhouse.se — open products in the Wiki product editor.
 * When someone lands on the native Medusa product detail page, redirect them to
 * the Swedish "Ny/Redigera produkt" form (/app/produkt-form?id=...), which loads
 * the same product by its id.
 */
const ProductRedirect = ({ data }: { data: any }) => {
  useEffect(() => {
    const id = data && data.id
    if (id) window.location.replace("/app/produkt-form?id=" + id)
  }, [data && data.id])
  return null
}

export const config = defineWidgetConfig({ zone: "product.details.before" })
export default ProductRedirect
