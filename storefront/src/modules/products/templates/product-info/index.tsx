import { HttpTypes } from "@medusajs/types"
import { Heading } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import RecordView from "@modules/home/components/th-home/record-view"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

// The full product description is rendered in the "Produktinformation" tab
// (ProductTabs), so it is intentionally NOT repeated here — only the
// collection link and the product title live in this top block.
const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info">
      <RecordView id={product.id} title={product.title} thumbnail={product.thumbnail} />
      <div className="flex flex-col gap-y-4">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-medium text-ui-fg-muted hover:text-ui-fg-subtle"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
        <Heading
          level="h2"
          className="text-2xl leading-8 text-ui-fg-base"
          data-testid="product-title"
        >
          {product.title}
        </Heading>
      </div>
    </div>
  )
}

export default ProductInfo
