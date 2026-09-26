"use client"

import { useState, FormEvent } from "react"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

type State = "idle" | "sending" | "done" | "invalid" | "error"

export default function NewsletterSignup() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<State>("idle")

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setState("invalid")
      return
    }
    setState("sending")
    try {
      const r = await fetch(`${BACKEND}/store/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
        body: JSON.stringify({ email: value }),
      })
      if (r.ok) {
        setState("done")
      } else {
        setState(r.status === 400 ? "invalid" : "error")
      }
    } catch {
      setState("error")
    }
  }

  if (state === "done") {
    return (
      <div className="newsform" role="status" aria-live="polite">
        <div className="newsok">
          <i aria-hidden="true">✓</i>
          <div>
            <b>Tack, nu är du med!</b>
            <span>Vi hörs i inkorgen. Vill du avsluta går det att göra i varje utskick.</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form className="newsform" onSubmit={submit} noValidate>
      <div className="newsrow">
        <input
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Din e-postadress"
          aria-label="Din e-postadress"
          aria-invalid={state === "invalid"}
          aria-describedby="th-news-note"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (state === "invalid" || state === "error") setState("idle")
          }}
        />
        <button type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Skickar…" : "Prenumerera"}
        </button>
      </div>
      <div aria-live="polite">
        {state === "invalid" ? (
          <p className="newsmsg err">Kolla e-postadressen, något ser inte riktigt rätt ut.</p>
        ) : null}
        {state === "error" ? (
          <p className="newsmsg err">Det gick inte att anmäla dig just nu. Försök igen om en stund eller mejla info@teknikhouse.se.</p>
        ) : null}
      </div>
      <p className="newsnote" id="th-news-note">
        Vi sparar bara din e-postadress för våra utskick och du kan avregistrera dig när du vill. Läs mer i vår{" "}
        <a href="/info/integritetspolicy">integritetspolicy</a>.
      </p>
    </form>
  )
}
