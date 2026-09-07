"use client"

import { useState, FormEvent } from "react"

export default function NewsletterSignup() {
  const [email, setEmail] = useState("")
  const [done, setDone] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.includes("@") || !email.includes(".")) return
    setDone(true)
  }

  if (done) {
    return (
      <div className="newsform" role="status">
        <span style={{ color: "#fff", fontWeight: 700 }}>
          ✓ Tack! Du är anmäld — kolla din inkorg för din 10%-kod.
        </span>
      </div>
    )
  }

  return (
    <form className="newsform" onSubmit={submit}>
      <input
        type="email"
        placeholder="Din e-postadress"
        aria-label="E-postadress"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit">Prenumerera</button>
    </form>
  )
}
