"use client"

import { Text, clx } from "@medusajs/ui"

import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton, {
  isStaleActionError,
} from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
}

const Item = ({ item, type = "full" }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const { handle } = item.variant?.product ?? {}

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .then(() => {
        /* Belt and braces on top of the scoped cache tag the action
           revalidates. See the note in product-actions. */
        startTransition(() => router.refresh())
      })
      .catch((err) => {
        /* Tab opened before a deploy: stale Server Action id, reload once. */
        if (isStaleActionError(err) && typeof window !== "undefined") {
          window.location.reload()
          return
        }
        setError(
          /inventory|stock/i.test(String(err?.message || ""))
            ? "Det finns inte så många i lager. Välj ett lägre antal."
            : "Kunde inte ändra antalet. Ladda om sidan och försök igen."
        )
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  /* TODO: Update this to grab the actual max inventory */
  const maxQtyFromInventory = 10
  const maxQuantity = item.variant?.manage_inventory ? 10 : maxQtyFromInventory

  return (
    <div
      className={clx(
        "grid items-start gap-x-3 small:gap-x-4 border-b border-gray-100 last:border-b-0",
        {
          "grid-cols-[64px_minmax(0,1fr)_auto] py-4": type === "preview",
          "grid-cols-[72px_minmax(0,1fr)] small:grid-cols-[96px_minmax(0,1fr)_auto] py-5":
            type === "full",
        }
      )}
      data-testid="product-row"
    >
      <LocalizedClientLink
        href={"/products/" + handle}
        className="block rounded-xl overflow-hidden bg-gray-50"
      >
        <Thumbnail
          thumbnail={item.variant?.product?.thumbnail}
          images={item.variant?.product?.images}
          size="square"
        />
      </LocalizedClientLink>

      <div className="flex flex-col min-w-0 gap-y-1">
        <Text
          className={clx("text-[#14161C] leading-snug break-words", {
            "txt-medium-plus line-clamp-3": type === "preview",
            "text-[15px] small:text-base font-medium": type === "full",
          })}
          data-testid="product-title"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />

        {type === "preview" && item.quantity > 1 && (
          <span className="flex gap-x-1 txt-small text-ui-fg-muted">
            <span>{item.quantity} st à</span>
            <LineItemUnitPrice item={item} style="tight" />
          </span>
        )}

        {type === "full" && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mt-2 small:mt-3">
            <div className="flex items-center gap-x-3">
              <CartItemSelect
                value={item.quantity}
                onChange={(value) => changeQuantity(parseInt(value.target.value))}
                className="w-16 h-10 px-3"
                aria-label="Antal"
                data-testid="product-select-button"
              >
                {Array.from(
                  {
                    length: Math.min(maxQuantity, 10),
                  },
                  (_, i) => (
                    <option value={i + 1} key={i}>
                      {i + 1}
                    </option>
                  )
                )}
              </CartItemSelect>
              <DeleteButton id={item.id} data-testid="product-delete-button">
                Ta bort
              </DeleteButton>
              {updating && <Spinner />}
            </div>
            <div className="small:hidden text-right">
              <LineItemPrice item={item} style="tight" />
            </div>
          </div>
        )}
        {type === "full" && (
          <ErrorMessage error={error} data-testid="product-error-message" />
        )}
      </div>

      {type === "preview" ? (
        <div className="text-right whitespace-nowrap">
          <LineItemPrice item={item} style="tight" />
        </div>
      ) : (
        <div className="hidden small:flex flex-col items-end whitespace-nowrap">
          <LineItemPrice item={item} style="tight" />
          {item.quantity > 1 && (
            <span className="flex gap-x-1 txt-small text-ui-fg-muted mt-1">
              <span>{item.quantity} st à</span>
              <LineItemUnitPrice item={item} style="tight" />
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default Item
