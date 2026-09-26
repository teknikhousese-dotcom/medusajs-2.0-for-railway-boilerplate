import InteractiveLink from "@modules/common/components/interactive-link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sidan hittades inte | Teknikhouse",
  description: "Sidan du letar efter finns inte längre eller har flyttat.",
  robots: { index: false, follow: true },
}

export default async function NotFound() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl-semi text-ui-fg-base">Sidan hittades inte</h1>
      <p className="text-small-regular text-ui-fg-base">
        Sidan du försökte nå finns inte.
      </p>
      <InteractiveLink href="/">Till startsidan</InteractiveLink>
    </div>
  )
}
