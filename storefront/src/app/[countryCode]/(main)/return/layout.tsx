import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Retur och reklamation | Teknikhouse",
  description:
    "Anmäl retur eller reklamation hos Teknikhouse. Ange ordernummer och e-post, välj varor och anledning så mejlar vi returinstruktioner. 30 dagars öppet köp.",
  alternates: { canonical: "https://www.teknikhouse.se/return" },
}

export default function ReturnLayout({ children }: { children: React.ReactNode }) {
  return children
}
