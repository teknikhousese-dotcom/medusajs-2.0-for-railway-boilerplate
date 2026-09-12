import { HttpTypes } from "@medusajs/types"
import { Heading } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import RecordView from "@modules/home/components/th-home/record-view"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

// Scoped styling so the imported rich-HTML descriptions (h4/strong/span/p, lists)
// render as readable formatted text instead of a wall of raw markup.
const DESC_CSS = `
.thdesc{color:#3f3f52;font-size:14px;line-height:1.6}
.thdesc h1,.thdesc h2,.thdesc h3,.thdesc h4{color:#14161c;line-height:1.3;margin:16px 0 6px;font-weight:700}
.thdesc h4{font-size:15px}
.thdesc p{margin:0 0 10px}
.thdesc ul,.thdesc ol{margin:0 0 10px;padding-left:20px}
.thdesc li{margin:2px 0}
.thdesc strong{color:#14161c}
.thdesc a{color:#F50000;text-decoration:underline}
.thdesc img{max-width:100%;height:auto;border-radius:8px;margin:8px 0}
`

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

        {product.description ? (
          <>
            <style dangerouslySetInnerHTML={{ __html: DESC_CSS }} />
            <div
              className="thdesc"
              data-testid="product-description"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </>
        ) : null}
      </div>
    </div>
  )
}

export default ProductInfo
