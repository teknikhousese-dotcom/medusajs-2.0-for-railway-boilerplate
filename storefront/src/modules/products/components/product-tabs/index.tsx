"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

// Styling for the imported rich-HTML description (headings, paragraphs, lists,
// and the Produktspecifikation table) shown inside the Produktinformation tab.
const DESC_CSS = `
.thdesc{color:#3f3f52;font-size:14px;line-height:1.6}
.thdesc h1,.thdesc h2,.thdesc h3,.thdesc h4{color:#14161c;line-height:1.3;margin:18px 0 6px;font-weight:700}
.thdesc h4{font-size:15px}
.thdesc p{margin:0 0 10px}
.thdesc ul,.thdesc ol{margin:0 0 10px;padding-left:20px}
.thdesc li{margin:2px 0}
.thdesc strong{color:#14161c}
.thdesc a{color:#F50000;text-decoration:underline}
.thdesc img{max-width:100%;height:auto;border-radius:8px;margin:8px 0}
.thdesc table{width:100%;border-collapse:collapse;margin:14px 0;font-size:13.5px}
.thdesc caption{text-align:left;font-weight:700;color:#14161c;margin-bottom:6px}
.thdesc th,.thdesc td{border:1px solid #E6E8EE;padding:8px 10px;text-align:left;vertical-align:top}
.thdesc thead th{background:#14161c;color:#fff}
.thdesc tbody tr:nth-child(odd){background:#F7F8FA}
.thdesc td:first-child,.thdesc th:first-child{width:38%;font-weight:600;color:#14161c}
`

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs = [
    {
      label: "Produktinformation",
      component: <ProductInfoTab product={product} />,
    },
    {
      label: "Frakt & Retur",
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple" defaultValue={["Produktinformation"]}>
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  if (product.description) {
    return (
      <div className="py-6">
        <style dangerouslySetInnerHTML={{ __html: DESC_CSS }} />
        <div
          className="thdesc"
          data-testid="product-description"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      </div>
    )
  }
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-2 gap-x-8">
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">Vikt</span>
            <p>{product.weight ? `${product.weight} g` : "-"}</p>
          </div>
          <div>
            <span className="font-semibold">Typ</span>
            <p>{product.type ? product.type.value : "-"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const ShippingInfoTab = () => {
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 gap-y-8">
        <div className="flex items-start gap-x-2">
          <FastDelivery />
          <div>
            <span className="font-semibold">Snabb leverans</span>
            <p className="max-w-sm">
              Ditt paket levereras inom 1–3 arbetsdagar till ditt ombud eller hem till dörren.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Refresh />
          <div>
            <span className="font-semibold">Enkla byten</span>
            <p className="max-w-sm">
              Passar inte varan riktigt? Ingen fara – vi byter den mot en ny.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Back />
          <div>
            <span className="font-semibold">Enkla returer</span>
            <p className="max-w-sm">
              Returnera bara varan så betalar vi tillbaka pengarna. Inga krångliga frågor – vi gör allt för att din retur ska vara smidig.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
