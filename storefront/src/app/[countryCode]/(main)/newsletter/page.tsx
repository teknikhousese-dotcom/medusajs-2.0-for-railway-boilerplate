"use client"
import { useState } from "react"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export default function NewsletterPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle")
  async function submit(e: any) {
    e.preventDefault()
    setState("sending")
    try {
      const r = await fetch(`${BACKEND}/store/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
        body: JSON.stringify({ email, name }),
      })
      setState(r.ok ? "done" : "error")
    } catch {
      setState("error")
    }
  }
  return (
    <div className="content-container py-12">
      <div className="max-w-xl mx-auto text-center">
        <h1 className="text-3xl font-semibold mb-3">Nyhetsbrev</h1>
        <p className="text-gray-600 mb-8">
          Anmäl dig till vårt nyhetsbrev och få nyheter, kampanjer och fyndvaror direkt i inkorgen. Du kan avregistrera dig när som helst.
        </p>
        {state === "done" ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-green-800">Tack! Du är nu anmäld till vårt nyhetsbrev.</div>
        ) : (
          <form onSubmit={submit} className="space-y-4 text-left">
            <input placeholder="Namn (valfritt)" value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg px-3 py-3" />
            <input required type="email" placeholder="Din e-postadress" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-lg px-3 py-3" />
            {state === "error" && <div className="text-red-600 text-sm">Något gick fel. Kontrollera adressen och försök igen.</div>}
            <button disabled={state === "sending"} className="w-full bg-[#D10000] text-white font-semibold rounded-lg px-6 py-3 hover:bg-[#b00000] disabled:opacity-60">
              {state === "sending" ? "Anmäler…" : "Anmäl mig"}
            </button>
            <p className="text-xs text-gray-400">
              Genom att anmäla dig godkänner du att vi lagrar din e-postadress för utskick enligt vår integritetspolicy.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
