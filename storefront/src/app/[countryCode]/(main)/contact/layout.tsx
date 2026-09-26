import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kontakta oss | Teknikhouse",
  description:
    "Kontakta Teknikhouse kundtjänst om beställningar, leveranser, retur och reklamation. Vi svarar via e-post på vardagar och hjälper dig gärna före och efter köpet.",
  alternates: { canonical: "https://www.teknikhouse.se/contact" },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
