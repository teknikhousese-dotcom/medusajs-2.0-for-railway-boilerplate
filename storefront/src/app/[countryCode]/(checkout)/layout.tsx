import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-white relative small:min-h-screen">
      <div className="h-16 bg-white border-b ">
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
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">
        {children}
      </div>
      <div className="py-4 w-full flex items-center justify-center">
        <span className="text-ui-fg-muted txt-compact-small">
          Trygg e-handel · Nordic Teknik House AB
        </span>
      </div>
    </div>
  )
}
