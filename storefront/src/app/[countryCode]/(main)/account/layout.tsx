import type { Metadata } from "next"
import { getCustomer } from "@lib/data/customer"
import AccountLayout from "@modules/account/templates/account-layout"

export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default async function AccountPageLayout({
  dashboard,
  login,
}: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
}) {
  const customer = await getCustomer().catch(() => null)

  return (
    <AccountLayout customer={customer}>
      {customer ? dashboard : login}
    </AccountLayout>
  )
}
