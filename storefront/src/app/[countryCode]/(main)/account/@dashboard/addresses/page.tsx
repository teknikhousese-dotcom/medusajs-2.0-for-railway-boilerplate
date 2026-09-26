import { Metadata } from "next"
import { notFound } from "next/navigation"

import AddressBook from "@modules/account/components/address-book"

import { headers } from "next/headers"
import { getRegion } from "@lib/data/regions"
import { getCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Adresser | Teknikhouse",
  description: "Se och hantera dina sparade adresser.",
}

export default async function Addresses({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const customer = await getCustomer()
  const region = await getRegion(countryCode)

  if (!customer || !region) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="addresses-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">Leveransadresser</h1>
        <p className="text-base-regular">
          Se och uppdatera dina leveransadresser. Du kan spara hur många du
            vill, och de sparade adresserna går sedan att välja i kassan.
        </p>
      </div>
      <AddressBook customer={customer} region={region} />
    </div>
  )
}
