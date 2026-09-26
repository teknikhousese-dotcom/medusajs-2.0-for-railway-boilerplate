import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { listCategories } from "@lib/data/categories"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import CategoryMega from "@modules/layout/components/category-mega"
import { isSearchEnabled } from "@lib/util/env"

/* Teknikhouse nav: USP bar, red logo, menu/search/account/cart. */
export default async function Nav() {
  const regions = await listRegions().then((regions: StoreRegion[]) => regions)
  const categories = await listCategories().catch(() => [])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      {/* USP bar, one centered line. Third point hidden on narrow screens so it never wraps. */}
      <div style={{ background: "#0B0C10", color: "#C9CFDA", fontSize: "12px" }}>
        <div className="content-container flex items-center justify-center h-[34px] whitespace-nowrap overflow-hidden text-center">
          <span>Fri frakt över <b style={{ color: "#fff" }}>999 kr</b> · Öppet köp i 30 dagar<span className="hidden xsmall:inline"> · Snabb leverans med PostNord</span></span>
        </div>
      </div>

      <header className="relative h-16 mx-auto border-b duration-200 bg-white border-ui-border-base">
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-full text-small-regular">
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="h-full">
              <SideMenu regions={regions} categories={categories} />
            </div>
          </div>

          <div className="flex items-center h-full">
            <style dangerouslySetInnerHTML={{ __html: "@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@800&display=swap');" }} />
            <LocalizedClientLink
              href="/"
              className="hover:opacity-80 flex items-center h-11 whitespace-nowrap text-[22px] xsmall:text-[25px] leading-none"
              data-testid="nav-store-link"
              style={{ fontFamily: "'Baloo 2', ui-rounded, system-ui, sans-serif", fontWeight: 800, letterSpacing: "-0.02em", color: "#F50000" }}
            >
              teknikhouse.se
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-1 small:gap-x-3 h-full flex-1 basis-0 justify-end">
            {isSearchEnabled() && (
              <LocalizedClientLink
                className="flex items-center justify-center gap-2 h-11 min-w-[44px] px-1 small:px-2 leading-none hover:text-[#F50000]"
                href="/search"
                scroll={false}
                data-testid="nav-search-link"
                aria-label="Sök"
              >
                <svg className="shrink-0 block" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.6-3.6" /></svg>
                <span className="hidden small:inline">Sök</span>
              </LocalizedClientLink>
            )}
            <LocalizedClientLink
              className="hidden small:flex items-center justify-center gap-2 h-11 min-w-[44px] px-2 leading-none hover:text-[#F50000]"
              href="/account"
              data-testid="nav-account-link"
              aria-label="Konto"
            >
              <svg className="shrink-0 block" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4.2 4-6.5 8-6.5s8 2.3 8 6.5" /></svg>
              <span>Konto</span>
            </LocalizedClientLink>
            <Suspense
              fallback={
                <div className="h-full flex items-center">
                  <LocalizedClientLink
                    className="flex items-center justify-center gap-2 h-11 min-w-[44px] px-1 small:px-2 leading-none hover:text-[#F50000]"
                    href="/cart"
                    data-testid="nav-cart-link"
                    aria-label="Varukorg"
                  >
                    <span className="relative inline-flex shrink-0">
                      <svg className="block" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 4h2l2.2 11a1 1 0 001 .8h9a1 1 0 001-.8L21 8H6.5" /><circle cx="9.5" cy="20" r="1.3" /><circle cx="17.5" cy="20" r="1.3" /></svg>
                    </span>
                    <span className="hidden small:inline">Varukorg</span>
                  </LocalizedClientLink>
                </div>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>

      {/* Category department bar with mega-menu (desktop) */}
      <CategoryMega categories={categories as any} />
    </div>
  )
}
