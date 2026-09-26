"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { sdk } from "@lib/config"

/*
   Sök med förslag medan man skriver. Öppnas från sökikonen i sidhuvudet
   (/search). Frågar backendens sökmotor (/store/search) 150 ms efter sista
   tangenttrycket och visar modeller/kategorier, de sex bästa produkterna med
   bild och pris samt en länk till alla träffar. Piltangenter och Enter
   fungerar. På mobil täcker den hela skärmen.
*/

type Hit = { id: string; title: string; href: string; thumbnail: string | null; price: number | null; in_stock: boolean }
type Cat = { id: string; name: string; path: string; count: number }
type Res = { q: string; count: number; hits: Hit[]; categories: Cat[] }
type Opt = { kind: "cat" | "hit" | "all" | "recent"; href: string; label: string }

const RECENT_KEY = "th:recent-searches"
const POPULAR = ["iPhone 13 skärm", "iPhone 11 batteri", "Galaxy S21 skärm", "iPhone 12 baksida", "Laddkabel USB-C", "iPad batteri"]
const CACHE = new Map<string, Res>()

const kr = (n: number | null) => (n === null || !isFinite(n) ? "" : Math.round(n).toLocaleString("sv-SE") + " kr")
const resultsHref = (q: string) => "/results/" + encodeURIComponent(q.trim())

const CSS = `
.ths{position:fixed;inset:0;z-index:80;font-family:system-ui,"SF Pro Text",Inter,"Segoe UI",Arial,sans-serif;color:#1b1714}
.ths *{box-sizing:border-box}
.ths .r{font-family:"Poppins",ui-rounded,"SF Pro Rounded","Segoe UI",system-ui,sans-serif}
.ths-bg{position:absolute;inset:0;background:rgba(27,23,20,.45);backdrop-filter:blur(3px);animation:thsf .18s ease}
.ths-panel{position:relative;margin:72px auto 0;width:min(720px,calc(100% - 32px));background:#fff;border-radius:20px;box-shadow:0 30px 80px -20px rgba(27,23,20,.45);display:flex;flex-direction:column;max-height:calc(100vh - 110px);overflow:hidden;animation:thsin .2s cubic-bezier(.2,.8,.2,1)}
.ths-bar{display:flex;align-items:center;gap:10px;padding:12px 12px 12px 18px;border-bottom:1px solid #efeae5;flex:0 0 auto}
.ths-bar svg{width:20px;height:20px;stroke:#9a9187;fill:none;stroke-width:2.2;flex:0 0 auto}
.ths-in{flex:1;min-width:0;height:46px;border:0;outline:none;background:transparent;font-size:17px;font-weight:600;color:#1b1714}
.ths-in::placeholder{color:#9a9187;font-weight:500}
.ths-in::-webkit-search-cancel-button{display:none}
.ths-x{height:40px;padding:0 14px;border-radius:999px;border:0;background:#f5f2ee;color:#1b1714;font-weight:600;font-size:14px;cursor:pointer;flex:0 0 auto}
.ths-x:hover{background:#efeae5}
.ths-body{overflow:auto;overscroll-behavior:contain;padding:8px 8px 12px;flex:1 1 auto}
.ths-h{padding:12px 12px 6px;font-size:11.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#9a9187}
.ths-chips{display:flex;flex-wrap:wrap;gap:8px;padding:4px 10px 8px}
.ths-chip{display:inline-flex;align-items:center;gap:6px;height:38px;padding:0 14px;border-radius:999px;border:1.5px solid #e6e0da;background:#fff;font-size:14px;font-weight:600;color:#2c2621;cursor:pointer;text-decoration:none}
.ths-chip span{color:#9a9187;font-weight:500}
.ths-chip:hover,.ths-chip[aria-selected=true]{border-color:#1b1714}
.ths-it{display:grid;grid-template-columns:56px 1fr auto;gap:12px;align-items:center;padding:7px 10px;border-radius:12px;text-decoration:none;color:#1b1714;cursor:pointer}
.ths-it[aria-selected=true],.ths-it:hover{background:#faf6f3}
.ths-it img,.ths-it .ph{width:56px;height:56px;border-radius:10px;object-fit:contain;background:#faf8f6;display:block}
.ths-it .t{font-size:14px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ths-it .p{font-weight:600;font-size:14.5px;white-space:nowrap;text-align:right}
.ths-it .o{display:block;font-weight:500;font-size:11.5px;color:#9a9187}
.ths-it .ok{display:block;font-weight:500;font-size:11.5px;color:#1a9d55}
.ths-all{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:8px 4px 0;padding:14px 16px;border-radius:13px;background:#1b1714;color:#fff!important;font-weight:600;font-size:14.5px;text-decoration:none;cursor:pointer}
.ths-all[aria-selected=true],.ths-all:hover{background:#F50000}
.ths-empty{padding:22px 14px;font-size:14.5px;color:#6f685f;line-height:1.55}
.ths-sk{height:70px;margin:4px 6px;border-radius:12px;background:linear-gradient(90deg,#f5f2ee 25%,#fbfaf8 50%,#f5f2ee 75%);background-size:200% 100%;animation:thssh 1.2s linear infinite}
.ths-foot{padding:10px 16px;border-top:1px solid #efeae5;font-size:12.5px;color:#9a9187;flex:0 0 auto}
.ths-foot kbd{font-family:inherit;border:1px solid #e6e0da;border-bottom-width:2px;border-radius:5px;padding:0 5px;font-size:11.5px;color:#6f685f}
@keyframes thsf{from{opacity:0}}
@keyframes thsin{from{opacity:0;transform:translateY(-8px) scale(.99)}}
@keyframes thssh{to{background-position:-200% 0}}
@media (max-width:640px){
.ths-panel{margin:0;width:100%;height:100%;max-height:none;border-radius:0;box-shadow:none;animation:none}
.ths-bg{display:none}
.ths-bar{padding:10px 10px 10px 14px;padding-top:calc(10px + env(safe-area-inset-top))}
.ths-in{font-size:16px}
.ths-foot{display:none}
.ths-body{padding-bottom:calc(16px + env(safe-area-inset-bottom))}
}
@media (prefers-reduced-motion:reduce){.ths *{animation:none!important}}
`

export default function SearchModal() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const seq = useRef(0)
  const [value, setValue] = useState("")
  const [res, setRes] = useState<Res | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [active, setActive] = useState(-1)
  const [recent, setRecent] = useState<string[]>([])

  const q = value.trim()

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]")
      if (Array.isArray(r)) setRecent(r.filter((x) => typeof x === "string").slice(0, 6))
    } catch {
      setRecent([])
    }
  }, [])

  const remember = (term: string) => {
    const t = term.trim()
    if (!t) return
    try {
      const next = [t, ...recent.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 6)
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch {
      /* privat läge */
    }
  }

  const close = () => {
    if (window.history.length > 1) router.back()
    else router.push("/")
  }

  const go = (href: string, term?: string) => {
    if (term) remember(term)
    router.replace(href)
  }

  useEffect(() => {
    if (q.length < 2) {
      seq.current++
      setRes(null)
      setLoading(false)
      setFailed(false)
      return
    }
    const key = q.toLowerCase()
    const hit = CACHE.get(key)
    if (hit) {
      setRes(hit)
      setLoading(false)
      return
    }
    setLoading(true)
    const my = ++seq.current
    const t = window.setTimeout(async () => {
      try {
        const r = await sdk.client.fetch<Res>("/store/search", {
          method: "GET",
          query: { q, limit: 6, prefix: 1 },
        })
        const clean: Res = { q, count: Number(r?.count) || 0, hits: r?.hits || [], categories: r?.categories || [] }
        CACHE.set(key, clean)
        if (my === seq.current) {
          setRes(clean)
          setFailed(false)
          setLoading(false)
        }
      } catch {
        if (my === seq.current) {
          setFailed(true)
          setLoading(false)
        }
      }
    }, 150)
    return () => window.clearTimeout(t)
  }, [q])

  const opts: Opt[] = useMemo(() => {
    if (q.length < 2) return recent.map((r) => ({ kind: "recent" as const, href: resultsHref(r), label: r }))
    if (!res) return []
    const o: Opt[] = []
    for (const c of res.categories.slice(0, 4)) o.push({ kind: "cat", href: c.path, label: c.name })
    for (const h of res.hits) o.push({ kind: "hit", href: h.href, label: h.title })
    if (res.count > 0) o.push({ kind: "all", href: resultsHref(q), label: q })
    return o
  }, [q, res, recent])

  useEffect(() => {
    setActive(-1)
  }, [q, res])

  useEffect(() => {
    if (active < 0) return
    const el = bodyRef.current?.querySelector('[data-i="' + active + '"]') as HTMLElement | null
    if (el) el.scrollIntoView({ block: "nearest" })
  }, [active])

  useEffect(() => {
    inputRef.current?.focus()
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") close()
    }
    window.addEventListener("keydown", handleEsc)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = prev
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (opts.length) setActive((a) => (a + 1) % opts.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (opts.length) setActive((a) => (a <= 0 ? opts.length - 1 : a - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const o = active >= 0 ? opts[active] : null
      if (o) go(o.href, o.kind === "recent" ? o.label : q)
      else if (q) go(resultsHref(q), q)
    }
  }

  let idx = -1
  const next = () => ++idx

  const catOpts = res && q.length >= 2 ? res.categories.slice(0, 4) : []
  const hitOpts = res && q.length >= 2 ? res.hits : []

  return (
    <div className="ths" role="dialog" aria-modal="true" aria-label="Sök produkter">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ths-bg" onClick={close} />
      <div className="ths-panel" data-testid="search-modal-container">
        <form
          className="ths-bar"
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            if (q) go(resultsHref(q), q)
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            className="ths-in r"
            type="search"
            enterKeyHint="search"
            role="combobox"
            aria-expanded={opts.length > 0}
            aria-controls="ths-list"
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? "ths-o-" + active : undefined}
            aria-label="Sök"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Sök modell, del eller artikelnummer"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            data-testid="search-input"
          />
          <button type="button" className="ths-x r" onClick={close}>
            Stäng
          </button>
        </form>

        <div className="ths-body" ref={bodyRef} id="ths-list" role="listbox" aria-label="Förslag">
          {q.length < 2 ? (
            <>
              {recent.length ? (
                <>
                  <div className="ths-h r">Dina senaste sökningar</div>
                  <div className="ths-chips">
                    {recent.map((r) => {
                      const i = next()
                      return (
                        <a
                          key={"r" + r}
                          id={"ths-o-" + i}
                          data-i={i}
                          role="option"
                          aria-selected={i === active}
                          className="ths-chip"
                          href={resultsHref(r)}
                          onClick={(e) => {
                            e.preventDefault()
                            go(resultsHref(r), r)
                          }}
                        >
                          {r}
                        </a>
                      )
                    })}
                  </div>
                </>
              ) : null}
              <div className="ths-h r">Andra söker ofta på</div>
              <div className="ths-chips">
                {POPULAR.map((p) => (
                  <button key={p} type="button" className="ths-chip" onClick={() => setValue(p)}>
                    {p}
                  </button>
                ))}
              </div>
              <div className="ths-empty">Skriv modellen och delen du letar efter, till exempel &quot;iPhone 13 skärm&quot; eller &quot;s21 batteri&quot;. Artikelnummer och EAN fungerar också.</div>
            </>
          ) : failed && !res ? (
            <div className="ths-empty">
              Förslagen kunde inte laddas just nu. Tryck Enter för att söka i hela sortimentet.
            </div>
          ) : !res ? (
            <>
              <div className="ths-sk" />
              <div className="ths-sk" />
              <div className="ths-sk" />
            </>
          ) : res.count === 0 && !catOpts.length ? (
            <div className="ths-empty">
              Vi hittar inget för &quot;{q}&quot;. Prova att bara skriva modellen, till exempel &quot;iPhone 13&quot;, eller kolla stavningen.
            </div>
          ) : (
            <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity .15s" }}>
              {catOpts.length ? (
                <>
                  <div className="ths-h r">Modeller och kategorier</div>
                  <div className="ths-chips">
                    {catOpts.map((c) => {
                      const i = next()
                      return (
                        <a
                          key={c.id}
                          id={"ths-o-" + i}
                          data-i={i}
                          role="option"
                          aria-selected={i === active}
                          className="ths-chip r"
                          href={c.path}
                          onClick={(e) => {
                            e.preventDefault()
                            go(c.path, q)
                          }}
                        >
                          {c.name} <span>{c.count}</span>
                        </a>
                      )
                    })}
                  </div>
                </>
              ) : null}
              {hitOpts.length ? (
                <>
                  <div className="ths-h r">Produkter</div>
                  {hitOpts.map((h) => {
                    const i = next()
                    return (
                      <a
                        key={h.id}
                        id={"ths-o-" + i}
                        data-i={i}
                        role="option"
                        aria-selected={i === active}
                        className="ths-it"
                        href={h.href}
                        onMouseMove={() => active !== i && setActive(i)}
                        onClick={(e) => {
                          e.preventDefault()
                          go(h.href, q)
                        }}
                      >
                        {h.thumbnail ? <img src={h.thumbnail} alt="" width={56} height={56} loading="lazy" /> : <span className="ph" />}
                        <span className="t">{h.title}</span>
                        <span className="p r">
                          {kr(h.price)}
                          {h.in_stock ? <span className="ok">I lager</span> : <span className="o">Tillfälligt slut</span>}
                        </span>
                      </a>
                    )
                  })}
                </>
              ) : null}
              {res.count > 0 ? (
                <a
                  id={"ths-o-" + (idx + 1)}
                  data-i={idx + 1}
                  role="option"
                  aria-selected={idx + 1 === active}
                  className="ths-all r"
                  href={resultsHref(q)}
                  onClick={(e) => {
                    e.preventDefault()
                    go(resultsHref(q), q)
                  }}
                >
                  <span>
                    Visa alla {res.count.toLocaleString("sv-SE")} {res.count === 1 ? "träff" : "träffar"}
                  </span>
                  <span aria-hidden="true">→</span>
                </a>
              ) : null}
            </div>
          )}
        </div>
        <div className="ths-foot">
          <kbd>↑</kbd> <kbd>↓</kbd> för att välja, <kbd>Enter</kbd> för att öppna, <kbd>Esc</kbd> för att stänga
        </div>
      </div>
    </div>
  )
}
