"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const CSS = `
.thtabs{--red:#F50000;--ink:#1b1714;--sub:#6f685f;--line:#efeae5;--round:"Poppins",ui-rounded,"SF Pro Rounded","Segoe UI",system-ui,sans-serif}
.thtabs .bar{display:flex;gap:26px;border-bottom:1px solid var(--line);flex-wrap:wrap;margin-bottom:22px}
.thtabs .tb{font-family:var(--round);font-weight:600;font-size:14.5px;color:var(--sub);padding:12px 2px;border:0;border-bottom:3px solid transparent;background:none;cursor:pointer}
.thtabs .tb.active{color:var(--ink);border-color:var(--red)}
.thtabs .body{max-width:880px}
.thdesc{color:#3f3f52;font-size:14.5px;line-height:1.6}
.thdesc h1,.thdesc h2,.thdesc h3,.thdesc h4{color:#14161c;line-height:1.3;margin:18px 0 6px;font-family:var(--round);font-weight:600}
.thdesc h4{font-size:16px}
.thdesc p{margin:0 0 12px}
.thdesc ul,.thdesc ol{margin:0 0 12px;padding-left:20px}
.thdesc li{margin:3px 0}
.thdesc strong{color:#14161c}
.thdesc a{color:#F50000;text-decoration:underline}
.thdesc img{max-width:100%;height:auto;border-radius:8px;margin:8px 0}
.thdesc table{width:100%;border-collapse:collapse;margin:14px 0;font-size:13.5px}
.thdesc caption{text-align:left;font-weight:700;color:#14161c;margin-bottom:6px}
.thdesc th,.thdesc td{border:1px solid #E6E8EE;padding:8px 10px;text-align:left;vertical-align:top}
.thdesc thead th{background:#14161c;color:#fff}
.thdesc tbody tr:nth-child(odd){background:#F7F8FA}
.thdesc td:first-child,.thdesc th:first-child{width:38%;font-weight:600;color:#14161c}
.thspec{width:100%;border-collapse:collapse;font-size:14.5px;max-width:640px}
.thspec tr{border-bottom:1px solid var(--line)}
.thspec td{padding:12px 0}
.thspec td:first-child{color:var(--sub);width:44%}
.thspec td:last-child{font-weight:600;color:var(--ink);text-align:right}
.thfrakt{display:flex;flex-direction:column;gap:20px;max-width:640px}
.thfrakt .fr{display:flex;gap:12px;align-items:flex-start}
.thfrakt .fr svg{width:24px;height:24px;stroke:var(--red);stroke-width:1.7;fill:none;flex:0 0 auto;margin-top:2px}
.thfrakt .fr b{font-family:var(--round);font-weight:600;font-size:15px;display:block;color:var(--ink)}
.thfrakt .fr p{margin:2px 0 0;font-size:14px;color:var(--sub)}
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
    { id: "desc", label: "Produktbeskrivning" },
    ...(specs.length ? [{ id: "spec", label: "Specifikationer" }] : []),
    { id: "frakt", label: "Frakt & Retur" },
  ]
  const [active, setActive] = useState("desc")

  return (
    <div className="thtabs">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="bar" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            className={"tb" + (active === t.id ? " active" : "")}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="body">
        {active === "desc" &&
          (product.description ? (
            <div
              className="thdesc"
              data-testid="product-description"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          ) : (
            <p style={{ color: "#6f685f", fontSize: "14.5px" }}>
              Ingen ytterligare beskrivning tillgänglig för denna produkt.
            </p>
          ))}

        {active === "spec" && (
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
        )}

        {active === "frakt" && (
          <div className="thfrakt">
            <div className="fr">
              <svg viewBox="0 0 24 24"><path d="M3 13h6l2-8 3 16 2-6h5" /></svg>
              <div>
                <b>Snabb leverans</b>
                <p>Ditt paket levereras inom 1–3 arbetsdagar till ditt ombud eller hem till dörren. Fri frakt över 999 kr.</p>
              </div>
            </div>
            <div className="fr">
              <svg viewBox="0 0 24 24"><path d="M4 8a8 8 0 0116 0M20 4v4h-4" /><path d="M20 16a8 8 0 01-16 0M4 20v-4h4" /></svg>
              <div>
                <b>30 dagars öppet köp</b>
                <p>Ångrar du köpet? Returnera varan inom 30 dagar så betalar vi tillbaka pengarna.</p>
              </div>
            </div>
            <div className="fr">
              <svg viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>
              <div>
                <b>Garanti ingår</b>
                <p>Garanti ingår alltid och alla produkter testas innan de skickas. Trygg e-handel.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductTabs
