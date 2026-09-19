import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"

/**
 * Teknikhouse.se — landing redirect.
 * Medusa drops you on the native Orders list (/app/orders) after login. We
 * mirror orders at /app/ordrar and want the Swedish Kontrollpanel as the home
 * screen, so ANY visit to the native Orders list bounces straight to
 * /app/kontrollpanel — no flags, no timing, every time. Our own "Visa ordrar"
 * menu item points at /app/ordrar, so this never loops, and the rest of
 * Medusa's native menu keeps working.
 */
const LandingRedirect = () => {
  useEffect(() => {
    try {
      if (window.location.pathname === "/app/orders") {
        window.location.replace("/app/kontrollpanel")
      }
    } catch (e) {
      // ignore
    }
  }, [])
  return null
}

export const config = defineWidgetConfig({
  zone: "order.list.before",
})

export default LandingRedirect
