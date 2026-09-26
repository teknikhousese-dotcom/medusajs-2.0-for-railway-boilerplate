"use client"

import { useActionState } from "react"

import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { login } from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const ROUND = '"Poppins",ui-rounded,system-ui,sans-serif'

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)

  return (
    <div
      className="w-full max-w-[440px] flex flex-col"
      data-testid="login-page"
      style={{ background: "#fff", border: "1px solid #efeae5", borderRadius: "18px", padding: "28px 22px", boxShadow: "0 1px 2px rgba(27,23,20,.04), 0 8px 24px rgba(27,23,20,.05)" }}
    >
      <h1 style={{ fontFamily: ROUND, fontWeight: 600, fontSize: "26px", lineHeight: 1.2, color: "#1b1714", margin: 0 }}>
        Logga in
      </h1>
      <p style={{ color: "#6f685f", fontSize: "15px", lineHeight: 1.55, margin: "8px 0 22px" }}>
        Välkommen tillbaka. Logga in för att se dina ordrar och handla snabbare.
      </p>
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-3">
          <Input
            label="E-post"
            name="email"
            type="email"
            title="Ange en giltig e-postadress."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label="Lösenord"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={() => setCurrentView(LOGIN_VIEW.FORGOT_PASSWORD)}
            className="hover:underline"
            style={{ fontSize: "14px", fontWeight: 500, color: "#F50000", background: "none", border: 0, padding: "6px 0", cursor: "pointer" }}
            data-testid="forgot-password-button"
          >
            Glömt lösenordet?
          </button>
        </div>
        <ErrorMessage error={message} data-testid="login-error-message" />
        <SubmitButton
          data-testid="sign-in-button"
          className="w-full mt-4 !h-12 !rounded-xl !bg-[#F50000] hover:!bg-[#d80000] !border-0 !shadow-none !text-white !font-semibold"
        >
          Logga in
        </SubmitButton>
      </form>

      <div style={{ borderTop: "1px solid #efeae5", margin: "24px 0 18px" }} />

      <p style={{ textAlign: "center", fontSize: "14.5px", color: "#6f685f", margin: 0 }}>
        Ny kund?
      </p>
      <button
        type="button"
        onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
        className="hover:border-[#1b1714] transition-colors"
        style={{ marginTop: "10px", height: "48px", borderRadius: "12px", border: "1px solid #d9d2ca", background: "#fff", color: "#1b1714", fontWeight: 600, fontSize: "15px", cursor: "pointer" }}
        data-testid="register-button"
      >
        Skapa konto
      </button>
      <p style={{ textAlign: "center", fontSize: "14px", color: "#6f685f", margin: "18px 0 0" }}>
        Handlade du utan konto?{" "}
        <LocalizedClientLink href="/orderstatus" style={{ color: "#1b1714", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "3px" }}>
          Spåra din order
        </LocalizedClientLink>
      </p>
    </div>
  )
}

export default Login
