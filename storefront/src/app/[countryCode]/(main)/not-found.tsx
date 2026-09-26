import { Metadata } from "next"

import NotFoundBody from "@modules/common/components/not-found-body"

export const metadata: Metadata = {
  title: "Sidan hittades inte | Teknikhouse",
  description: "Sidan du letar efter finns inte längre eller har flyttat.",
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return <NotFoundBody />
}
