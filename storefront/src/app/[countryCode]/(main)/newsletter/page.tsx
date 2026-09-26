import { Metadata } from "next"

import NewsletterSignup from "@modules/home/components/th-home/newsletter-signup"

export const metadata: Metadata = {
  title: "Nyhetsbrev | Teknikhouse",
  description: "Få veta först när nya delar kommer in, när vi kör kampanj och när vi delar nya reparationstips. Du kan avsluta när du vill.",
}

export default function NewsletterPage() {
  return (
    <div className="content-container py-10 small:py-16">
      <div className="max-w-4xl mx-auto">
        <NewsletterSignup headingLevel={1} />
      </div>
    </div>
  )
}
