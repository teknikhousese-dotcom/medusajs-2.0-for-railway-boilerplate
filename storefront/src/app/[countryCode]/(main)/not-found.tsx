import { Metadata } from "next"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Sidan hittades inte | Teknikhouse",
  description: "Sidan du letar efter finns inte längre eller har flyttat.",
  robots: { index: false, follow: true },
}

const LINKS: [string, string, string][] = [
  ["/store", "Alla produkter", "Reservdelar, tillbehör och begagnade mobiler"],
  ["/orderstatus", "Spåra order", "Se var ditt paket är just nu"],
  ["/return", "Retur och reklamation", "Anmäl en retur på en minut"],
  ["/contact", "Kundtjänst", "Vi svarar oftast samma dag"],
]

export default function NotFound() {
  return (
    <div className="content-container py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#D10000]">404</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900">Sidan hittades inte</h1>
        <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed">
          Sidan finns inte längre eller har fått en ny adress. Prova att söka efter det du letar efter, eller ta en genväg nedan.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <LocalizedClientLink href="/" className="rounded-xl bg-[#D10000] px-6 py-3 text-sm font-semibold text-white hover:bg-[#b00000] transition">
            Till startsidan
          </LocalizedClientLink>
          <LocalizedClientLink href="/search" className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900 hover:border-gray-900 transition">
            Sök i butiken
          </LocalizedClientLink>
        </div>
      </div>
      <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2">
        {LINKS.map(([href, title, desc]) => (
          <LocalizedClientLink key={href} href={href} className="group rounded-2xl border border-gray-200 p-5 hover:border-[#D10000] transition">
            <span className="block font-semibold text-gray-900 group-hover:text-[#D10000]">{title}</span>
            <span className="mt-1 block text-sm text-gray-600">{desc}</span>
          </LocalizedClientLink>
        ))}
      </div>
    </div>
  )
}
