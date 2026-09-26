"use client"

import { useActionState } from "react"

import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { requestPasswordReset } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const ForgotPassword = ({ setCurrentView }: Props) => {
  const [state, formAction] = useActionState(requestPasswordReset, {
    success: false,
    error: null,
  })

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="forgot-password-page"
    >
      <h1 className="text-large-semi uppercase mb-6 text-center">Glömt lösenordet?</h1>

      {state.success ? (
        <>
          {/*
            Deliberately does not confirm that an account exists. The backend
            answers the same way for an unknown address so the form cannot be
            used to find out who has an account here, and saying "check your
            inbox" would undo that on the very next line.
          */}
          <p
            className="text-center text-base-regular text-ui-fg-base mb-8"
            data-testid="forgot-password-sent"
          >
            Finns det ett konto med den adressen är en länk för att välja nytt
            lösenord på väg till din inkorg. Länken fungerar en gång och gäller i
            15 minuter.
          </p>
          <button
            onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
            className="underline text-small-regular"
            data-testid="back-to-sign-in-button"
          >
            Tillbaka till inloggningen
          </button>
        </>
      ) : (
        <>
          <p className="text-center text-base-regular text-ui-fg-base mb-8">
            Skriv e-postadressen du har på ditt konto, så mejlar vi en länk där
            du väljer ett nytt lösenord.
          </p>
          <form className="w-full" action={formAction}>
            <Input
              label="E-post"
              name="email"
              type="email"
              title="Ange en giltig e-postadress."
              autoComplete="email"
              required
              data-testid="forgot-password-email-input"
            />
            <ErrorMessage
              error={state.error}
              data-testid="forgot-password-error-message"
            />
            <SubmitButton
              data-testid="send-reset-link-button"
              className="w-full mt-6"
            >
              Skicka länk
            </SubmitButton>
          </form>
          <span className="text-center text-ui-fg-base text-small-regular mt-6">
            Kom du på det?{" "}
            <button
              onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
              className="underline"
              data-testid="back-to-sign-in-button"
            >
              Logga in
            </button>
            .
          </span>
        </>
      )}
    </div>
  )
}

export default ForgotPassword
