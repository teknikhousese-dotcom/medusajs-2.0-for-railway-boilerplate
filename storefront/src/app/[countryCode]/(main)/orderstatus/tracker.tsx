"use client"

import { useRef, useState, FormEvent } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUBKEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

const MAX_TRIES = 5
const LOCK_MS = 60000

type Line = { id: string; title: string; variant?: string; quantity: number; thumbnail?: string }
type Result = {
  number: string
  created: string
  step: 1 | 2 | 3
  delivered: boolean
  canceled: boolean
  lines: Line[]
  tracking: { number: string; url: string; carrier: string }[]
  total: string
}

const STEPS: [string, string][] = [
  ["Mottagen", "Vi har fått din beställning."],
  ["Behandlas", "Vi plockar och packar dina varor."],
  ["Skickad", "Paketet är på väg till dig."],
]

function str(v: any): string {
  return v == null ? "" : String(v).trim()
}

function isTrue(v: any): boolean {
  return v === true || v === "true" || v === 1 || v === "1"
}

function trackingLink(num: string, url: string, method: string): { url: string; carrier: string } {
  const dhl = /dhl/i.test(method) || /dhl/i.test(url)
  const carrier = dhl ? "DHL" : "PostNord"
  if (url && /^https?:\/\//i.test(url)) return { url, carrier }
  if (dhl) return { url: "https://www.dhl.com/se-sv/home/tracking/tracking-parcel.html?submit=1&tracking-id=" + encodeURIComponent(num), carrier }
  return { url: "https://tracking.postnord.com/se/?id=" + encodeURIComponent(num), carrier }
}

async function loadOrder(id: string): Promise<any | null> {
  const sets = [
    "id,display_id,status,fulfillment_status,payment_status,created_at,currency_code,total,metadata,*items,*fulfillments,*fulfillments.labels",
    "id,display_id,status,fulfillment_status,payment_status,created_at,currency_code,total,metadata,*items,*fulfillments",
    "",
  ]
  for (const f of sets) {
    try {
      const url = BACKEND + "/store/orders/" + encodeURIComponent(id) + (f ? "?fields=" + encodeURIComponent(f) : "")
      const r = await fetch(url, { headers: { "x-publishable-api-key": PUBKEY }, cache: "no-store" })
      if (r.ok) {
        const j = await r.json()
        if (j && j.order) return j.order
      }
    } catch {}
  }
  return null
}

function buildResult(num: string, lookup: any, o: any | null): Result {
  const m: any = (o && o.metadata) || {}
  const fs: any[] = (o && Array.isArray(o.fulfillments)) ? o.fulfillments : []
  const fstat = str(o && o.fulfillment_status)
  const flik = str(m.orderflik).toLowerCase()
  const wstat = str(m.wiki_status).toLowerCase()

  const canceled = str(o && o.status) === "canceled" || flik.indexOf("makuler") === 0 || wstat.indexOf("makuler") === 0 || isTrue(m.makulerad) || isTrue(m.wiki_cancelled)

  const tracking: { number: string; url: string; carrier: string }[] = []
  const method = str(m.wiki_shipping_method) + " " + str(m.wiki_shipping_desc)
  const addTracking = (n: string, u: string) => {
    if (!n && !u) return
    if (tracking.some((t) => (n && t.number === n) || (u && t.url === u))) return
    const l = trackingLink(n, u, method)
    tracking.push({ number: n, url: l.url, carrier: l.carrier })
  }
  addTracking(str(m.tracking_number || m.sparnummer), str(m.tracking_url || m.sparlank))
  for (const f of fs) {
    const labels: any[] = Array.isArray(f && f.labels) ? f.labels : []
    for (const lb of labels) addTracking(str(lb.tracking_number), str(lb.tracking_url))
  }

  const delivered = ["delivered", "partially_delivered"].includes(fstat) || fs.some((f) => f && f.delivered_at)
  const shipped = delivered || ["shipped", "partially_shipped"].includes(fstat) || fs.some((f) => f && f.shipped_at) || tracking.length > 0 || isTrue(m.wiki_shipped) || flik === "arkiverade"
  const processing = shipped || ["fulfilled", "partially_fulfilled"].includes(fstat) || ["captured", "partially_captured"].includes(str(o && o.payment_status)) || isTrue(m.wiki_paid) || (flik !== "" && flik !== "nya")

  const src: any[] = (o && Array.isArray(o.items) && o.items.length) ? o.items : (lookup.items || [])
  const lines: Line[] = src.map((it: any, i: number) => ({
    id: str(it.id) || String(i),
    title: str(it.product_title || it.title) || "Vara",
    variant: str(it.variant_title) && str(it.variant_title) !== "Default variant" ? str(it.variant_title) : "",
    quantity: Number(it.quantity) || 1,
    thumbnail: str(it.thumbnail),
  }))

  let total = ""
  if (o && typeof o.total === "number") {
    try {
      total = new Intl.NumberFormat("sv-SE", { style: "currency", currency: str(o.currency_code).toUpperCase() || "SEK", maximumFractionDigits: 0 }).format(o.total)
    } catch {}
  }

  const createdRaw = str(m.wiki_order_time) || str((o && o.created_at) || lookup.created_at)
  let created = ""
  if (createdRaw) {
    const d = new Date(createdRaw.replace(" ", "T"))
    if (!isNaN(d.getTime())) created = d.toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" })
  }

  return {
    number: num,
    created,
    step: shipped ? 3 : processing ? 2 : 1,
    delivered,
    canceled,
    lines,
    tracking,
    total,
  }
}

export default function OrderTracker() {
  const [order, setOrder] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [error, setError] = useState("")
  const [result, setResult] = useState<Result | null>(null)
  const fails = useRef(0)
  const lockedUntil = useRef(0)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    const num = order.trim().replace(/^#/, "")
    const mail = email.trim()
    if (!num || !/^\S+@\S+\.\S+$/.test(mail)) {
      setStatus("error")
      setError("Fyll i ditt ordernummer och e-postadressen du handlade med.")
      return
    }
    if (Date.now() < lockedUntil.current) {
      setStatus("error")
      setError("Du har gjort många försök i rad. Vänta en minut och försök igen.")
      return
    }
    setStatus("loading")
    try {
      const r = await fetch(BACKEND + "/store/order-lookup?order=" + encodeURIComponent(num) + "&email=" + encodeURIComponent(mail), { headers: { "x-publishable-api-key": PUBKEY }, cache: "no-store" })
      if (r.status === 429) {
        setStatus("error")
        setError("Du har gjort många försök i rad. Vänta en minut och försök igen.")
        return
      }
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok || !j.order) {
        fails.current += 1
        if (fails.current >= MAX_TRIES) {
          lockedUntil.current = Date.now() + LOCK_MS
          fails.current = 0
        }
        setStatus("error")
        setError(r.status >= 500 ? "Något gick fel hos oss. Försök igen om en stund." : "Vi hittade ingen order som matchar. Kontrollera ordernumret och att du använder samma e-post som vid köpet.")
        return
      }
      fails.current = 0
      const full = j.order.id ? await loadOrder(j.order.id) : null
      setResult(buildResult(num, j.order, full))
      setStatus("idle")
    } catch {
      setStatus("error")
      setError("Vi kunde inte nå servern. Kontrollera din uppkoppling och försök igen.")
    }
  }

  const reset = () => {
    setResult(null)
    setOrder("")
    setEmail("")
    setStatus("idle")
    setError("")
  }

  const inputCls = "w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none focus:border-[#D10000] focus:ring-2 focus:ring-red-100 transition"

  return (
    <div className="bg-white">
      <div className="content-container pt-10 pb-16 lg:pt-14 lg:pb-24">
        <nav className="text-sm text-gray-400 mb-6">
          <LocalizedClientLink href="/" className="hover:text-gray-700">Hem</LocalizedClientLink>
          <span className="mx-2">/</span>
          <span className="text-gray-600">Spåra order</span>
        </nav>
        <div className="max-w-2xl">
          <p className="text-xs font-semibold text-[#D10000] uppercase tracking-widest mb-3">Kundtjänst</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight">Spåra din order</h1>
          <p className="mt-3 text-base sm:text-lg text-gray-600 leading-relaxed">Skriv in ordernumret och e-postadressen du handlade med, så ser du var din beställning är just nu.</p>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-3 rounded-2xl border border-gray-200 p-5 sm:p-8">
            {!result ? (
              <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
                <div>
                  <label htmlFor="os-order" className="block text-sm font-medium text-gray-900 mb-1.5">Ordernummer</label>
                  <input id="os-order" value={order} onChange={(e) => setOrder(e.target.value)} inputMode="numeric" autoComplete="off" placeholder="t.ex. 69358" className={inputCls} />
                  <p className="mt-1.5 text-xs text-gray-500">Du hittar det i orderbekräftelsen vi mejlade dig.</p>
                </div>
                <div>
                  <label htmlFor="os-email" className="block text-sm font-medium text-gray-900 mb-1.5">E-postadress</label>
                  <input id="os-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="din@epost.se" className={inputCls} />
                </div>
                {status === "error" && error && (
                  <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-[#B00000]">{error}</p>
                )}
                <button type="submit" disabled={status === "loading"} className="w-full rounded-xl bg-[#D10000] py-3.5 text-white font-semibold hover:bg-[#b00000] transition disabled:opacity-60">
                  {status === "loading" ? "Letar efter din order…" : "Visa orderstatus"}
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Order {result.number}</h2>
                    {result.created && <p className="text-sm text-gray-500 mt-0.5">Lagd {result.created}</p>}
                  </div>
                  <button onClick={reset} className="text-sm font-medium text-[#D10000] hover:underline">Sök en annan order</button>
                </div>

                {result.canceled ? (
                  <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700 leading-relaxed">
                    Den här ordern är makulerad. Har du frågor om den, eller tror du att något blivit fel, hör av dig så reder vi ut det.
                  </div>
                ) : (
                  <ol className="grid grid-cols-3 gap-2">
                    {STEPS.map(([t, d], i) => {
                      const n = i + 1
                      const done = n <= result.step
                      const label = n === 3 && result.delivered ? "Levererad" : t
                      return (
                        <li key={t} className="flex flex-col items-center text-center">
                          <div className="relative flex w-full items-center justify-center">
                            {i > 0 && <span className={"absolute right-1/2 top-1/2 h-0.5 w-full -translate-y-1/2 " + (done ? "bg-[#D10000]" : "bg-gray-200")} />}
                            <span className={"relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold " + (done ? "bg-[#D10000] text-white" : "bg-gray-100 text-gray-400")}>
                              {done ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              ) : n}
                            </span>
                          </div>
                          <span className={"mt-2 text-sm font-semibold " + (done ? "text-gray-900" : "text-gray-400")}>{label}</span>
                          <span className="hidden sm:block mt-0.5 text-xs text-gray-500 leading-snug px-1">{d}</span>
                        </li>
                      )
                    })}
                  </ol>
                )}

                {!result.canceled && (
                  <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700 leading-relaxed">
                    {result.step === 3
                      ? result.delivered
                        ? "Paketet har kommit fram. Hoppas du blir nöjd!"
                        : result.tracking.length
                          ? "Paketet har lämnat oss. Följ det hela vägen med länken nedan."
                          : "Paketet har lämnat oss. Spårningsnumret finns i mejlet vi skickade när ordern gick iväg."
                      : result.step === 2
                        ? "Vi jobbar med din order. Du får ett mejl med spårningslänk så fort paketet skickas."
                        : "Vi har tagit emot din beställning. Du får ett mejl när vi börjar packa och när paketet skickas."}
                  </div>
                )}

                {result.tracking.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {result.tracking.map((t, i) => (
                      <a key={i} href={t.url} target="_blank" rel="noopener noreferrer" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3 hover:border-[#D10000] transition">
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-gray-900">Spåra hos {t.carrier}</span>
                          {t.number && <span className="block text-xs text-gray-500 break-all">Kollinummer {t.number}</span>}
                        </span>
                        <span className="text-sm font-semibold text-[#D10000]">Öppna spårning</span>
                      </a>
                    ))}
                  </div>
                )}

                {result.lines.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Innehåll</h3>
                    <ul className="divide-y divide-gray-100 border-y border-gray-100">
                      {result.lines.map((l) => (
                        <li key={l.id} className="flex items-center gap-3 py-3">
                          {l.thumbnail ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={l.thumbnail} alt="" className="h-12 w-12 flex-none rounded-lg border border-gray-100 object-contain bg-white" />
                          ) : (
                            <span className="h-12 w-12 flex-none rounded-lg bg-gray-100" />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm text-gray-900 break-words">{l.title}</span>
                            {l.variant && <span className="block text-xs text-gray-500">{l.variant}</span>}
                          </span>
                          <span className="flex-none text-sm text-gray-600">{l.quantity} st</span>
                        </li>
                      ))}
                    </ul>
                    {result.total && (
                      <p className="mt-3 flex justify-between text-sm"><span className="text-gray-600">Totalt</span><span className="font-semibold text-gray-900">{result.total}</span></p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="rounded-2xl border border-gray-200 p-5 sm:p-6">
              <h2 className="font-semibold text-gray-900">Bra att veta</h2>
              <ul className="mt-3 space-y-2.5 text-sm text-gray-600 leading-relaxed">
                <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#D10000]" /><span>Vi skickar med PostNord eller DHL. Normal leveranstid är cirka 3 vardagar.</span></li>
                <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#D10000]" /><span>När paketet lämnar oss får du ett mejl med spårningsnummer.</span></li>
                <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#D10000]" /><span>Hämta ut paketet inom 6 dagar från att det kommit till ombudet.</span></li>
              </ul>
            </div>
            <div className="rounded-2xl bg-gray-50 p-5 sm:p-6 text-sm text-gray-600 leading-relaxed">
              <p className="font-semibold text-gray-900 mb-1">Behöver du hjälp?</p>
              <p>Mejla <a href="mailto:info@teknikhouse.se" className="text-[#D10000] font-medium hover:underline">info@teknikhouse.se</a> med ditt ordernummer, så svarar vi oftast samma dag.</p>
              <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
                <LocalizedClientLink href="/return" className="text-[#D10000] font-medium hover:underline">Anmäl retur</LocalizedClientLink>
                <LocalizedClientLink href="/contact" className="text-[#D10000] font-medium hover:underline">Kontakta oss</LocalizedClientLink>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
