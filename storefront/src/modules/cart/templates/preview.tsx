"use client"

import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"

import Item from "@modules/cart/components/item"

type ItemsTemplateProps = {
  items?: HttpTypes.StoreCartLineItem[]
}

const ItemsPreviewTemplate = ({ items }: ItemsTemplateProps) => {
  const hasOverflow = items && items.length > 4

  return (
    <div
      className={clx("mt-4", {
        "pl-[1px] overflow-y-auto overflow-x-hidden no-scrollbar max-h-[420px]":
          hasOverflow,
      })}
      data-testid="items-table"
    >
      {items
        ? [...items]
            .sort((a, b) => {
              return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
            })
            .map((item) => {
              return <Item key={item.id} item={item} type="preview" />
            })
        : repeat(3).map((i) => {
            return (
              <div
                key={i}
                className="h-16 my-3 rounded-xl bg-gray-100 animate-pulse"
              />
            )
          })}
    </div>
  )
}

export default ItemsPreviewTemplate
