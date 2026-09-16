import { redirect } from "next/navigation"
import type { Metadata } from "next"

// Nyheter is consolidated into /blogg — one strong content hub (SEO 2027).
// This page (and /news, which re-exports it) now redirects to the blog.
export const metadata: Metadata = {
  title: "Nyheter | Teknikhouse",
  robots: { index: false, follow: true },
}

export default function NyheterPage() {
  redirect("/blogg")
}
