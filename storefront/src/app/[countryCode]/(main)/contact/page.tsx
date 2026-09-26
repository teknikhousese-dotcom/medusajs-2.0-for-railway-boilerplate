"use client"
import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d={path} />
    </svg>
  )
}
const P = {
  mail: "M4 6h16v12H4z M4 7l8 6 8-6",
  box: "M3 7l9-4 9 4-9 4-9-4z M3 7v10l9 4 9-4V7 M12 11v10",
  refresh: "M4 4v6h6 M20 20v-6h-6 M20 8a8 8 0 0 0-14-3 M4 16a8 8 0 0 0 14 3",
  tag: "M3 3h7l11 11-7 7L3 10V3z M7 7h.01",
  pin: "M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z M12 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  clock: "M12 7v5l3 2 M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  arrow: "M5 12h14 M13 6l6 6-6 6",
}

function Shortcut({ href, icon, title, desc, cta }: any) {
  return (
    <LocalizedClientLink href={href} className="group flex flex-col rounded-2xl border border-gray-200 p-5 hover:border-[#D10000] hover:shadow-md transition-all">
      <div className="w-10 h-10 rounded-xl bg-red-50 text-[#D10000] flex items-center justify-center mb-4">
        <Icon path={icon} />
      </div>
      <div className="font-semibold text-gray-900 mb-1">{title}</div>
      <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1">{desc}</p>
      <span className="text-sm font-semibold text-[#D10000] inline-flex items-center gap-1">
        {cta}
        <span className="transition-transform group-hover:translate-x-1"><Icon path={P.arrow} /></span>
      </span>
    </LocalizedClientLink>
  )
}

export default function ContactPage() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle")
  const [f, setF] = useState({ name: "", email: "", phone: "", orderNo: "", subject: "", message: "" })
  const upd = (k: string) => (e: any) => setF((p) => ({ ...p, [k]: e.target.value }))
  async function submit(e: any) {
    e.preventDefault()
    setState("sending")
    try {
      const r = await fetch(`${BACKEND}/store/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
        body: JSON.stringify({ ...f, kind: "contact" }),
      })
      setState(r.ok ? "done" : "error")
    } catch {
      setState("error")
    }
  }
  const input = "w-full rounded-xl border border-gray-300 px-4 py-3 text-[15px] outline-none focus:border-[#D10000] focus:ring-2 focus:ring-red-100 transition"
  return (
    <div className="bg-white">
      <section className="content-container pt-10 sm:pt-14 pb-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold text-[#D10000] uppercase tracking-widest mb-3">Kundtjänst</p>
          <h1 className="text-3xl sm:text-5xl font-semibold text-gray-900 mb-5 tracking-tight">Hör av dig</h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Fråga om en beställning, en reservdel eller en reparation? Skriv några rader så hjälper vi dig vidare. Vi läser varje meddelande och svarar oftast redan samma dag, alla vardagar.
          </p>
        </div>
      </section>

      <section className="content-container pb-12">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Kanske hittar du svaret direkt</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Shortcut href="/orderstatus" icon={P.box} title="Var är min order?" desc="Skriv in ordernummer och e-post så ser du status och spårningslänk direkt. Vi skickar alltid spårbart med PostNord eller DHL." cta="Spåra order" />
          <Shortcut href="/return" icon={P.refresh} title="Retur och reklamation" desc="30 dagars öppet köp och garanti på allt vi säljer. Anmäl din retur på under en minut." cta="Anmäl retur" />
          <Shortcut href="/info/salj-din-enhet" icon={P.tag} title="Sälj din enhet" desc="Vi köper din begagnade mobil, surfplatta eller dator. Få ett bud utan att binda dig." cta="Få ett bud" />
        </div>
      </section>

      <section className="content-container pb-20">
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 text-[#D10000] mb-2"><Icon path={P.mail} /><span className="font-semibold text-gray-900">Mejla oss</span></div>
              <a href="mailto:info@teknikhouse.se" className="text-[#D10000] font-medium hover:underline">info@teknikhouse.se</a>
              <p className="text-sm text-gray-600 leading-relaxed mt-2">Snabbaste vägen till svar. Gäller det en beställning, skriv gärna med ditt ordernummer så går det ännu fortare.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 text-[#D10000] mb-2"><Icon path={P.pin} /><span className="font-semibold text-gray-900">Besök butiken</span></div>
              <p className="text-[15px] text-gray-800">Phone Rep<br />Sveavägen 139, 113 46 Stockholm</p>
              <p className="text-sm text-gray-600 leading-relaxed mt-2">Kom förbi med din enhet, så tittar vi på den på plats.</p>
              <div className="flex items-start gap-2 text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
                <span className="text-gray-400 mt-0.5"><Icon path={P.clock} /></span>
                <span>Måndag till fredag 10.00 till 18.00<br />Lördag 11.00 till 17.00<br />Söndag 12.00 till 16.00</span>
              </div>
            </div>
            <div className="rounded-2xl bg-gray-50 p-5 text-sm text-gray-600 leading-relaxed">
              Handla tryggt och säkert hos oss. Du betalar med Swish, kort eller Klarna, och du har 30 dagars öppet köp och garanti mot fabrikationsfel på det du köper.
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-8">
              {state === "done" ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Tack, ditt meddelande är på väg till oss</h3>
                  <p className="text-gray-600">Du hör från oss inom kort, oftast redan samma dag.</p>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">Skicka ett meddelande</h3>
                  <p className="text-sm text-gray-500 -mt-2">Fyll i så mycket du kan, så hittar rätt person hos oss ditt ärende snabbare.</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input required aria-label="Namn" autoComplete="name" placeholder="Namn" value={f.name} onChange={upd("name")} className={input} />
                    <input required type="email" aria-label="E-post" autoComplete="email" placeholder="E-post" value={f.email} onChange={upd("email")} className={input} />
                    <input type="tel" aria-label="Telefon" autoComplete="tel" placeholder="Telefon (valfritt)" value={f.phone} onChange={upd("phone")} className={input} />
                    <input aria-label="Ordernummer" inputMode="numeric" placeholder="Ordernummer (valfritt)" value={f.orderNo} onChange={upd("orderNo")} className={input} />
                  </div>
                  <select aria-label="Vad gäller det?" value={f.subject} onChange={upd("subject")} className={input + " bg-white"}>
                    <option value="">Vad gäller det?</option>
                    <option>Min beställning</option>
                    <option>Retur eller reklamation</option>
                    <option>Fråga om en produkt</option>
                    <option>Reparation (Phone Rep)</option>
                    <option>Företag och offert</option>
                    <option>Något annat</option>
                  </select>
                  <textarea required aria-label="Meddelande" placeholder="Skriv ditt meddelande här" value={f.message} onChange={upd("message")} rows={6} className={input} />
                  {state === "error" && (
                    <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-[#B00000]">Meddelandet gick inte iväg. Försök igen, eller mejla oss direkt på info@teknikhouse.se.</div>
                  )}
                  <button disabled={state === "sending"} className="w-full sm:w-auto bg-[#D10000] text-white font-semibold rounded-xl px-8 py-3.5 hover:bg-[#b00000] disabled:opacity-60 transition">
                    {state === "sending" ? "Skickar…" : "Skicka meddelande"}
                  </button>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Vi använder dina uppgifter bara för att svara på ditt meddelande. Läs mer i vår{" "}
                    <LocalizedClientLink href="/info/integritetspolicy" className="underline hover:text-gray-600">integritetspolicy</LocalizedClientLink>.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-8">Nordic Teknik House AB · Org.nr 559118-7488 · Sveavägen 139, 113 46 Stockholm</p>
      </section>
    </div>
  )
}
