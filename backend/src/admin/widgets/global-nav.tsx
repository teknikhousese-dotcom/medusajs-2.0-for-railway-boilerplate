import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"
import { installGlobalMenu } from "../lib/butikadmin"

/**
 * Global-nav widget. Native Medusa pages (Categories, Promotions, Products,
 * Price Lists, Inventory, Customers) don't render our route shell, so they used
 * to fall back to Medusa's own English sidebar — the "second menu". This widget
 * mounts on those native list pages and installs the shared global-menu
 * controller, which paints the Swedish Snabbmeny over them and hides Medusa's
 * sidebar. Renders nothing itself.
 */
const GlobalNav = () => {
  useEffect(() => { installGlobalMenu() }, [])
  return null
}

export const config = defineWidgetConfig({
  zone: [
    "order.list.before",
    "product.list.before",
    "product_category.list.before",
    "customer.list.before",
    "customer_group.list.before",
    "promotion.list.before",
    "price_list.list.before",
    "inventory_item.list.before",
  ],
})

export default GlobalNav
