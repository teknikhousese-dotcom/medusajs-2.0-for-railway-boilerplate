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
// and any Produktspecifikation table) shown inside the Produktinformation tab.
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
.thspec{width:100%;border-collapse:collapse;font-size:14px}
.thspec tr{border-bottom:1px solid #efeae5}
.thspec td{padding:11px 0}
.thspec td:first-child{color:#6f685f;width:42%}
.thspec td:last-child{font-weight:600;color:#1b1714;text-align:right}
`

const m = (product: any, ...keys: string[]) => {
  const md = product?.metadata || {}
  for (const k of keys) {
    if (md[k] !== undefined && md[k] !== null && String(md[k]).trim() !== "") return String(md[k])
  }
  return undefined
}

const buildSpecs = (product: any): [string, string][] => {
  const v0: any = product.variants?.[0]
  const rows: [string, string | undefined][] = [
    ["Artikelnummer", v0?.sku || m(product, "sku", "artikelnr", "artnr")],
    ["EAN / GTIN", v0?.barcode || m(product, "ean", "gtin", "barcode")],
    ["Märke", (product as any)?.brand || product.collection?.title || m(product, "brand", "marke")],
    ["Modell", m(product, "model", "modell", "kompatibilitet", "passar")],
    ["Färg", m(product, "color", "farg", "färg")],
    ["Material", m(product, "material")],
    ["Vikt", product.weight ? `${product.weight} g` : undefined],
    ["Typ", product.type?.value || m(product, "type", "typ")],
    ["Garanti", "Ingår alltid"],
  ]
  return rows.filter(([, v]) => !!v) as [string, string][]
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const specs = buildSpecs(product)

  const tabs = [
    {
      label: "Produktinformation",
      component: <ProductInfoTab product={product} />,
    },
    ...(specs.length
      ? [{ label: "Specifikationer", component: <SpecTab specs={specs} /> }]
      : []),
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
    <div className="text-small-regular py-8 text-ui-fg-subtle">
      Ingen ytterligare beskrivning tillgänglig för denna produkt.
    </div>
  )
}

const SpecTab = ({ specs }: { specs: [string, string][] }) => {
  return (
    <div className="py-6">
      <style dangerouslySetInnerHTML={{ __html: DESC_CSS }} />
      <table className="thspec">
        <tbody>
          {specs.map(([k, v]) => (
            <tr key={k}>
              <td>{k}</td>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
