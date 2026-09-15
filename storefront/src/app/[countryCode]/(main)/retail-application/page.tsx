"use client"
import { useState } from "react"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export default function RetailApplicationPage() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle")
  const [f, setF] = useState({ company: "", orgnr: "", name: "", email: "", phone: "", message: "" })
  const upd = (k: string) => (e: any) => setF((p) => ({ ...p, [k]: e.target.value }))
  async function submit(e: any) {
    e.preventDefault()
    setState("sending")
    try {
      const r = await fetch(`${BACKEND}/store/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
        body: JSON.stringify({ ...f, kind: "retail", subject: "Företagsansökan" }),
      })
      setState(r.ok ? "done" : "error")
    } catch {
      setState("error")
    }
  }
  return (
    <div className="content-container py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-semibold mb-2">Bli företagskund</h1>
        <p className="text-gray-600 mb-8">
          Handlar ni som företag? Ansök om ett företagskonto hos Teknikhouse så får ni fakturaköp, offert på volym och en fast kontaktperson. Fyll i uppgifterna nedan så hör vi av oss.
        </p>
        {state === "done" ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-green-800">
            Tack för din ansökan! Vi granskar uppgifterna och återkommer inom kort.
          </div>
        ) : (
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
            <input required placeholder="Företag" value={f.company} onChange={upd("company")} className="border rounded-lg px-3 py-2" />
            <input placeholder="Organisationsnummer" value={f.orgnr} onChange={upd("orgnr")} className="border rounded-lg px-3 py-2" />
            <input required placeholder="Kontaktperson" value={f.name} onChange={upd("name")} className="border rounded-lg px-3 py-2" />
            <input required type="email" placeholder="E-post" value={f.email} onChange={upd("email")} className="border rounded-lg px-3 py-2" />
            <input placeholder="Telefon" value={f.phone} onChange={upd("phone")} className="border rounded-lg px-3 py-2 sm:col-span-2" />
            <textarea placeholder="Meddelande (valfritt) — t.ex. bransch, volym, behov" value={f.message} onChange={upd("message")} rows={4} className="border rounded-lg px-3 py-2 sm:col-span-2" />
            {state === "error" && <div className="text-red-600 text-sm sm:col-span-2">Något gick fel. Försök igen eller mejla info@teknikhouse.se.</div>}
            <button disabled={state === "sending"} className="bg-[#D10000] text-white font-semibold rounded-lg px-6 py-3 hover:bg-[#b00000] disabled:opacity-60 sm:col-span-2">
              {state === "sending" ? "Skickar…" : "Skicka ansökan"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
