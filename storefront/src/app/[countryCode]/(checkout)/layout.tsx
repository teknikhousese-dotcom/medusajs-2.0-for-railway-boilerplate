import type { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import Footer from "@modules/layout/templates/footer"

export const metadata: Metadata = {
  title: "Kassa | Teknikhouse",
  robots: { index: false, follow: false },
}

const TRUST = [
  { b: "Fri frakt", t: "över 999 kr" },
  { b: "Verifierad butik", t: "hos Trustindex" },
  { b: "30 dagars", t: "öppet köp" },
  { b: "Snabb leverans", t: "skickas inom 1-2 dagar" },
]

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-white relative small:min-h-screen">
      <div className="h-16 bg-white border-b sticky top-0 z-40">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="text-small-semi text-ui-fg-base flex items-center gap-x-2 uppercase flex-1 basis-0"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden small:block txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base ">
              Tillbaka till varukorgen
            </span>
            <span className="mt-px block small:hidden txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base">
              Tillbaka
            </span>
          </LocalizedClientLink>
          <style
            dangerouslySetInnerHTML={{
              __html:
                "@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@800&display=swap');",
            }}
          />
          <LocalizedClientLink
            href="/"
            className="hover:opacity-80"
            data-testid="store-link"
            style={{
              fontFamily: "'Baloo 2', ui-rounded, system-ui, sans-serif",
              fontWeight: 800,
              fontSize: "24px",
              letterSpacing: "-0.02em",
              color: "#F50000",
            }}
          >
            teknikhouse.se
          </LocalizedClientLink>
          <div className="flex-1 basis-0 hidden small:flex justify-end">
            <span className="text-[12px] text-ui-fg-muted">
              Frågor? info@teknikhouse.se
            </span>
          </div>
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">
        {children}
      </div>
      <div className="border-t border-b bg-gray-50">
        <div className="content-container py-5 grid grid-cols-2 small:grid-cols-4 gap-x-4 gap-y-3 text-center">
          {TRUST.map((x) => (
            <div key={x.b} className="text-[13px] text-gray-600">
              <div className="font-semibold text-[#14161C]">{x.b}</div>
              <div>{x.t}</div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}
