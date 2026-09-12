"use client"

import { isEqual } from "lodash"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"

import { useIntersection } from "@lib/hooks/use-in-view"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"

import ErrorMessage from "@modules/checkout/components/error-message"
import { getProductPrice } from "@lib/util/get-product-price"
import { addToCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const CSS = `
.thb{--red:#F50000;--red-d:#D10000;--ink:#1b1714;--sub:#6f685f;--faint:#a49c92;--bg:#faf8f6;--line:#efeae5;--line2:#e6e0da;--green:#1a9d55;
  --round:"Poppins",ui-rounded,"SF Pro Rounded","Segoe UI",system-ui,sans-serif}
.thb .r{font-family:var(--round)}
.thb .priceblk{border:1px solid var(--line);border-radius:18px;padding:16px 18px;background:var(--bg)}
.thb .savebadge{display:inline-block;background:var(--red);color:#fff;font-family:var(--round);font-weight:600;font-size:12.5px;padding:5px 11px;border-radius:8px;margin-bottom:10px}
.thb .prow{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
.thb .now{font-family:var(--round);font-weight:700;font-size:34px;color:var(--red);letter-spacing:-.02em;line-height:1}
.thb .was{font-size:16px;color:var(--faint);text-decoration:line-through}
.thb .pct{font-family:var(--round);font-weight:600;font-size:13px;color:var(--red-d);background:#ffe4dd;padding:3px 9px;border-radius:7px}
.thb .hist{font-size:11.5px;color:var(--faint);margin-top:8px}
.thb .klarna{font-size:12.5px;color:var(--sub);margin-top:6px;display:flex;align-items:center;gap:7px}
.thb .klarna .kb{background:#ffb3c7;color:#17120b;font-weight:700;font-size:11px;border-radius:5px;padding:2px 7px;font-family:var(--round)}
.thb .cta{display:flex;gap:12px;align-items:stretch;margin:14px 0 8px}
.thb .qty{display:flex;align-items:center;border:1.5px solid var(--line2);border-radius:14px;overflow:hidden;background:#fff}
.thb .qty button{width:42px;height:52px;border:0;background:#fff;font-size:20px;color:var(--ink);cursor:pointer}
.thb .qty button:disabled{color:var(--faint);cursor:not-allowed}
.thb .qty .n{width:34px;text-align:center;font-family:var(--round);font-weight:600;font-size:16px}
.thb .addcart{flex:1;background:var(--red);color:#fff;border:0;border-radius:14px;font-family:var(--round);font-weight:600;font-size:16.5px;display:flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;min-height:52px;transition:background .15s}
.thb .addcart:hover{background:var(--red-d)}
.thb .addcart:disabled{background:#c9c2ba;cursor:not-allowed}
.thb .addcart svg{width:20px;height:20px;stroke:#fff;stroke-width:1.9;fill:none}
.thb .fav{width:52px;border:1.5px solid var(--line2);border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}
.thb .fav svg{width:20px;height:20px;stroke:var(--sub);stroke-width:1.7;fill:none}
.thb .fav.on svg{stroke:var(--red);fill:var(--red)}
.thb .klarnacta{font-size:12.5px;color:var(--sub);text-align:center;margin-bottom:14px}
.thb .trust{border:1px solid var(--line);border-radius:16px;padding:14px 16px}
.thb .trust .tr{display:flex;gap:10px;align-items:center;font-size:13.5px;padding:6px 0;color:var(--ink)}
.thb .trust .tr svg{width:19px;height:19px;stroke:var(--red);stroke-width:1.7;fill:none;flex:0 0 auto}
.thb .trust .tr b{font-weight:600}
.thb .pay{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.thb .pay span{font-size:11px;color:var(--sub);border:1px solid var(--line2);border-radius:7px;padding:4px 9px;font-weight:600}
.thstick{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid #e6e0da;box-shadow:0 -8px 24px -12px rgba(27,23,20,.18);z-index:60;transform:translateY(110%);transition:transform .2s ease}
.thstick.show{transform:translateY(0)}
.thstick .in{max-width:1240px;margin:0 auto;padding:0 24px;display:flex;align-items:center;gap:16px;height:68px}
.thstick .si{width:44px;height:44px;border:1px solid #efeae5;border-radius:11px;background:#faf8f6;display:flex;align-items:center;justify-content:center;overflow:hidden;flex:0 0 auto}
.thstick .si img{width:80%;height:80%;object-fit:contain;mix-blend-mode:multiply}
.thstick .st{font-family:"Poppins",system-ui,sans-serif;font-weight:600;font-size:14px;color:#1b1714;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.thstick .sp{margin-left:auto;font-family:"Poppins",system-ui,sans-serif;font-weight:700;color:#F50000;font-size:19px;white-space:nowrap}
.thstick .sp .w{font-size:13px;color:#a49c92;text-decoration:line-through;font-weight:400;margin-right:8px}
.thstick .sb{background:#F50000;color:#fff;border:0;border-radius:12px;padding:13px 24px;font-family:"Poppins",system-ui,sans-serif;font-weight:600;font-size:15px;cursor:pointer;white-space:nowrap;flex:0 0 auto}
.thstick .sb:disabled{background:#c9c2ba}
@media(max-width:640px){.thstick .st{display:none}.thstick .si{display:none}}
`

const optionsAsKeymap = (variantOptions: any) => {
  return variantOptions?.reduce((acc: Record<string, string | undefined>, varopt: any) => {
    if (varopt.option && varopt.value !== null && varopt.value !== undefined) {
      acc[varopt.option.title] = varopt.value
    }
    return acc
  }, {})
}

const metaOutOfStock = (product: HttpTypes.StoreProduct) => {
  const v = (product?.metadata as Record<string, any> | undefined)?.in_stock
  return v === false || v === "false" || v === 0 || v === "0"
}

export default function ProductActions({
  product,
  region,
  disabled,
}: ProductActionsProps) {
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [fav, setFav] = useState(false)
  const countryCode = useParams().countryCode as string
  const router = useRouter()
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return
    if (product.variants.length === 1) return product.variants[0]
    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  const setOptionValue = (title: string, value: string) => {
    setOptions((prev) => ({ ...prev, [title]: value }))
  }

  const inStock = useMemo(() => {
    if (metaOutOfStock(product)) return false
    if (selectedVariant && !selectedVariant.manage_inventory) return true
    if (selectedVariant?.allow_backorder) return true
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }
    return false
  }, [selectedVariant, product])

  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: selectedVariant?.id,
  })
  const price: any = variantPrice || cheapestPrice
  const onSale = price?.price_type === "sale"
  const savings = onSale
    ? Math.round((price.original_price_number || 0) - (price.calculated_price_number || 0))
    : 0

  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null
    setIsAdding(true)
    setError(null)
    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: qty,
        countryCode,
      })
      startTransition(() => router.refresh())
    } catch (e: any) {
      setError(e?.message ?? "Kunde inte lägga varan i varukorgen. Försök igen.")
    } finally {
      setIsAdding(false)
    }
  }

  const canAdd = inStock && !!selectedVariant && !disabled && !isAdding
  const ctaLabel = !selectedVariant
    ? "Välj variant"
    : !inStock
    ? "Slut i lager"
    : isAdding
    ? "Lägger till…"
    : "Lägg i varukorg"

  return (
    <div className="thb">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="flex flex-col gap-y-3" ref={actionsRef}>
        {(product.variants?.length ?? 0) > 1 && (
          <div className="flex flex-col gap-y-4">
            {(product.options || []).map((option) => (
              <div key={option.id}>
                <OptionSelect
                  option={option}
                  current={options[option.title ?? ""]}
                  updateOption={setOptionValue}
                  title={option.title ?? ""}
                  data-testid="product-options"
                  disabled={!!disabled || isAdding}
                />
              </div>
            ))}
            <Divider />
          </div>
        )}

        {price && (
          <div className="priceblk">
            {onSale && savings > 0 && (
              <span className="savebadge">Spara {savings.toLocaleString("sv-SE")} kr</span>
            )}
            <div className="prow">
              <span className="now" data-testid="product-price">
                {price.calculated_price}
              </span>
              {onSale && <span className="was">{price.original_price}</span>}
              {onSale && price.percentage_diff ? (
                <span className="pct">−{price.percentage_diff}%</span>
              ) : null}
            </div>
            {onSale && (
              <div className="hist">
                Lägsta pris de senaste 30 dagarna: {price.calculated_price}
              </div>
            )}
            <div className="klarna">
              <span className="kb">Klarna</span> Dela upp betalningen räntefritt
            </div>
          </div>
        )}

        <div className="cta">
          <div className="qty">
            <button
              type="button"
              aria-label="Minska antal"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
            >
              −
            </button>
            <span className="n">{qty}</span>
            <button type="button" aria-label="Öka antal" onClick={() => setQty((q) => q + 1)}>
              +
            </button>
          </div>
          <button
            className="addcart"
            onClick={handleAddToCart}
            disabled={!canAdd}
            data-testid="add-product-button"
          >
            <svg viewBox="0 0 24 24">
              <path d="M3 4h2l2.2 11a1 1 0 001 .8h9a1 1 0 001-.8L21 8H6.5" />
              <circle cx="9.5" cy="20" r="1.3" />
              <circle cx="17.5" cy="20" r="1.3" />
            </svg>
            {ctaLabel}
          </button>
          <button
            type="button"
            className={"fav" + (fav ? " on" : "")}
            aria-label="Spara som favorit"
            onClick={() => setFav((f) => !f)}
          >
            <svg viewBox="0 0 24 24">
              <path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21z" />
            </svg>
          </button>
        </div>
        <div className="klarnacta">Köp nu, betala senare med Klarna · Fri frakt över 999 kr</div>

        <div className="trust">
          <div className="tr">
            <svg viewBox="0 0 24 24"><path d="M3 13h6l2-8 3 16 2-6h5" /></svg>
            <span>
              <b>{inStock ? "I lager" : "Tillfälligt slut"}</b>
              {inStock ? " – skickas idag, hemma om 1–3 dagar" : " – vi fyller på snart"}
            </span>
          </div>
          <div className="tr">
            <svg viewBox="0 0 24 24"><path d="M4 8a8 8 0 0116 0M20 4v4h-4" /><path d="M20 16a8 8 0 01-16 0M4 20v-4h4" /></svg>
            30 dagars öppet köp
          </div>
          <div className="tr">
            <svg viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>
            Garanti ingår · trygg e-handel
          </div>
          <div className="pay">
            {["Swish", "Klarna", "VISA", "Mastercard", "PostNord"].map((p) => (
              <span key={p}>{p}</span>
            ))}
          </div>
        </div>

        <ErrorMessage error={error} data-testid="add-product-error-message" />
      </div>

      {/* Sticky buy bar — appears when the buy box scrolls out of view */}
      <div className={"thstick" + (!inView ? " show" : "")}>
        <div className="in">
          {product.thumbnail && (
            <span className="si">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.thumbnail} alt="" />
            </span>
          )}
          <span className="st">{product.title}</span>
          {price && (
            <span className="sp">
              {onSale && <span className="w">{price.original_price}</span>}
              {price.calculated_price}
            </span>
          )}
          <button className="sb" onClick={handleAddToCart} disabled={!canAdd}>
            {inStock ? "Lägg i varukorg" : "Slut i lager"}
          </button>
        </div>
      </div>
    </div>
  )
}
