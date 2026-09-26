"use client"

import { FormEvent, useState } from "react"

// "Finns ej i lagret" + "Bevaka produkt" (same texts as the Wiki shop).
// Posts to /store/lagerbevakning. No e-mail is sent at signup.

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUBKEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

const CSS = `
.bevaka{margin-top:4px;border:1px solid #f1c9c9;background:#fff7f7;border-radius:16px;padding:14px 16px}
.bevaka .oos{display:flex;align-items:center;gap:8px;color:#c0392b;font-weight:700;font-size:15px}
.bevaka .oos svg{width:18px;height:18px;stroke:#c0392b;stroke-width:2.5;fill:none}
.bevaka .h{display:block;margin-top:10px;font-size:14px;color:#222}
.bevaka .t{margin:4px 0 10px;font-size:13px;color:#444;line-height:1.45}
.bevaka form{display:flex;gap:8px;flex-wrap:wrap}
.bevaka input[type=email]{flex:1 1 180px;min-width:0;border:1.5px solid #e6e0da;border-radius:12px;padding:0 12px;height:46px;font-size:16px;background:#fff}
.bevaka button{flex:0 0 auto;border:0;border-radius:12px;background:#1b1714;color:#fff;font-weight:600;padding:0 20px;height:46px;font-size:15px;cursor:pointer}
.bevaka button[disabled]{opacity:.6;cursor:default}
.bevaka .st{margin-top:10px;font-size:13px;border-radius:10px;padding:8px 10px}
.bevaka .ok{background:#e8f6ea;color:#1d6b2c}
.bevaka .warn{background:#fff4dc;color:#7a5600}
.bevaka .err{background:#fde8e8;color:#a61b1b}
@media(max-width:420px){.bevaka button{flex:1 1 100%}}
.bevaka .hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
`

export default function BevakaProdukt({ productId, variantId }: { productId: string; variantId?: string }) {
  const [email, setEmail] = useState("")
  const [hp, setHp] = useState("")
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ kind: "ok" | "warn" | "err"; text: string } | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const v = email.trim()
    if (!v || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v)) {
      setStatus({ kind: "err", text: "Du måste ange en giltig e-postadress." })
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      const r = await fetch(BACKEND + "/store/lagerbevakning", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PUBKEY },
        body: JSON.stringify({
          email: v,
          product_id: productId,
          variant_id: variantId || undefined,
          page_url: typeof window !== "undefined" ? window.location.pathname : undefined,
          website: hp || undefined,
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (j.result === "OK") {
        setEmail("")
        setStatus({ kind: "ok", text: "Tack för intresset! Vi meddelar dig när produkten finns tillgänglig igen!" })
      } else if (j.result === "IS-SUBSCRIBER") {
        setStatus({ kind: "warn", text: "Den angivna e-postadressen är redan registrerad!" })
      } else if (j.result === "ERR-EMAIL") {
        setStatus({ kind: "err", text: "Du måste ange en giltig e-postadress." })
      } else {
        setStatus({ kind: "err", text: j.error || "Något gick fel. Försök igen." })
      }
    } catch {
      setStatus({ kind: "err", text: "Något gick fel. Försök igen." })
    }
    setBusy(false)
  }

  return (
    <div className="bevaka" data-testid="bevaka-produkt">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="oos">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
        <span>Finns ej i lagret</span>
      </div>
      <strong className="h">Bevaka produkt</strong>
      <p className="t">Ange din e-postadress nedan så meddelar vi dig när produkten finns i lager!</p>
      <form onSubmit={submit} noValidate>
        <input
          type="email"
          placeholder="E-postadress"
          aria-label="E-postadress"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={200}
          autoComplete="email"
        />
        <div className="hp" aria-hidden="true">
          <input type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
        </div>
        <button type="submit" disabled={busy}>{busy ? "Skickar…" : "Bevaka"}</button>
      </form>
      {status && <div className={"st " + status.kind} role="status">{status.text}</div>}
    </div>
  )
}
