import React from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div className="flex-1 lg:py-12" data-testid="account-page">
      <div className="flex-1 content-container h-full max-w-5xl mx-auto bg-white flex flex-col">
        <div className={customer ? "grid grid-cols-1 small:grid-cols-[240px_1fr] py-8 sm:py-12" : "py-8 sm:py-12"}>
          {customer && <div><AccountNav customer={customer} /></div>}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
        <div className="flex flex-col small:flex-row small:items-end justify-between border-t border-gray-200 py-8 sm:py-12 gap-6">
          <div>
            <h3 className="text-xl-semi mb-4">Frågor?</h3>
            <span className="txt-medium text-ui-fg-subtle">
              Undrar du var paketet är? <LocalizedClientLink href="/orderstatus" className="text-[#D10000] underline">Spåra din order</LocalizedClientLink>. Annars hittar du svar och kontaktuppgifter hos kundtjänst.
            </span>
          </div>
          <div>
            <LocalizedClientLink
              href="/contact"
              className="hover:border-[#F50000] hover:text-[#F50000] transition-colors"
              style={{ display: "inline-flex", alignItems: "center", minHeight: "44px", padding: "0 18px", border: "1px solid #d9d2ca", borderRadius: "12px", fontWeight: 600, fontSize: "14.5px", color: "#1b1714" }}
            >
              Kontakta kundtjänst
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
