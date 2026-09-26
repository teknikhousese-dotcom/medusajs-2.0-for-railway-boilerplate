"use client"

import { useState } from "react"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUBKEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

const DEVICES: [string, string][] = [
  ["iPhone", "📱"], ["MacBook", "💻"], ["iPad", "🟦"], ["Apple Watch", "⌚"], ["Samsung / Android", "🤖"], ["Surfplatta", "📋"],
]
const CONDITIONS = ["Som ny", "Bra skick", "Sliten", "Trasig / defekt"]
const ISSUES = ["Sprucken skärm", "Dåligt batteri", "Operatörslås", "Fungerar ej", "Vattenskada", "Repor / bucklor"]

type Pick = { checked: boolean }

export default function ValuationForm() {
  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [device, setDevice] = useState("")
  const [model, setModel] = useState("")
  const [storage, setStorage] = useState("")
  const [condition, setCondition] = useState(CONDITIONS[0])
  const [issues, setIssues] = useState<string[]>([])
  const [accessories, setAccessories] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle")
  const [err, setErr] = useState("")
  const [reference, setReference] = useState("")

  const pickDevice = (d: string) => { setDevice(d); setStep(1) }
  const toggleIssue = (i: string) => setIssues((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))

  const submit = async () => {
    setErr("")
    if (!model.trim()) { setStatus("error"); setErr("Ange modell."); return }
    if (!name.trim() || !email.includes("@")) { setStatus("error"); setErr("Fyll i namn och en giltig e-postadress."); return }
    setStatus("submitting")
    try {
      const body = { device_type: device, model: model.trim(), storage: storage.trim(), condition, issues, accessories: accessories.trim(), name: name.trim(), email: email.trim(), phone: phone.trim(), message: message.trim() }
      const r = await fetch(BACKEND + "/store/valuation", { method: "POST", headers: { "Content-Type": "application/json", "x-publishable-api-key": PUBKEY }, body: JSON.stringify(body) })
      const j = await r.json()
      if (!r.ok || !j.ok) { setStatus("error"); setErr(j.error || "Kunde inte skicka förfrågan."); return }
      setReference(j.reference || "VAL"); setStatus("done")
    } catch { setStatus("error"); setErr("Något gick fel. Försök igen om en stund.") }
  }

  const reset = () => { setStep(0); setDevice(""); setModel(""); setStorage(""); setCondition(CONDITIONS[0]); setIssues([]); setAccessories(""); setName(""); setEmail(""); setPhone(""); setMessage(""); setStatus("idle"); setReference("") }
  const inp = "w-full rounded-xl border border-ui-border-base px-4 py-3 text-base outline-none focus:border-[#F50000]"

  return (
    <div id="varderingsformular" className="my-10 rounded-3xl border border-ui-border-base overflow-hidden scroll-mt-24 not-prose">
      <div className="bg-[#F7F7F8] px-5 py-6 sm:px-10 border-b border-ui-border-base">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#F50000]">Få ditt prisförslag</p>
        <h2 className="text-2xl font-semibold tracking-tight mt-1">Skapa din värderingsförfrågan</h2>
        <p className="mt-2 text-ui-fg-subtle text-sm max-w-2xl">Fyll i nedan så sammanställer vi din förfrågan. Vi går igenom dina uppgifter och mejlar dig ett personligt prisförslag. Inget pris visas online.</p>
      </div>
      <div className="px-5 py-6 sm:px-10 sm:py-8">
        {status === "done" ? (
          <div className="text-center py-8 max-w-lg mx-auto"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E7F8EF] text-[#12B76A] text-2xl">✓</div><h3 className="text-xl font-semibold">Tack! Din förfrågan är mottagen</h3><p className="mt-2 text-ui-fg-subtle">Referens: <span className="font-semibold text-ui-fg-base">{reference}</span></p><p className="mt-2 text-ui-fg-subtle text-sm">Vi går igenom uppgifterna om din <b>{device} {model}</b> och mejlar ett personligt prisförslag till <b>{email}</b> inom ett par vardagar.</p><button onClick={reset} className="mt-6 text-sm font-medium text-[#F50000] hover:underline">Gör en ny värdering</button></div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-xs text-ui-fg-subtle mb-6"><span className={step >= 0 ? "font-semibold text-[#F50000]" : ""}>1. Enhet</span><span>›</span><span className={step >= 1 ? "font-semibold text-[#F50000]" : ""}>2. Skick</span><span>›</span><span className={step >= 2 ? "font-semibold text-[#F50000]" : ""}>3. Kontakt</span></div>
            {step === 0 && (<div><p className="font-medium mb-3">1. Vilken enhet vill du sälja?</p><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{DEVICES.map(([d, e]) => (<button key={d} onClick={() => pickDevice(d)} className={"rounded-xl border p-4 text-center hover:border-[#F50000] transition-colors " + (device === d ? "border-[#F50000] bg-[#FFF5F5]" : "border-ui-border-base")}><div className="text-2xl">{e}</div><div className="mt-1 text-sm font-medium">{d}</div></button>))}</div></div>)}
            {step === 1 && (<div className="flex flex-col gap-5 max-w-xl"><div className="flex items-center justify-between"><p className="font-medium">2. Berätta om din {device}</p><button onClick={() => setStep(0)} className="text-sm text-[#F50000] hover:underline">Byt enhet</button></div><div><label className="block text-sm font-medium mb-1.5">Modell *</label><input value={model} onChange={(e) => setModel(e.target.value)} placeholder="t.ex. iPhone 13 Pro, MacBook Air M1" className={inp} /></div><div><label className="block text-sm font-medium mb-1.5">Lagring / minne (valfritt)</label><input value={storage} onChange={(e) => setStorage(e.target.value)} placeholder="t.ex. 128 GB" className={inp} /></div><div><label className="block text-sm font-medium mb-2">Skick</label><div className="flex flex-wrap gap-3 text-sm">{CONDITIONS.map((c) => (<label key={c} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="cond" checked={condition === c} onChange={() => setCondition(c)} /> {c}</label>))}</div></div><div><label className="block text-sm font-medium mb-2">Eventuella fel (kryssa i)</label><div className="grid grid-cols-2 gap-2 text-sm">{ISSUES.map((i) => (<label key={i} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={issues.includes(i)} onChange={() => toggleIssue(i)} /> {i}</label>))}</div></div><div><label className="block text-sm font-medium mb-1.5">Tillbehör som medföljer (valfritt)</label><input value={accessories} onChange={(e) => setAccessories(e.target.value)} placeholder="t.ex. laddare, originalkartong, kvitto" className={inp} /></div><button onClick={() => setStep(2)} className="w-full rounded-xl bg-[#14161C] py-3.5 text-white font-semibold hover:opacity-90 transition-opacity">Nästa →</button></div>)}
            {step === 2 && (<div className="flex flex-col gap-5 max-w-xl"><div className="flex items-center justify-between"><p className="font-medium">3. Dina uppgifter</p><button onClick={() => setStep(1)} className="text-sm text-[#F50000] hover:underline">Tillbaka</button></div><div className="rounded-xl bg-[#F7F7F8] px-4 py-3 text-sm text-ui-fg-subtle">Din enhet: <b className="text-ui-fg-base">{device} {model}{storage ? " " + storage : ""}</b> · {condition}{issues.length ? " · " + issues.join(", ") : ""}</div><div><label className="block text-sm font-medium mb-1.5">Namn *</label><input value={name} onChange={(e) => setName(e.target.value)} className={inp} /></div><div><label className="block text-sm font-medium mb-1.5">E-postadress *</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="din@epost.se" className={inp} /></div><div><label className="block text-sm font-medium mb-1.5">Telefon (valfritt)</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inp} /></div><div><label className="block text-sm font-medium mb-1.5">Meddelande (valfritt)</label><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Övrig info om din enhet." className={inp + " resize-none"} /></div>{status === "error" && <p className="text-sm text-[#F50000]">{err}</p>}<button onClick={submit} disabled={status === "submitting"} className="w-full rounded-xl bg-[#F50000] py-3.5 text-white font-semibold hover:bg-[#C90000] transition-colors disabled:opacity-60">{status === "submitting" ? "Skickar…" : "Skicka värderingsförfrågan"}</button><p className="text-xs text-ui-fg-muted">Kostnadsfritt och oförbindande. Inget pris visas online. Vi mejlar ditt personliga bud.</p></div>)}
          </div>
        )}
      </div>
    </div>
  )
}
