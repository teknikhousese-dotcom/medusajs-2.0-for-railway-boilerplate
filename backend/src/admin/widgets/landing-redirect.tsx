import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"

/**
 * Teknikhouse.se — landing redirect.
 * On the first page load of a session (Medusa lands on the Orders list),
 * send the user to the Swedish Kontrollpanel instead. Uses a sessionStorage
 * flag so it only redirects once — visiting Orders later is not blocked.
 */
const LandingRedirect = () => {
  useEffect(() => {
    try {
      if (!sessionStorage.getItem("th_home_redirect")) {
        sessionStorage.setItem("th_home_redirect", "1")
        if (window.location.pathname !== "/app/kontrollpanel") {
          window.location.replace("/app/kontrollpanel")
        }
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
