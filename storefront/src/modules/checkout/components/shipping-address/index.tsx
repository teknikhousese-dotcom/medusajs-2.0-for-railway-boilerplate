"use client"

import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useState } from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
  isCompany = false,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
  isCompany?: boolean
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [orgNr, setOrgNr] = useState<string>(
    String((cart?.metadata as Record<string, any> | null)?.org_nr || "")
  )

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c) => c.iso_2),
    [cart?.region]
  )

  // check if customer has saved addresses that are in the current region
  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.addresses, countriesInRegion]
  )

  const setFormAddress = (
    address?: HttpTypes.StoreCartAddress,
    email?: string
  ) => {
    address &&
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        "shipping_address.first_name": address?.first_name || "",
        "shipping_address.last_name": address?.last_name || "",
        "shipping_address.address_1": address?.address_1 || "",
        "shipping_address.company": address?.company || "",
        "shipping_address.postal_code": address?.postal_code || "",
        "shipping_address.city": address?.city || "",
        "shipping_address.country_code": address?.country_code || "",
        "shipping_address.province": address?.province || "",
        "shipping_address.phone": address?.phone || "",
      }))

    email &&
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        email: email,
      }))
  }

  useEffect(() => {
    // Ensure cart is not null and has a shipping_address before setting form data
    if (cart && cart.shipping_address) {
      setFormAddress(cart?.shipping_address, cart?.email)
    }

    if (cart && !cart.email && customer?.email) {
      setFormAddress(undefined, customer.email)
    }
  }, [cart]) // Add cart as a dependency

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Container className="mb-6 flex flex-col gap-y-4 p-5">
          <p className="text-small-regular">
            {"Hej " + customer.first_name + ", vill du använda en sparad adress?"}
          </p>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={
              mapKeys(formData, (_, key) =>
                key.replace("shipping_address.", "")
              ) as HttpTypes.StoreCartAddress
            }
            onSelect={setFormAddress}
          />
        </Container>
      )}
      {isCompany ? (
        <div className="grid grid-cols-1 small:grid-cols-2 gap-3 small:gap-4 mb-3 small:mb-4">
          <Input
            label="Företagsnamn"
            name="shipping_address.company"
            value={formData["shipping_address.company"]}
            onChange={handleChange}
            autoComplete="organization"
            required
            data-testid="shipping-company-input"
          />
          <Input
            label="Organisationsnummer"
            name="org_nr"
            value={orgNr}
            onChange={(e) => setOrgNr(e.target.value)}
            inputMode="numeric"
            pattern="[0-9]{6}-?[0-9]{4}"
            title="Skriv organisationsnumret som 556677-8899."
            required
            data-testid="shipping-org-nr-input"
          />
        </div>
      ) : (
        <input type="hidden" name="shipping_address.company" value="" />
      )}
      <div className="grid grid-cols-2 gap-3 small:gap-4">
        <Input
          label="Förnamn"
          name="shipping_address.first_name"
          autoComplete="given-name"
          value={formData["shipping_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-first-name-input"
        />
        <Input
          label="Efternamn"
          name="shipping_address.last_name"
          autoComplete="family-name"
          value={formData["shipping_address.last_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-last-name-input"
        />
        <div className="col-span-2 small:col-span-1">
          <Input
            label="Gatuadress"
            name="shipping_address.address_1"
            autoComplete="address-line1"
            value={formData["shipping_address.address_1"]}
            onChange={handleChange}
            required
            data-testid="shipping-address-input"
          />
        </div>
        <Input
          label="Postnummer"
          name="shipping_address.postal_code"
          autoComplete="postal-code"
          inputMode="numeric"
          value={formData["shipping_address.postal_code"]}
          onChange={handleChange}
          required
          data-testid="shipping-postal-code-input"
        />
        <Input
          label="Ort"
          name="shipping_address.city"
          autoComplete="address-level2"
          value={formData["shipping_address.city"]}
          onChange={handleChange}
          required
          data-testid="shipping-city-input"
        />
        <div className="col-span-2 small:col-span-1">
          <CountrySelect
            name="shipping_address.country_code"
            autoComplete="country"
            region={cart?.region}
            value={formData["shipping_address.country_code"]}
            onChange={handleChange}
            required
            data-testid="shipping-country-select"
          />
        </div>
        {/* Optional, matching Medusa's address type. Most of Europe has no
            state or province, so it is not required. */}
        <div className="col-span-2 small:col-span-1">
          <Input
            label="Län (valfritt)"
            name="shipping_address.province"
            autoComplete="address-level1"
            value={formData["shipping_address.province"]}
            onChange={handleChange}
            data-testid="shipping-province-input"
          />
        </div>
      </div>
      <div className="my-6 small:my-8">
        <Checkbox
          label="Fakturaadress samma som leveransadress"
          name="same_as_billing"
          checked={checked}
          onChange={onChange}
          data-testid="billing-address-checkbox"
        />
      </div>
      <div className="grid grid-cols-1 small:grid-cols-2 gap-3 small:gap-4 mb-4">
        <Input
          label="E-post"
          name="email"
          type="email"
          title="Ange en giltig e-postadress."
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          required
          data-testid="shipping-email-input"
        />
        <Input
          label="Mobilnummer"
          name="shipping_address.phone"
          autoComplete="tel"
          type="tel"
          value={formData["shipping_address.phone"]}
          onChange={handleChange}
          data-testid="shipping-phone-input"
        />
      </div>
    </>
  )
}

export default ShippingAddress
