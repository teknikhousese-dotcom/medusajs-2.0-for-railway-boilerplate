"use client"

import { useState, FormEvent } from "react"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUBKEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

const REASONS = [
  "Ångrar köpet (ångerrätt)",
  "Fel storlek",
  "Defekt eller trasig vara",
  "Fel vara levererad",
  "Motsvarar inte beskrivningen",
  "Annat",
]

const STEPS: [string, string, string][] = [
  ["1", "Hämta din order", "Ange ordernummer och e-post så hämtar vi din order."],
  ["2", "Välj varor & anledning", "Markera vilka varor du vill returnera eller reklamera."],
  ["3", "Skicka tillbaka varan", "Vi mejlar bekräftelse och returinstruktioner inom 1–2 vardagar."],
  ["4", "Återbetalning", "Vi återbetalar inom 14 dagar efter mottagen retur."],
]

type Item = { id: string; title: string; sku: string; quantity: number }
type Pick = { checked: boolean; qty: number; reason: string }

export default function ReturPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [order, setOrder] = useState("")
  const [email, setEmail] = useState("")
  const [type, setType] = useState<"retur" | "reklamation">("retur")
  const [message, setMessage] = useState("")
  const [items, setItems] = useState<Item[]>([])
  const [picks, setPicks] = useState<Pick[]>([])
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "error">("idle")
  const [lookupError, setLookupError] = useState("")
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "done" | "error">("idle")
  const [submitError, setSubmitError] = useState("")
  const [reference, setReference] = useState("")

  const lookup = async (e: FormEvent) => {
    e.preventDefault()
    setLookupError("")
    if (!order.trim() || !email.includes("@")) { setLookupStatus("error"); setLookupError("Fyll i ordernummer och en giltig e-postadress."); return }
    setLookupStatus("loading")
    try {
      const r = await fetch(BACKEND + "/store/order-lookup?order=" + encodeURIComponent(order.trim()) + "&email=" + encodeURIComponent(email.trim()), { headers: { "x-publishable-api-key": PUBKEY } })
      const j = await r.json()
      if (!r.ok || !j.ok) { setLookupStatus("error"); setLookupError(j.error || "Vi hittade ingen order med den kombinationen."); return }
      const its: Item[] = j.order.items || []
      setItems(its)
      setPicks(its.map(() => ({ checked: false, qty: 1, reason: REASONS[0] })))
      setLookupStatus("idle")
      setStep(2)
    } catch { setLookupStatus("error"); setLookupError("Något gick fel. Försök igen om en stund.") }
  }

  const setPick = (i: number, patch: Partial<Pick>) => setPicks((p) => p.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))

  const submit = async () => {
    setSubmitError("")
    const chosen = items.map((it, i) => ({ it, p: picks[i] })).filter((x) => x.p && x.p.checked)
    if (!chosen.length) { setSubmitStatus("error"); setSubmitError("Markera minst en vara att returnera."); return }
    setSubmitStatus("submitting")
    try {
      const body = { order: order.trim(), email: email.trim(), type, message, items: chosen.map((x) => ({ title: x.it.title, sku: x.it.sku, quantity: x.p.qty, reason: x.p.reason })) }
      const r = await fetch(BACKEND + "/store/retur-anmalan", { method: "POST", headers: { "Content-Type": "application/json", "x-publishable-api-key": PUBKEY }, body: JSON.stringify(body) })
      const j = await r.json()
      if (!r.ok || !j.ok) { setSubmitStatus("error"); setSubmitError(j.error || "Kunde inte skicka returbegäran."); return }
      setReference(j.reference || "RET")
      setSubmitStatus("done")
    } catch { setSubmitStatus("error"); setSubmitError("Något gick fel. Försök igen om en stund.") }
  }

  const resetAll = () => { setStep(1); setItems([]); setPicks([]); setOrder(""); setEmail(""); setMessage(""); setType("retur"); setSubmitStatus("idle"); setLookupStatus("idle"); setReference("") }

  const inputCls = "w-full rounded-xl border border-ui-border-base px-4 py-3 text-base outline-none focus:border-[#F50000]"

  return (
    <div className="content-container py-10">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#F50000] mb-2">Kundtjänst</p>
        <h1 className="text-3xl small:text-4xl font-semibold tracking-tight">Anmäl retur eller reklamation</h1>
        <p className="mt-3 text-ui-fg-subtle text-base leading-relaxed">Du har alltid 14 dagars ångerrätt enligt distansavtalslagen och 30 dagars öppet köp hos Teknikhouse. Hämta din order nedan så guidar vi dig genom returen.</p>
      </div>

      <div className="grid grid-cols-1 large:grid-cols-2 gap-8 mt-10 items-start">
        <div className="rounded-2xl border border-ui-border-base p-6 small:p-8">
          {submitStatus === "done" ? (
            <div className="text-center py-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E7F8EF] text-[#12B76A] text-2xl">✓</div>
              <h2 className="text-xl font-semibold">Tack! Din anmälan är mottagen</h2>
              <p className="mt-2 text-ui-fg-subtle">Referensnummer: <span className="font-semibold text-ui-fg-base">{reference}</span></p>
              <p className="mt-2 text-ui-fg-subtle text-sm">Vi skickar bekräftelse och returinstruktioner till <span className="font-medium text-ui-fg-base">{email}</span> inom 1–2 vardagar.</p>
              <button onClick={resetAll} className="mt-6 text-sm font-medium text-[#F50000] hover:underline">Anmäl en till</button>
            </div>
          ) : step === 1 ? (
            <form onSubmit={lookup} className="flex flex-col gap-5">
              <h2 className="text-lg font-semibold">Hämta din order</h2>
              <div><label className="block text-sm font-medium mb-1.5">Ordernummer *</label><input value={order} onChange={(e) => setOrder(e.target.value)} placeholder="t.ex. 69358" className={inputCls} /></div>
              <div><label className="block text-sm font-medium mb-1.5">E-postadress *</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="din@epost.se" className={inputCls} /></div>
              {lookupStatus === "error" && <p className="text-sm text-[#F50000]">{lookupError}</p>}
              <button type="submit" disabled={lookupStatus === "loading"} className="mt-1 w-full rounded-xl bg-[#F50000] py-3.5 text-white font-semibold hover:bg-[#C90000] transition-colors disabled:opacity-60">{lookupStatus === "loading" ? "Hämtar…" : "Hämta order"}</button>
              <p className="text-xs text-ui-fg-muted">Har du ett konto? <a href="/se/account" className="text-[#F50000] hover:underline">Logga in</a> för att se dina ordrar och returer.</p>
            </form>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Order {order}</h2><button onClick={() => setStep(1)} className="text-sm font-medium text-[#F50000] hover:underline">Byt order</button></div>
              <div><label className="block text-sm font-medium mb-2">Typ av ärende</label><div className="flex flex-wrap gap-4 text-sm"><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="rtype" checked={type === "retur"} onChange={() => setType("retur")} /> Retur (ångerrätt / öppet köp)</label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="rtype" checked={type === "reklamation"} onChange={() => setType("reklamation")} /> Reklamation (fel / defekt vara)</label></div></div>
              <div className="flex flex-col gap-3"><label className="block text-sm font-medium">Välj varor att anmäla</label>
                {items.length === 0 ? <p className="text-sm text-ui-fg-subtle">Inga varor hittades på ordern.</p> : items.map((it, i) => (
                  <div key={it.id || i} className="rounded-xl border border-ui-border-base p-3">
                    <label className="flex items-start gap-3 cursor-pointer"><input type="checkbox" checked={picks[i]?.checked || false} onChange={(e) => setPick(i, { checked: e.target.checked })} className="mt-1" /><div className="flex-1"><div className="font-medium text-sm">{it.title}</div>{it.sku ? <div className="text-xs text-ui-fg-muted">Art.nr: {it.sku}</div> : null}</div></label>
                    {picks[i]?.checked && (
                      <div className="mt-3 pl-7 flex flex-col gap-2 small:flex-row small:items-center">
                        <div className="flex items-center gap-2"><span className="text-xs text-ui-fg-subtle">Antal</span><input type="number" min={1} max={it.quantity} value={picks[i].qty} onChange={(e) => setPick(i, { qty: Math.max(1, Math.min(it.quantity, Number(e.target.value) || 1)) })} className="w-16 rounded-lg border border-ui-border-base px-2 py-1 text-sm" /><span className="text-xs text-ui-fg-muted">av {it.quantity}</span></div>
                        <select value={picks[i].reason} onChange={(e) => setPick(i, { reason: e.target.value })} className="flex-1 rounded-lg border border-ui-border-base px-3 py-1.5 text-sm bg-white">{REASONS.map((r) => <option key={r} value={r}>{r}</option>)}</select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div><label className="block text-sm font-medium mb-1.5">Meddelande (valfritt)</label><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Beskriv gärna felet eller din retur." className={inputCls + " resize-none"} /></div>
              {submitStatus === "error" && <p className="text-sm text-[#F50000]">{submitError}</p>}
              <button onClick={submit} disabled={submitStatus === "submitting"} className="mt-1 w-full rounded-xl bg-[#F50000] py-3.5 text-white font-semibold hover:bg-[#C90000] transition-colors disabled:opacity-60">{submitStatus === "submitting" ? "Skickar…" : "Skicka returbegäran"}</button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-ui-border-base p-6 small:p-8"><h2 className="text-lg font-semibold">Din ångerrätt</h2><p className="mt-2 text-ui-fg-subtle text-sm leading-relaxed">Enligt lagen om distansavtal (distansavtalslagen) har du 14 dagars ångerrätt från den dag du tar emot din vara. Utöver detta erbjuder vi 30 dagars öppet köp. Återbetalning sker inom 14 dagar efter att vi mottagit den returnerade varan.</p></div>
          <div className="rounded-2xl border border-ui-border-base p-6 small:p-8"><h2 className="text-lg font-semibold">Så går det till</h2><ol className="mt-4 flex flex-col gap-4">{STEPS.map(([n, t, d]) => (<li key={n} className="flex gap-4"><span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#FFECEC] text-[#F50000] font-bold text-sm">{n}</span><div><p className="font-medium">{t}</p><p className="text-sm text-ui-fg-subtle">{d}</p></div></li>))}</ol></div>
          <div className="rounded-2xl bg-[#14161C] text-white p-6 small:p-8"><h2 className="text-lg font-semibold">Returadress &amp; kontakt</h2><p className="mt-2 text-sm text-white/70 leading-relaxed">Teknikhouse — Retur<br />Sveavägen 139<br />113 46 Stockholm</p><p className="mt-3 text-sm text-white/70">Frågor? <a href="mailto:info@teknikhouse.se" className="text-white underline">info@teknikhouse.se</a></p><div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm"><a href="/se/info/oppet-kop-retur" className="text-white/90 underline">Öppet köp &amp; Retur</a><a href="/se/info/villkor" className="text-white/90 underline">Köpvillkor</a></div></div>
        </div>
      </div>
    </div>
  )
}
