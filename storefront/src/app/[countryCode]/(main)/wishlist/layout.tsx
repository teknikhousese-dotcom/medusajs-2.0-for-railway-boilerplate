import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Önskelista | Teknikhouse",
  description:
    "Dina sparade favoriter hos Teknikhouse. Spara produkter med hjärtat och hitta dem enkelt igen när du vill handla.",
  robots: { index: false, follow: true },
}

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children
}
