import LocalizedClientLink from "@modules/common/components/localized-client-link"

const ROUND = '"Poppins",ui-rounded,system-ui,sans-serif'

const CATEGORIES: [string, string][] = [
  ["/mobilreservdelar", "Mobilreservdelar"],
  ["/mobiltillbehor", "Mobiltillbehör"],
  ["/batterier", "Batterier"],
  ["/kablar-laddare", "Kablar och laddare"],
  ["/verktyg", "Verktyg"],
  ["/outlet-fyndvaror", "Outlet"],
]

const EmptyCartMessage = () => {
  return (
    <div
      className="py-14 small:py-24 px-2 flex flex-col items-center text-center"
      data-testid="empty-cart-message"
    >
      <span
        aria-hidden="true"
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "68px", height: "68px", borderRadius: "50%", background: "#faf8f6", border: "1px solid #efeae5", color: "#F50000" }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h2l2.2 11a1 1 0 001 .8h9a1 1 0 001-.8L21 8H6.5" /><circle cx="9.5" cy="20" r="1.3" /><circle cx="17.5" cy="20" r="1.3" /></svg>
      </span>
      <h1 style={{ fontFamily: ROUND, fontWeight: 600, fontSize: "clamp(24px, 6.5vw, 30px)", lineHeight: 1.2, color: "#1b1714", margin: "18px 0 0" }}>
        Din varukorg är tom
      </h1>
      <p style={{ color: "#6f685f", fontSize: "15.5px", lineHeight: 1.6, maxWidth: "30rem", margin: "10px 0 0" }}>
        Här finns inget ännu. Hitta skärmar, batterier, tillbehör och verktyg till din mobil. Fri frakt över 999 kr och 30 dagars öppet köp.
      </p>
      <LocalizedClientLink
        href="/store"
        className="hover:bg-[#d80000] transition-colors"
        data-testid="continue-shopping-link"
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "48px", marginTop: "24px", padding: "0 28px", borderRadius: "12px", background: "#F50000", color: "#fff", fontWeight: 600, fontSize: "15px" }}
      >
        Fortsätt handla
      </LocalizedClientLink>
      <p style={{ fontSize: "12.5px", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "#6f685f", margin: "34px 0 10px" }}>
        Populära kategorier
      </p>
      <div className="flex flex-wrap justify-center gap-2" style={{ maxWidth: "38rem" }}>
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
  )
}

export default EmptyCartMessage
