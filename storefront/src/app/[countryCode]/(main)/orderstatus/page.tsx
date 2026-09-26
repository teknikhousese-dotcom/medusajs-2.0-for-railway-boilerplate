import { Metadata } from "next"
import OrderTracker from "./tracker"

export const metadata: Metadata = {
  title: "Spåra order | Teknikhouse",
  description: "Se var din beställning är. Ange ordernummer och e-post så visar vi status, innehåll och spårningslänk till paketet.",
  alternates: { canonical: "https://www.teknikhouse.se/orderstatus" },
  robots: { index: true, follow: true },
}

export default function OrderStatusPage() {
  return <OrderTracker />
}
