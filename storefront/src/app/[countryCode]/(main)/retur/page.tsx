"use client"

import { useState, FormEvent } from "react"

const REASONS = [
  "Ångrar köpet (ångerrätt)",
  "Defekt eller trasig vara",
  "Fel vara levererad",
  "Motsvarar inte beskrivningen",
  "Annat",
]

const STEPS: [string, string, string][] = [
  ["1", "Fyll i formuläret", "Ange ordernummer, e-post och anledning till returen."],
  ["2", "Få returbekräftelse", "Vi mejlar bekräftelse och instruktioner inom 1–2 vardagar."],
  ["3", "Skicka tillbaka varan", "Packa varan väl och skicka till vår returadress."],
  ["4", "Återbetalning", "Vi återbetalar inom 14 dagar efter mottagen retur."],
]

export default function ReturPage() {
  const [order, setOrder] = useState("")
  const [email, setEmail] = useState("")
  const [reason, setReason] = useState(REASONS[0])
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle")
  const [reference, setReference] = useState("")

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!order.trim() || !email.includes("@") || !email.includes(".")) {
      setStatus("error")
      return
    }
    setStatus("submitting")
    await new Promise((r) => setTimeout(r, 500))
    setReference("RET-" + Math.random().toString(36).slice(2, 8).toUpperCase())
    setStatus("done")
  }

  return (
    <div className="content-container py-10">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#F50000] mb-2">
          Kundtjänst
        </p>
        <h1 className="text-3xl small:text-4xl font-semibold tracking-tight">Anmäl retur</h1>
        <p className="mt-3 text-ui-fg-subtle text-base leading-relaxed">
          Du har alltid 14 dagars ångerrätt enligt distansavtalslagen och 30 dagars öppet köp hos
          Teknikhouse. Fyll i formuläret nedan så guidar vi dig genom returen.
        </p>
      </div>

      <div className="grid grid-cols-1 large:grid-cols-2 gap-8 mt-10 items-start">
        <div className="rounded-2xl border border-ui-border-base p-6 small:p-8">
          {status === "done" ? (
            <div className="text-center py-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E7F8EF] text-[#12B76A] text-2xl">
                ✓
              </div>
              <h2 className="text-xl font-semibold">Tack! Din returbegäran är mottagen</h2>
              <p className="mt-2 text-ui-fg-subtle">
                Referensnummer: <span className="font-semibold text-ui-fg-base">{reference}</span>
              </p>
              <p className="mt-2 text-ui-fg-subtle text-sm">
                Vi skickar bekräftelse och returinstruktioner till{" "}
                <span className="font-medium text-ui-fg-base">{email}</span> inom 1–2 vardagar.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-6 text-sm font-medium text-[#F50000] hover:underline"
              >
                Anmäl en till retur
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              <h2 className="text-lg font-semibold">Returformulär</h2>
              <div>
                <label className="block text-sm font-medium mb-1.5">Ordernummer *</label>
                <input
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  placeholder="t.ex. 1042"
                  className="w-full rounded-xl border border-ui-border-base px-4 py-3 text-base outline-none focus:border-[#F50000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">E-postadress *</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="din@epost.se"
                  className="w-full rounded-xl border border-ui-border-base px-4 py-3 text-base outline-none focus:border-[#F50000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Anledning</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-ui-border-base px-4 py-3 text-base outline-none focus:border-[#F50000] bg-white"
                >
                  {REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Meddelande (valfritt)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Beskriv gärna vilka produkter det gäller och eventuellt fel."
                  className="w-full rounded-xl border border-ui-border-base px-4 py-3 text-base outline-none focus:border-[#F50000] resize-none"
                />
              </div>
              {status === "error" && (
                <p className="text-sm text-[#F50000]">
                  Fyll i ett giltigt ordernummer och en giltig e-postadress.
                </p>
              )}
              <button
                type="submit"
                disabled={status === "submitting"}
                className="mt-1 w-full rounded-xl bg-[#F50000] py-3.5 text-white font-semibold hover:bg-[#C90000] transition-colors disabled:opacity-60"
              >
                {status === "submitting" ? "Skickar…" : "Skicka returbegäran"}
              </button>
              <p className="text-xs text-ui-fg-muted">
                Har du ett konto?{" "}
                <a href="/se/account" className="text-[#F50000] hover:underline">
                  Logga in
                </a>{" "}
                för att se dina ordrar och returer.
              </p>
            </form>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-ui-border-base p-6 small:p-8">
            <h2 className="text-lg font-semibold">Din ångerrätt</h2>
            <p className="mt-2 text-ui-fg-subtle text-sm leading-relaxed">
              Enligt lagen om distansavtal (distansavtalslagen) har du 14 dagars ångerrätt från den
              dag du tar emot din vara. Utöver detta erbjuder vi 30 dagars öppet köp. Du kan även
              använda Konsumentverkets standardformulär för att utöva ångerrätten. Återbetalning
              sker inom 14 dagar efter att vi mottagit den returnerade varan.
            </p>
          </div>
          <div className="rounded-2xl border border-ui-border-base p-6 small:p-8">
            <h2 className="text-lg font-semibold">Så går det till</h2>
            <ol className="mt-4 flex flex-col gap-4">
              {STEPS.map(([n, t, d]) => (
                <li key={n} className="flex gap-4">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#FFECEC] text-[#F50000] font-bold text-sm">
                    {n}
                  </span>
                  <div>
                    <p className="font-medium">{t}</p>
                    <p className="text-sm text-ui-fg-subtle">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-2xl bg-[#14161C] text-white p-6 small:p-8">
            <h2 className="text-lg font-semibold">Returadress &amp; kontakt</h2>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              Teknikhouse — Retur
              <br />
              Sveavägen 139
              <br />
              113 46 Stockholm
            </p>
            <p className="mt-3 text-sm text-white/70">
              Frågor?{" "}
              <a href="mailto:info@teknikhouse.se" className="text-white underline">
                info@teknikhouse.se
              </a>
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <a href="/se/info/oppet-kop-retur" className="text-white/90 underline">
                Öppet köp &amp; Retur
              </a>
              <a href="/se/info/villkor" className="text-white/90 underline">
                Köpvillkor
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
