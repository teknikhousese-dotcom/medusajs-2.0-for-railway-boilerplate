import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"

const Icon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
)

const Page = () => {
  useEffect(() => { window.location.replace("/app/kontrollpanel?s=blogg") }, [])
  return null
}

export const config = defineRouteConfig({ label: "📝 Blogg", icon: Icon })
export default Page
