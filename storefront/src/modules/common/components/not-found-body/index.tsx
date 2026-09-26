import LocalizedClientLink from "@modules/common/components/localized-client-link"

/* Innehållet på 404-sidan. Används både av app/not-found.tsx (okända adresser)
   och av (main)/not-found.tsx (notFound() från en sida). */

const ROUND = '"Poppins",ui-rounded,system-ui,sans-serif'

const CATEGORIES: [string, string][] = [
  ["/mobilreservdelar", "Mobilreservdelar"],
  ["/mobiltillbehor", "Mobiltillbehör"],
  ["/batterier", "Batterier"],
  ["/kablar-laddare", "Kablar och laddare"],
  ["/verktyg", "Verktyg"],
  ["/mobiler-surfplattor", "Mobiler och surfplattor"],
  ["/outlet-fyndvaror", "Outlet"],
]

const LINKS: [string, string, string][] = [
  ["/store", "Alla produkter", "Reservdelar, tillbehör och begagnade mobiler"],
  ["/orderstatus", "Spåra order", "Se var ditt paket är just nu"],
  ["/return", "Retur och reklamation", "Anmäl en retur på en minut"],
  ["/contact", "Kundtjänst", "Vi svarar oftast samma dag"],
]

export default function NotFoundBody() {
  return (
    <div className="content-container py-12 small:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p style={{ fontSize: "13px", fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "#F50000", margin: 0 }}>
          404
        </p>
        <h1 style={{ fontFamily: ROUND, fontWeight: 600, fontSize: "clamp(26px, 7vw, 36px)", lineHeight: 1.2, color: "#1b1714", margin: "10px 0 0" }}>
          Sidan hittades inte
        </h1>
        <p style={{ color: "#6f685f", fontSize: "16px", lineHeight: 1.6, margin: "14px auto 0", maxWidth: "34rem" }}>
          Sidan finns inte längre eller har fått en ny adress. Sök efter det du letar efter, eller ta en genväg nedan.
        </p>

        <form action="/search" method="get" role="search" className="mt-7 flex gap-2 mx-auto" style={{ maxWidth: "30rem" }}>
          <label htmlFor="th404q" className="sr-only">Sök i butiken</label>
          <input
            id="th404q"
            name="q"
            type="search"
            placeholder="Sök modell eller reservdel, t.ex. iPhone 13 skärm"
            autoComplete="off"
            className="flex-1 min-w-0 focus:outline-none focus:border-[#1b1714]"
            style={{ height: "48px", border: "1px solid #d9d2ca", borderRadius: "12px", padding: "0 14px", fontSize: "15px", color: "#1b1714", background: "#fff" }}
          />
          <button
            type="submit"
            className="hover:bg-[#d80000] transition-colors"
            style={{ height: "48px", padding: "0 20px", borderRadius: "12px", background: "#F50000", color: "#fff", fontWeight: 600, fontSize: "15px", border: 0, cursor: "pointer" }}
          >
            Sök
          </button>
        </form>

        <p style={{ fontSize: "12.5px", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "#6f685f", margin: "30px 0 10px" }}>
          Populära kategorier
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map(([href, label]) => (
            <LocalizedClientLink
              key={href}
              href={href}
              className="hover:border-[#F50000] hover:text-[#F50000] transition-colors"
              style={{ display: "inline-flex", alignItems: "center", minHeight: "40px", padding: "0 14px", border: "1px solid #efeae5", borderRadius: "999px", background: "#faf8f6", fontSize: "14px", fontWeight: 500, color: "#1b1714" }}
            >
              {label}
            </LocalizedClientLink>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-3 small:grid-cols-2">
        {LINKS.map(([href, title, desc]) => (
          <LocalizedClientLink
            key={href}
            href={href}
            className="group transition-colors hover:border-[#F50000]"
            style={{ display: "block", border: "1px solid #efeae5", borderRadius: "14px", padding: "18px 20px", background: "#fff" }}
          >
            <span className="block group-hover:text-[#F50000]" style={{ fontFamily: ROUND, fontWeight: 600, fontSize: "15.5px", color: "#1b1714" }}>{title}</span>
            <span className="block" style={{ marginTop: "4px", fontSize: "14px", color: "#6f685f" }}>{desc}</span>
          </LocalizedClientLink>
        ))}
      </div>

      <p className="text-center" style={{ marginTop: "28px", fontSize: "14px", color: "#6f685f" }}>
        <LocalizedClientLink href="/" style={{ color: "#1b1714", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "3px" }}>
          Till startsidan
        </LocalizedClientLink>
      </p>
    </div>
  )
}
