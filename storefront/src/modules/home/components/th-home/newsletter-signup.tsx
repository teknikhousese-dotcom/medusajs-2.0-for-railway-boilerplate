"use client"

import { useState, FormEvent } from "react"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

type State = "idle" | "sending" | "done" | "invalid" | "error"

/* One newsletter block for the whole site (home page and /newsletter).
   Self-contained styles so it looks the same wherever it is rendered. */
const CSS = [
  ".thnl{background:linear-gradient(135deg,#1b1714,#332c26);border-radius:24px;padding:40px 44px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,460px);align-items:center;gap:32px;color:#fff;font-family:system-ui,-apple-system,'Segoe UI',Inter,sans-serif}",
  ".thnl-kicker{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#ffb3a8;margin:0 0 10px}",
  ".thnl-kicker svg{width:16px;height:16px}",
  ".thnl h1,.thnl h2{font-family:'Poppins',ui-rounded,'SF Pro Rounded',system-ui,sans-serif;font-size:clamp(22px,2.8vw,28px);font-weight:600;line-height:1.2;margin:0 0 8px;color:#fff;letter-spacing:-.02em}",
  ".thnl-copy{margin:0;color:#d6cfc7;font-size:15px;line-height:1.6;max-width:440px}",
  ".thnl-form{width:100%;min-width:0;margin:0}",
  ".thnl-field{display:flex;align-items:center;gap:6px;background:#fff;border:2px solid transparent;border-radius:999px;padding:5px 5px 5px 16px;box-shadow:0 10px 30px rgba(0,0,0,.28);transition:box-shadow .15s,border-color .15s}",
  ".thnl-field:focus-within{border-color:#F50000;box-shadow:0 0 0 4px rgba(245,0,0,.28),0 10px 30px rgba(0,0,0,.28)}",
  ".thnl-field.is-err{border-color:#ff6b57}",
  ".thnl-field svg{width:20px;height:20px;flex:0 0 auto;color:#8a8178}",
  ".thnl-field input{flex:1 1 0%;width:100%;min-width:0;height:46px;border:0;outline:0;background:transparent;font-size:16px;color:#1b1714;padding:0 6px;font-family:inherit;-webkit-appearance:none;appearance:none}",
  ".thnl-field input::placeholder{color:#9a928a;opacity:1}",
  ".thnl-field button{flex:0 0 auto;height:46px;padding:0 22px;border:0;border-radius:999px;background:#F50000;color:#fff;font-family:'Poppins',ui-rounded,system-ui,sans-serif;font-weight:600;font-size:15px;cursor:pointer;transition:background .15s,transform .1s;white-space:nowrap}",
  ".thnl-field button:hover{background:#D10000}",
  ".thnl-field button:active{transform:scale(.97)}",
  ".thnl-field button:focus-visible{outline:3px solid #fff;outline-offset:2px}",
  ".thnl-field button:disabled{opacity:.7;cursor:default}",
  ".thnl-msg{margin:10px 4px 0;font-size:13.5px;font-weight:600;line-height:1.45;color:#ffb3a8}",
  ".thnl-note{margin:10px 4px 0;font-size:12.5px;line-height:1.5;color:#b3aaa0}",
  ".thnl-note a{color:#fff;text-decoration:underline;text-underline-offset:2px}",
  ".thnl-note a:focus-visible{outline:2px solid #fff;outline-offset:2px;border-radius:2px}",
  ".thnl-ok{display:flex;gap:12px;align-items:flex-start;background:rgba(26,157,85,.16);border:1px solid rgba(26,157,85,.55);border-radius:18px;padding:16px 18px;color:#fff;font-size:15px;line-height:1.5}",
  ".thnl-ok b{display:block;font-weight:600}",
  ".thnl-ok span{color:#d6cfc7;font-size:13.5px}",
  ".thnl-ok i{flex:0 0 auto;width:28px;height:28px;border-radius:50%;background:#1a9d55;display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:700;font-size:15px}",
  "@media (max-width:900px){.thnl{grid-template-columns:minmax(0,1fr);padding:32px 28px;gap:22px}}",
  "@media (max-width:560px){.thnl{padding:26px 18px;border-radius:20px}.thnl-field{padding-left:12px}.thnl-field button{padding:0 16px}}",
  "@media (max-width:359px){.thnl-field svg{display:none}.thnl-field button{padding:0 13px;font-size:14px}}",
].join("")

export default function NewsletterSignup({ headingLevel = 2 }: { headingLevel?: 1 | 2 }) {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<State>("idle")
  const Heading = headingLevel === 1 ? "h1" : "h2"

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setState("invalid")
      return
    }
    setState("sending")
    try {
      const r = await fetch(BACKEND + "/store/newsletter", {
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

  const bad = state === "invalid" || state === "error"

  return (
    <div className="thnl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div>
        <p className="thnl-kicker">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h16v12H4z" /><path d="M4 7l8 6 8-6" /></svg>
          Nyhetsbrev
        </p>
        <Heading>Missa inga kampanjer</Heading>
        <p className="thnl-copy">Få veta först när nya delar kommer in, när vi kör kampanj och när vi delar nya reparationstips.</p>
      </div>

      {state === "done" ? (
        <div className="thnl-ok" role="status" aria-live="polite">
          <i aria-hidden="true">✓</i>
          <div>
            <b>Tack, nu är du med!</b>
            <span>Nästa utskick landar i din inkorg. Vill du sluta få dem finns en avregistreringslänk i varje mejl.</span>
          </div>
        </div>
      ) : (
        <form className="thnl-form" onSubmit={submit} noValidate>
          <div className={bad ? "thnl-field is-err" : "thnl-field"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M4 7l8 6 8-6" /></svg>
            <input
              type="email"
              name="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Din e-post"
              aria-label="Din e-postadress"
              aria-invalid={bad}
              aria-describedby="thnl-note"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (bad) setState("idle")
              }}
            />
            <button type="submit" disabled={state === "sending"}>
              {state === "sending" ? "Skickar…" : "Anmäl mig"}
            </button>
          </div>
          <div aria-live="polite">
            {state === "invalid" ? (
              <p className="thnl-msg">Kolla e-postadressen, något ser inte riktigt rätt ut.</p>
            ) : null}
            {state === "error" ? (
              <p className="thnl-msg">Det gick inte att anmäla dig just nu. Försök igen om en stund eller mejla info@teknikhouse.se.</p>
            ) : null}
          </div>
          <p className="thnl-note" id="thnl-note">
            Du kan avsluta när du vill. <a href="/info/integritetspolicy">Så hanterar vi dina uppgifter</a>
          </p>
        </form>
      )}
    </div>
  )
}
