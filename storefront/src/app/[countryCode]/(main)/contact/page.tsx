"use client"
import { useState } from "react"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export default function ContactPage() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle")
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" })
  const upd = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }))
  async function submit(e: any) {
    e.preventDefault()
    setState("sending")
    try {
      const r = await fetch(`${BACKEND}/store/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
        body: JSON.stringify({ ...form, kind: "contact" }),
      })
      setState(r.ok ? "done" : "error")
    } catch {
      setState("error")
    }
  }
  return (
    <div className="content-container py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-semibold mb-2">Kontakta oss</h1>
        <p className="text-gray-600 mb-8 max-w-2xl">
          Vi finns här för att hjälpa dig — före, under och efter köpet. Fyll i formuläret så återkommer vi normalt inom en arbetsdag.
        </p>
        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-4 text-[15px] text-gray-700">
            <div>
              <div className="font-semibold text-gray-900">E-post</div>
              <a className="text-[#D10000] hover:underline" href="mailto:info@teknikhouse.se">info@teknikhouse.se</a>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Butik &amp; retur</div>
              Nordic Teknik House AB<br />Sveavägen 139, 113 46 Stockholm
            </div>
            <div>
              <div className="font-semibold text-gray-900">Öppettider (Phone Rep)</div>
              Mån–fre 10–18 · Lör 11–17 · Sön 12–16
            </div>
            <div>
              <div className="font-semibold text-gray-900">Org.nr</div>
              559118-7488
            </div>
          </div>
          {state === "done" ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-green-800">
              Tack! Ditt meddelande har skickats. Vi återkommer så snart vi kan.
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <input required placeholder="Namn" value={form.name} onChange={upd("name")} className="w-full border rounded-lg px-3 py-2" />
              <input required type="email" placeholder="E-post" value={form.email} onChange={upd("email")} className="w-full border rounded-lg px-3 py-2" />
              <input placeholder="Telefon (valfritt)" value={form.phone} onChange={upd("phone")} className="w-full border rounded-lg px-3 py-2" />
              <input placeholder="Ämne" value={form.subject} onChange={upd("subject")} className="w-full border rounded-lg px-3 py-2" />
              <textarea required placeholder="Meddelande" value={form.message} onChange={upd("message")} rows={5} className="w-full border rounded-lg px-3 py-2" />
              {state === "error" && (
                <div className="text-red-600 text-sm">Något gick fel. Försök igen eller mejla info@teknikhouse.se.</div>
              )}
              <button disabled={state === "sending"} className="bg-[#D10000] text-white font-semibold rounded-lg px-6 py-3 hover:bg-[#b00000] disabled:opacity-60">
                {state === "sending" ? "Skickar…" : "Skicka meddelande"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
