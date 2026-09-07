import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import { isSearchEnabled } from "@lib/util/env"

// Teknikhouse nav — own-branded. Slim trust bar + red logo. Functional cart/search/menu kept.
export default async function Nav() {
  const regions = await listRegions().then((regions: StoreRegion[]) => regions)

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      {/* Trust / utility bar */}
      <div style={{ background: "#0B0C10", color: "#C9CFDA", fontSize: "12px" }}>
        <div className="content-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "34px" }}>
          <span>Kundtjänst: <b style={{ color: "#fff" }}>info@teknikhouse.se</b></span>
          <span>Fri frakt över <b style={{ color: "#fff" }}>199 kr</b> · Öppet köp 30 dagar · Trustpilot <b style={{ color: "#00b67a" }}>★ 4,9</b></span>
        </div>
      </div>

      <header className="relative h-16 mx-auto border-b duration-200 bg-white border-ui-border-base">
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-full text-small-regular">
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="h-full">
              <SideMenu regions={regions} />
            </div>
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="hover:opacity-80"
              data-testid="nav-store-link"
              style={{ fontWeight: 900, fontSize: "22px", letterSpacing: "-0.04em", color: "#14161C" }}
            >
              teknik<span style={{ color: "#F50000" }}>house</span>
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              {isSearchEnabled() && (
                <LocalizedClientLink
                  className="hover:text-ui-fg-base"
                  href="/search"
                  scroll={false}
                  data-testid="nav-search-link"
                >
                  Sök
                </LocalizedClientLink>
              )}
              <LocalizedClientLink
                className="hover:text-ui-fg-base"
                href="/account"
                data-testid="nav-account-link"
              >
                Konto
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Varukorg (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
