"use client"

import React, { useActionState } from "react"

import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"
import { requestPasswordReset } from "@lib/data/customer"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

/**
 * Changing a password goes through email, because Medusa allows nothing else.
 *
 * This is not a limitation of the storefront. `POST /auth/:actor/:provider/update`
 * is guarded by `validateToken()`, which rejects any token whose `purpose` claim
 * is not `"reset"` and which has no `jti`. A signed-in customer's session bearer
 * token has neither, so there is no request a logged-in shopper can make that
 * sets their own password directly. The reset token is single use and the
 * middleware consumes it atomically before the update runs.
 *
 * So the button here asks for a reset link rather than opening old/new/confirm
 * inputs. Before this, the section rendered exactly those inputs wired to
 * `useActionState((() => {}) as any, ...)`, an action that did nothing while
 * reporting success.
 *
 * The form posts the customer's own address from the session rather than
 * letting them type one, since this is the account they are already signed in
 * to.
 */
const ProfilePassword: React.FC<MyInformationProps> = ({ customer }) => {
  const [state, formAction] = useActionState(requestPasswordReset, {
    success: false,
    error: null,
  })

  return (
    <div className="w-full">
      <AccountInfo
        label="Lösenord"
        currentInfo={
          <span>Lösenordet visas inte av säkerhetsskäl</span>
        }
        isEditable={false}
        clearState={() => {}}
        data-testid="account-password-editor"
      />

      <div className="text-small-regular text-ui-fg-subtle pb-8 -mt-4">
        {state.success ? (
          <span data-testid="password-reset-requested">
            En länk för att välja nytt lösenord är på väg till {customer.email}.
            Den fungerar en gång och gäller i 15 minuter.
          </span>
        ) : (
          <form action={formAction} className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <input type="hidden" name="email" value={customer.email ?? ""} />
            <span>Vill du byta lösenord mejlar vi dig en länk.</span>
            <button
              type="submit"
              className="underline"
              data-testid="request-password-reset-button"
            >
              Skicka länken
            </button>
            {state.error && (
              <span
                className="text-rose-500"
                data-testid="password-reset-error"
              >
                {state.error}
              </span>
            )}
          </form>
        )}
      </div>
    </div>
  )
}

export default ProfilePassword
