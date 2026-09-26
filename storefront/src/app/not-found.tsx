import { Metadata } from "next"

import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import NotFoundBody from "@modules/common/components/not-found-body"

export const metadata: Metadata = {
  title: "Sidan hittades inte | Teknikhouse",
  description: "Sidan du letar efter finns inte längre eller har flyttat.",
  robots: { index: false, follow: true },
}

/* Okända adresser hamnar här (utanför (main)-layouten), så sidhuvud och
   sidfot läggs till här för att 404-sidan ska se ut som resten av butiken. */
export default function NotFound() {
  return (
    <>
      <Nav />
      <NotFoundBody />
      <Footer />
    </>
  )
}
