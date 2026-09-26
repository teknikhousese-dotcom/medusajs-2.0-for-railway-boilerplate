import { Metadata } from "next"

import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import CookieConsent from "@modules/layout/components/cookie-consent"
import { SITE_URL } from "@lib/seo"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      {props.children}
      <Footer />
      <CookieConsent />
    </>
  )
}
