"use client"

import { useState } from "react"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUBKEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

const DEVICES: [string, string][] = [
  ["iPhone", "📱"], ["MacBook", "💻"], ["iPad", "🟦"], ["Apple Watch", "⌚"], ["Samsung / Android", "🤖"], ["Surfplatta", "📋"],
]
const CONDITIONS = ["Som ny", "Bra skick", "Sliten", "Trasig / defekt"]
const ISSUES = ["Sprucken skärm", "Dåligt batteri", "Operatörslås", "Fungerar ej", "Vattenskada", "Repor / bucklor"]
const USP: [string, string][] = [
  ["💰", "Högsta budet på marknaden"], ["🔎", "Kostnadsfri värdering"], ["⚡", "Snabb betalning"], ["🔒", "Säker dataradering"],
]
const CATS: [string, string, string][] = [
  ["💻", "Sälj MacBook", "MacBook Air & Pro, alla årsmodeller. Vi är specialister på Mac — expertbud även på äldre maskiner."],
  ["📱", "Sälj iPhone", "Från iPhone 7 till de senaste. Operatörslåst, sprucken skärm eller trött batteri — vi ger bud ändå."],
  ["🟦", "Sälj iPad", "iPad, iPad Air, iPad Pro och iPad mini. Alla generationer värderas snabbt och rättvist."],
  ["⌚", "Sälj Apple Watch", "Alla serier av Apple Watch. Få ett bud på din smartklocka på minuter."],
  ["🤖", "Sälj Samsung & Android", "Samsung Galaxy, Sony, Huawei, OnePlus, Xiaomi och fler. Vi köper alla Android-mobiler."],
  ["📋", "Sälj surfplatta", "Surfplattor av alla märken. Snabb värdering och högt bud, oavsett skick."],
]
const STEPS: [string, string, string][] = [
  ["1", "Du fyller i", "Svara på några snabba frågor om din enhet och bifoga gärna bilder."],
  ["2", "Vi mejlar bud", "Du får ett personligt prisförslag på mejl, utan förpliktelser."],
  ["3", "Du skickar", "Tacka ja och skicka in enheten. Märk paketet med SÄLJ så går det extra snabbt."],
  ["4", "Vi betalar", "Stämmer skicket får du pengarna direkt via banköverföring."],
]
const FAQ: [string, string][] = [
  ["Hur snabbt får jag betalt?", "När din enhet kommit fram testar vi den, ofta samma dag. Stämmer skicket betalar vi ut direkt via banköverföring."],
  ["Kostar det något att få ett bud?", "Nej. Det är helt kostnadsfritt och oförbindande att få en värdering. Du bestämmer själv om du vill sälja."],
  ["Köper ni trasiga eller operatörslåsta enheter?", "Ja! Vi köper enheter med sprucken skärm, dåligt batteri, operatörslås eller andra fel — vi reparerar och återanvänder delar."],
  ["Vad händer med min data?", "All din data raderas säkert och permanent. Logga gärna ut från iCloud/Google och stäng av Hitta min innan du skickar."],
  ["Hur får jag det högsta budet?", "Beskriv skicket ärligt och bifoga tydliga bilder på fram- och baksida samt laddningsport i god belysning."],
]

export default function SaljDinEnhetPage() {
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
  const [faq, setFaq] = useState<number | null>(null)

  const toForm = (d: string) => { setDevice(d); setStep(1); const el = document.getElementById("vform"); if (el) el.scrollIntoView({ behavior: "smooth" }) }
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
    <div className="content-container py-10">
      <div className="rounded-3xl bg-[#14161C] text-white px-6 py-12 small:px-12 small:py-16 text-center">
        <span className="inline-block text-xs font-semibold tracking-wide text-[#FFD24D] mb-4">★ MARKNADENS HÖGSTA BUD — SEDAN 2014</span>
        <h1 className="text-3xl small:text-5xl font-semibold tracking-tight max-w-3xl mx-auto">Sälj din enhet och få marknadens högsta bud</h1>
        <p className="mt-4 text-white/70 max-w-2xl mx-auto leading-relaxed">Sälj din iPhone, MacBook, iPad, Apple Watch eller Android-mobil till Teknikhouse. Fyll i dina uppgifter så mejlar vi ett personligt prisförslag — kostnadsfri värdering och pengarna in på ditt konto så fort vi testat din enhet.</p>
        <button onClick={() => toForm(device || "iPhone")} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#F50000] px-7 py-3.5 font-semibold hover:bg-[#C90000] transition-colors">Få ditt bud nu →</button>
        <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-white/80"><span>✔ Högsta budet — garanterat</span><span>✔ Kostnadsfri värdering</span><span>✔ Snabb betalning</span><span>✔ Säker dataradering</span></div>
      </div>
      <div className="grid grid-cols-2 large:grid-cols-4 gap-4 mt-8">
        {USP.map(([e, t]) => (<div key={t} className="rounded-2xl border border-ui-border-base p-5 text-center"><div className="text-3xl">{e}</div><div className="mt-2 font-semibold text-sm">{t}</div></div>))}
      </div>
      <h2 className="text-2xl font-semibold tracking-tight mt-14">Vi köper alla märken & modeller</h2>
      <p className="mt-2 text-ui-fg-subtle">iPhone, Android, surfplatta, klocka eller dator — fungerande, trasig eller gammal. Vi köper det.</p>
      <div className="grid grid-cols-1 small:grid-cols-2 large:grid-cols-3 gap-4 mt-6">
        {CATS.map(([e, t, d]) => (<button key={t} onClick={() => toForm(t.replace("Sälj ", ""))} className="text-left rounded-2xl border border-ui-border-base p-6 hover:border-[#F50000] hover:shadow-sm transition-all"><div className="text-3xl">{e}</div><div className="mt-3 font-semibold">{t}</div><p className="mt-1 text-sm text-ui-fg-subtle leading-relaxed">{d}</p><span className="mt-3 inline-block text-sm font-medium text-[#F50000]">{t} →</span></button>))}
      </div>
      <h2 className="text-2xl font-semibold tracking-tight mt-14">Fyra enkla steg till betalning</h2>
      <div className="grid grid-cols-1 small:grid-cols-2 large:grid-cols-4 gap-4 mt-6">
        {STEPS.map(([n, t, d]) => (<div key={n} className="rounded-2xl border border-ui-border-base p-6"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFECEC] text-[#F50000] font-bold">{n}</span><div className="mt-3 font-semibold">{t}</div><p className="mt-1 text-sm text-ui-fg-subtle leading-relaxed">{d}</p></div>))}
      </div>
      <div id="vform" className="mt-14 rounded-3xl border border-ui-border-base overflow-hidden scroll-mt-24">
        <div className="bg-[#F7F7F8] px-6 py-6 small:px-10 border-b border-ui-border-base"><p className="text-sm font-semibold uppercase tracking-wide text-[#F50000]">Få ditt prisförslag</p><h2 className="text-2xl font-semibold tracking-tight mt-1">Skapa din värderingsförfrågan</h2><p className="mt-2 text-ui-fg-subtle text-sm max-w-2xl">Fyll i nedan så sammanställer vi din förfrågan. Vi går igenom dina uppgifter och mejlar dig ett personligt prisförslag — inget pris visas online.</p></div>
        <div className="px-6 py-8 small:px-10">
          {status === "done" ? (
            <div className="text-center py-8 max-w-lg mx-auto"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E7F8EF] text-[#12B76A] text-2xl">✓</div><h3 className="text-xl font-semibold">Tack! Din förfrågan är mottagen</h3><p className="mt-2 text-ui-fg-subtle">Referens: <span className="font-semibold text-ui-fg-base">{reference}</span></p><p className="mt-2 text-ui-fg-subtle text-sm">Vi går igenom uppgifterna om din <b>{device} {model}</b> och mejlar ett personligt prisförslag till <b>{email}</b> inom 1–2 vardagar.</p><button onClick={reset} className="mt-6 text-sm font-medium text-[#F50000] hover:underline">Gör en ny värdering</button></div>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-xs text-ui-fg-subtle mb-6"><span className={step >= 0 ? "font-semibold text-[#F50000]" : ""}>1. Enhet</span><span>›</span><span className={step >= 1 ? "font-semibold text-[#F50000]" : ""}>2. Skick</span><span>›</span><span className={step >= 2 ? "font-semibold text-[#F50000]" : ""}>3. Kontakt</span></div>
              {step === 0 && (<div><p className="font-medium mb-3">1. Vilken enhet vill du sälja?</p><div className="grid grid-cols-2 small:grid-cols-3 gap-3">{DEVICES.map(([d, e]) => (<button key={d} onClick={() => pickDevice(d)} className={"rounded-xl border p-4 text-center hover:border-[#F50000] transition-colors " + (device === d ? "border-[#F50000] bg-[#FFF5F5]" : "border-ui-border-base")}><div className="text-2xl">{e}</div><div className="mt-1 text-sm font-medium">{d}</div></button>))}</div></div>)}
              {step === 1 && (<div className="flex flex-col gap-5 max-w-xl"><div className="flex items-center justify-between"><p className="font-medium">2. Berätta om din {device}</p><button onClick={() => setStep(0)} className="text-sm text-[#F50000] hover:underline">Byt enhet</button></div><div><label className="block text-sm font-medium mb-1.5">Modell *</label><input value={model} onChange={(e) => setModel(e.target.value)} placeholder="t.ex. iPhone 13 Pro, MacBook Air M1" className={inp} /></div><div><label className="block text-sm font-medium mb-1.5">Lagring / minne (valfritt)</label><input value={storage} onChange={(e) => setStorage(e.target.value)} placeholder="t.ex. 128 GB" className={inp} /></div><div><label className="block text-sm font-medium mb-2">Skick</label><div className="flex flex-wrap gap-3 text-sm">{CONDITIONS.map((c) => (<label key={c} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="cond" checked={condition === c} onChange={() => setCondition(c)} /> {c}</label>))}</div></div><div><label className="block text-sm font-medium mb-2">Eventuella fel (kryssa i)</label><div className="grid grid-cols-2 gap-2 text-sm">{ISSUES.map((i) => (<label key={i} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={issues.includes(i)} onChange={() => toggleIssue(i)} /> {i}</label>))}</div></div><div><label className="block text-sm font-medium mb-1.5">Tillbehör som medföljer (valfritt)</label><input value={accessories} onChange={(e) => setAccessories(e.target.value)} placeholder="t.ex. laddare, originalkartong, kvitto" className={inp} /></div><button onClick={() => setStep(2)} className="w-full rounded-xl bg-[#14161C] py-3.5 text-white font-semibold hover:opacity-90 transition-opacity">Nästa →</button></div>)}
              {step === 2 && (<div className="flex flex-col gap-5 max-w-xl"><div className="flex items-center justify-between"><p className="font-medium">3. Dina uppgifter</p><button onClick={() => setStep(1)} className="text-sm text-[#F50000] hover:underline">Tillbaka</button></div><div className="rounded-xl bg-[#F7F7F8] px-4 py-3 text-sm text-ui-fg-subtle">Din enhet: <b className="text-ui-fg-base">{device} {model}{storage ? " " + storage : ""}</b> · {condition}{issues.length ? " · " + issues.join(", ") : ""}</div><div><label className="block text-sm font-medium mb-1.5">Namn *</label><input value={name} onChange={(e) => setName(e.target.value)} className={inp} /></div><div><label className="block text-sm font-medium mb-1.5">E-postadress *</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="din@epost.se" className={inp} /></div><div><label className="block text-sm font-medium mb-1.5">Telefon (valfritt)</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inp} /></div><div><label className="block text-sm font-medium mb-1.5">Meddelande (valfritt)</label><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Övrig info om din enhet." className={inp + " resize-none"} /></div>{status === "error" && <p className="text-sm text-[#F50000]">{err}</p>}<button onClick={submit} disabled={status === "submitting"} className="w-full rounded-xl bg-[#F50000] py-3.5 text-white font-semibold hover:bg-[#C90000] transition-colors disabled:opacity-60">{status === "submitting" ? "Skickar…" : "Skicka värderingsförfrågan"}</button><p className="text-xs text-ui-fg-muted">Kostnadsfritt och oförbindande. Inget pris visas online — vi mejlar ditt personliga bud.</p></div>)}
            </div>
          )}
        </div>
      </div>
      <div className="mt-14 max-w-3xl [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-2 [&_p]:text-ui-fg-subtle [&_p]:leading-relaxed [&_p]:mb-3">
        <h2>Sälj din enhet och få bästa offerten på marknaden</h2>
        <p>Vill du sälja din iPhone, sälja din MacBook eller sälja din mobil snabbt, tryggt och till bäst betalt? Hos Teknikhouse köper vi din iPhone, Android-mobil, surfplatta, Apple Watch och MacBook — alla märken av mobiltelefoner och datorer. Du får marknadens högsta bud, kostnadsfri värdering och snabb betalning så fort vi testat din enhet.</p>
        <h2>Sälj MacBook till specialister</h2>
        <p>Vi är specialister på Mac och köper alla modeller av MacBook Air och MacBook Pro, även äldre årsmodeller. Oavsett om din MacBook är i toppskick eller har ett trött batteri får du ett rättvist expertbud — ofta mer än vad inbytesprogram och marknadsplatser erbjuder.</p>
        <h2>Sälj iPhone — fungerande eller trasig</h2>
        <p>Vi köper alla iPhone-modeller, från iPhone 7 till de allra senaste. Operatörslåst, sprucken skärm, dåligt batteri eller defekt — vi ger bud ändå, eftersom vi själva reparerar och återanvänder delar.</p>
        <h2>Sälj Samsung & Android-mobil</h2>
        <p>Vi köper alla Samsung Galaxy och andra Android-mobiler — Sony Xperia, Huawei, OnePlus, Xiaomi och fler. Du får marknadens högsta bud och snabb betalning in på ditt konto.</p>
        <h2>Varför sälja begagnat nu?</h2>
        <p>Mobiler och datorer tappar värde varje månad. Ju längre du väntar, desto mindre får du. Genom att sälja din enhet idag får du ut maximalt värde — och bidrar samtidigt till en mer hållbar elektronik genom återbruk.</p>
      </div>
      <h2 className="text-2xl font-semibold tracking-tight mt-14">Vanliga frågor om att sälja</h2>
      <div className="mt-4 max-w-3xl divide-y divide-ui-border-base border-y border-ui-border-base">
        {FAQ.map(([qn, an], i) => (<div key={i}><button onClick={() => setFaq(faq === i ? null : i)} className="w-full flex items-center justify-between py-4 text-left font-medium"><span>{qn}</span><span className="text-[#F50000] text-xl">{faq === i ? "−" : "+"}</span></button>{faq === i && <p className="pb-4 text-sm text-ui-fg-subtle leading-relaxed">{an}</p>}</div>))}
      </div>
      <div className="mt-14 grid grid-cols-1 large:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-ui-border-base p-6 small:p-8"><h2 className="text-lg font-semibold">Hellre direkt över disk? Kom förbi butiken</h2><p className="mt-2 text-sm text-ui-fg-subtle leading-relaxed">Vi värderar din enhet på plats medan du väntar — och du får betalt direkt. Inget porto, ingen väntetid.</p><p className="mt-3 text-sm">📍 Sveavägen 139, 113 46 Stockholm<br />🕒 Mån–Fre 10–20 · Lör 11–17<br />💸 Betalning direkt i butiken</p></div>
        <div className="rounded-2xl bg-[#F50000] text-white p-6 small:p-8 flex flex-col justify-center"><h2 className="text-xl font-semibold">Få marknadens högsta bud på din enhet</h2><p className="mt-2 text-white/85 text-sm">Kostnadsfritt och oförbindande prisförslag direkt i din inkorg. Högsta budet och snabb betalning — garanterat.</p><button onClick={() => toForm(device || "iPhone")} className="mt-5 self-start rounded-xl bg-white text-[#F50000] px-6 py-3 font-semibold hover:bg-white/90 transition-colors">Få ditt bud nu →</button></div>
      </div>
    </div>
  )
}
