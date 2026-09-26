import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading } from "@medusajs/ui"

import Item from "@modules/cart/components/item"

type ItemsTemplateProps = {
  items?: HttpTypes.StoreCartLineItem[]
}

const ItemsTemplate = ({ items }: ItemsTemplateProps) => {
  return (
    <div>
      <div className="pb-2 flex items-center">
        <Heading className="text-[24px] small:text-[32px] font-semibold leading-tight text-[#14161C]">
          Varukorg
        </Heading>
      </div>
      <div className="border-t border-gray-200">
        {items
          ? [...items]
              .sort((a, b) => {
                return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
              })
              .map((item) => {
                return <Item key={item.id} item={item} />
              })
          : repeat(3).map((i) => {
              return (
                <div
                  key={i}
                  className="h-24 my-4 rounded-xl bg-gray-100 animate-pulse"
                />
              )
            })}
      </div>
    </div>
  )
}

export default ItemsTemplate
