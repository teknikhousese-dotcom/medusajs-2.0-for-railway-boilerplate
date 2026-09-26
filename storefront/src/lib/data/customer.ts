"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { redirect } from "next/navigation"
import { cache } from "react"
import {
  getAuthHeaders,
  getCacheDirectives,
  removeAuthToken,
  revalidateCacheTag,
  setAuthToken,
} from "./cookies"

// See the note in regions.ts for why this is a client.fetch call rather than
// the sdk.store.* helper. This one is worth spelling out: the old call put the
// cache tag and the authorization header in the same object, so the auth half
// worked and the caching half silently did nothing.
export const getCustomer = cache(async function () {
  return await sdk.client
    .fetch<HttpTypes.StoreCustomerResponse>("/store/customers/me", {
      method: "GET",
      headers: { ...(await getAuthHeaders()) },
      ...(await getCacheDirectives("customers")),
    })
    .then(({ customer }) => customer)
    .catch(() => null)
})

export const updateCustomer = cache(async function (
  body: HttpTypes.StoreUpdateCustomer
) {
  const updateRes = await sdk.store.customer
    .update(body, {}, await getAuthHeaders())
    .then(({ customer }) => customer)
    .catch(medusaError)

  await revalidateCacheTag("customers")
  return updateRes
})

export async function signup(_currentState: unknown, formData: FormData) {
  const password = formData.get("password") as string
  const customerForm = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: formData.get("phone") as string,
  }

  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password: password,
    })

    const customHeaders = { authorization: `Bearer ${token}` }
    
    const { customer: createdCustomer } = await sdk.store.customer.create(
      customerForm,
      {},
      customHeaders
    )

    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email: customerForm.email,
      password,
    })

    if (typeof loginToken !== "string") {
      // emailpass always returns a token string. The other shapes in the union
      // are OAuth redirect, MFA challenge and pending email verification, none
      // of which this storefront implements.
      return "Kontot är skapat, men vi kunde inte logga in dig automatiskt. Logga in med dina nya uppgifter."
    }

    await setAuthToken(loginToken)

    await revalidateCacheTag("customers")
    return createdCustomer
  } catch (error: any) {
    const message = String(error?.message || error || "")
    if (/exist/i.test(message)) {
      return "Det finns redan ett konto med den e-postadressen. Logga in i stället."
    }
    return "Vi kunde inte skapa kontot. Kontrollera uppgifterna och försök igen."
  }
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    const token = await sdk.auth.login("customer", "emailpass", {
      email,
      password,
    })

    if (typeof token !== "string") {
      // See the note in signup: only the string form is supported here.
      return "Det här kontot kräver ett inloggningssteg som inte stöds här. Kontakta oss så hjälper vi dig."
    }

    await setAuthToken(token)
    await revalidateCacheTag("customers")
  } catch (error: any) {
    const message = String(error?.message || error || "")
    if (/invalid|unauthori|password|credential/i.test(message)) {
      return "Fel e-postadress eller lösenord. Försök igen."
    }
    return "Vi kunde inte logga in dig just nu. Försök igen om en stund."
  }
}

/**
 * Asks Medusa to mail a reset link.
 *
 * Always reports success, including for an address with no account. That is
 * not a shortcut: the backend route answers 201 either way on purpose, so the
 * form cannot be used to work out which email addresses have accounts here. It
 * is also why the copy says "if an account exists" rather than "check your
 * inbox". The email itself is sent by backend/src/subscribers/password-reset.ts.
 */
export async function requestPasswordReset(
  _currentState: unknown,
  formData: FormData
): Promise<{ success: boolean; error: string | null }> {
  const email = (formData.get("email") as string)?.trim()

  if (!email) {
    return { success: false, error: "Ange e-postadressen som hör till ditt konto." }
  }

  try {
    await sdk.auth.resetPassword("customer", "emailpass", { identifier: email })
    return { success: true, error: null }
  } catch (error: any) {
    // A failure here is the request never reaching Medusa, not a rejected
    // address, so it is worth surfacing rather than swallowing.
    return {
      success: false,
      error: "Vi kunde inte skicka länken just nu. Försök igen om en stund.",
    }
  }
}

/**
 * Sets a new password from a reset token.
 *
 * The token identifies the account. `POST /auth/{actor}/{provider}/update`
 * takes the identity from the validated token and ignores any identifier in
 * the body, so nothing here decides whose password changes. The email shown on
 * the form is display only.
 */
export async function resetPassword(
  _currentState: unknown,
  formData: FormData
): Promise<{ success: boolean; error: string | null }> {
  const token = formData.get("token") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirm_password") as string

  if (!token) {
    return {
      success: false,
      error: "Återställningslänken är ofullständig. Begär en ny länk nedan.",
    }
  }

  if (!password || password.length < 8) {
    return { success: false, error: "Välj ett lösenord med minst 8 tecken." }
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Lösenorden stämmer inte överens." }
  }

  try {
    await sdk.auth.updateProvider(
      "customer",
      "emailpass",
      { password },
      token
    )
    return { success: true, error: null }
  } catch (error: any) {
    // The token is single use and expires after 15 minutes, and both cases come
    // back as a 401 with no detail worth showing raw.
    return {
      success: false,
      error:
        "Länken gäller inte längre. Den kan bara användas en gång och slutar gälla efter 15 minuter. Begär en ny länk nedan.",
    }
  }
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()
  await removeAuthToken()
  await revalidateCacheTag("auth")
  await revalidateCacheTag("customers")
  redirect(`/${countryCode}/account`)
}

export const addCustomerAddress = async (
  _currentState: unknown,
  formData: FormData
): Promise<any> => {
  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
  }

  return sdk.store.customer
    .createAddress(address, {}, await getAuthHeaders())
    .then(async () => {
      await revalidateCacheTag("customers")
      return { success: true, error: null }
    })
    .catch((err) => {
      return {
        success: false,
        error: "Vi kunde inte spara adressen. Kontrollera uppgifterna och försök igen.",
      }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  await sdk.store.customer
    .deleteAddress(addressId, await getAuthHeaders())
    .then(async () => {
      await revalidateCacheTag("customers")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId = currentState.addressId as string

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, await getAuthHeaders())
    .then(async () => {
      await revalidateCacheTag("customers")
      return { success: true, error: null }
    })
    .catch((err) => {
      return {
        success: false,
        error: "Vi kunde inte spara adressen. Kontrollera uppgifterna och försök igen.",
      }
    })
}
