import { Metadata } from "next"

import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import CookieConsent from "@modules/layout/components/cookie-consent"
import { getBaseURL } from "@lib/util/env"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
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
