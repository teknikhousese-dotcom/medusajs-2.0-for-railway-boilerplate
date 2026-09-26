"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { sdk } from "@lib/config"
import { getProductPrice } from "@lib/util/get-product-price"
import { PART_TYPES, foldText, partIndexOf } from "./device-parts"

/*
  Enhetsvisningen till höger i startsidans hero. Visar riktiga produktbilder
  för den telefon som valts i "Hitta rätt del", med delar, antal och
  lägsta pris. Utan vald telefon roterar den mellan populära modeller.
  Väljaren och visningen delar ett litet klientlager (deviceStore) och
  skickar dessutom händelsen "th:device-change" på window.
*/

export type DVModel = { id: string; n: string; bn: string; b: string; path: string; k: number[]; c: number }
export type DVItem = {
  id: string
  t: string
  href: string
  img: string | null
  price: string | null
  oos: boolean
  pi: number
  amt: number
}
export type DVState = {
  model: DVModel | null
  part: number
  popular: DVModel[]
  savedId: string | null
  regionId: string | null
  src: string
  v: number
}

const INITIAL: DVState = { model: null, part: -1, popular: [], savedId: null, regionId: null, src: "", v: 0 }
let STATE: DVState = INITIAL
const LISTENERS = new Set<() => void>()

export const deviceStore = {
  get(): DVState {
    return STATE
  },
  set(patch: Partial<DVState>, src: string) {
    STATE = { ...STATE, ...patch, src, v: STATE.v + 1 }
    LISTENERS.forEach((l) => {
      try {
        l()
      } catch {
        /* en trasig lyssnare får inte stoppa de andra */
      }
    })
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(
          new CustomEvent("th:device-change", {
            detail: { id: STATE.model ? STATE.model.id : null, n: STATE.model ? STATE.model.n : null, part: STATE.part, src },
          })
        )
      } catch {
        /* gamla webbläsare */
      }
    }
  },
  subscribe(l: () => void) {
    LISTENERS.add(l)
    return () => {
      LISTENERS.delete(l)
    }
  },
}

const getServerState = () => INITIAL

/* Ord per deltyp: singular, plural och sökord för /results. */
export const PART_WORDS: [string, string, string][] = [
  ["skärm", "skärmar", "skärm"],
  ["batteri", "batterier", "batteri"],
  ["baksida", "baksidor", "baksida"],
  ["kamera", "kameror", "kamera"],
  ["laddkontakt", "laddkontakter", "laddkontakt"],
  ["högtalare", "högtalare", "högtalare"],
  ["knapp eller flexkabel", "knappar och flexkablar", "flex"],
  ["tejp", "tejp och lim", "tejp"],
  ["övrig del", "övriga delar", ""],
]

export const partCountLabel = (i: number, n: number) => {
  const w = PART_WORDS[i] || PART_WORDS[8]
  return n + " " + (n === 1 ? w[0] : w[1])
}

export const partSearchHref = (modelName: string, i: number) => {
  const w = PART_WORDS[i] || PART_WORDS[8]
  return "/results/" + encodeURIComponent((modelName + " " + w[2]).trim())
}

export const partCtaLabel = (modelName: string, i: number, n: number) => {
  const w = PART_WORDS[i] || PART_WORDS[8]
  return "Visa " + w[1] + " till " + modelName + (n > 0 ? " (" + n + ")" : "")
}

const ITEMS_CACHE = new Map<string, DVItem[]>()
const ITEMS_INFLIGHT = new Map<string, Promise<DVItem[]>>()

export function cachedDeviceItems(id: string, regionId?: string | null): DVItem[] | null {
  return ITEMS_CACHE.get(id + "|" + (regionId || "")) || null
}

/* Hämtar alla delar i en modellkategori. Delas av väljaren och visningen så att det bara blir ett anrop. */
export function loadDeviceItems(
  m: { id: string; n: string; bn: string; path: string },
  regionId?: string | null
): Promise<DVItem[]> {
  const key = m.id + "|" + (regionId || "")
  const hit = ITEMS_CACHE.get(key)
  if (hit) return Promise.resolve(hit)
  const pending = ITEMS_INFLIGHT.get(key)
  if (pending) return pending
  const run = (async () => {
    const res: any = await sdk.client.fetch("/store/products", {
      method: "GET",
      query: {
        category_id: [m.id],
        limit: 200,
        ...(regionId ? { region_id: regionId } : {}),
        fields: regionId
          ? "id,title,handle,thumbnail,+metadata,*variants.calculated_price"
          : "id,title,handle,thumbnail,+metadata",
      },
    } as any)
    const prefix = [foldText(m.bn + " " + m.n), foldText(m.n), foldText(m.bn)]
    const list: DVItem[] = (res && res.products ? res.products : []).map((p: any) => {
      let price: string | null = null
      let amt = 0
      try {
        const cp: any = getProductPrice({ product: p }).cheapestPrice
        price = (cp && cp.calculated_price) || null
        amt = Number((cp && cp.calculated_price_number) || 0)
      } catch {
        price = null
      }
      const title = String(p.title || "")
      let t = title
      const tf = foldText(title)
      for (const pf of prefix) {
        if (pf && tf.startsWith(pf + " ")) {
          t = title.slice(pf.length).replace(/^[\s/,:-]+/, "")
          break
        }
      }
      const md = p && p.metadata ? p.metadata : {}
      const v = md.in_stock
      return {
        id: String(p.id),
        t: t ? t.charAt(0).toUpperCase() + t.slice(1) : title,
        href: m.path + "/" + p.handle,
        img: p.thumbnail || null,
        price,
        oos: v === false || v === "false" || v === 0 || v === "0",
        pi: partIndexOf(title),
        amt,
      }
    })
    list.sort((a, b) => Number(a.oos) - Number(b.oos) || a.pi - b.pi || a.amt - b.amt)
    ITEMS_CACHE.set(key, list)
    return list
  })()
  const wrapped = run.finally(() => {
    ITEMS_INFLIGHT.delete(key)
  })
  ITEMS_INFLIGHT.set(key, wrapped)
  return wrapped
}

function cheapest(list: DVItem[]): DVItem | null {
  let best: DVItem | null = null
  for (const x of list) {
    if (x.amt > 0 && !x.oos && (best === null || x.amt < best.amt)) best = x
  }
  if (best) return best
  for (const x of list) {
    if (x.amt > 0 && (best === null || x.amt < best.amt)) best = x
  }
  return best
}

const backScore = (t: string) => {
  const f = foldText(t)
  let s = 0
  if (/komplett|mellanram|chassi|housing|med ram|ram\b/.test(f)) s += 3
  if (/glas/.test(f)) s += 1
  if (/lins|kamera|tejp|lim\b|knapp|flex|skruv/.test(f)) s -= 6
  return s
}

/* Bästa "telefonbilden": en hel baksida om den finns, annars skärmen. */
function deviceImage(items: DVItem[] | null): string | null {
  if (!items || !items.length) return null
  const withImg = items.filter((x) => !!x.img)
  const backs = withImg.filter((x) => x.pi === 2).sort((a, b) => backScore(b.t) - backScore(a.t))
  if (backs[0] && backScore(backs[0].t) >= 0) return backs[0].img
  const scr = withImg.find((x) => x.pi === 0 && !x.oos) || withImg.find((x) => x.pi === 0)
  if (scr) return scr.img
  return withImg[0] ? withImg[0].img : null
}

function partImage(items: DVItem[] | null, part: number): string | null {
  if (!items || part < 0) return null
  const list = items.filter((x) => x.pi === part && !!x.img)
  if (part === 2) list.sort((a, b) => backScore(b.t) - backScore(a.t))
  const x = list.find((y) => !y.oos) || list[0]
  return x ? x.img : null
}

const HOTSPOTS: { i: number; side: "l" | "r"; top: number }[] = [
  { i: 0, side: "l", top: 20 },
  { i: 1, side: "l", top: 52 },
  { i: 3, side: "r", top: 12 },
  { i: 2, side: "r", top: 40 },
  { i: 4, side: "r", top: 68 },
]

const SHOWCASE = ["iphone 15", "iphone 14", "iphone 13", "galaxy s24", "galaxy s23"]

const CSS = [
  ".hdv{position:relative;height:540px;border-radius:28px;overflow:hidden;display:grid;grid-template-rows:auto minmax(0,1fr) auto auto;container-type:inline-size;container-name:hdv;background:radial-gradient(115% 85% at 50% 50%,#fff 0,#fff 36%,#fff6f3 60%,#ffe6de 100%);box-shadow:0 30px 60px -26px rgba(27,23,20,.3),0 0 0 1px rgba(27,23,20,.05);color:#1b1714;font-family:system-ui,'SF Pro Text',Inter,'Segoe UI',Arial,sans-serif;isolation:isolate}",
  ".hdv *{box-sizing:border-box}",
  ".hdv .r{font-family:'Poppins',ui-rounded,'SF Pro Rounded','Segoe UI',system-ui,sans-serif}",
  ".hdv:before{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(27,23,20,.08) 1px,transparent 1.3px);background-size:18px 18px;-webkit-mask-image:radial-gradient(75% 65% at 50% 50%,transparent 45%,#000 100%);mask-image:radial-gradient(75% 65% at 50% 50%,transparent 45%,#000 100%);pointer-events:none;z-index:0}",
  ".hdv:after{content:'';position:absolute;left:50%;top:50%;width:92%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,transparent 40%,rgba(245,0,0,.07) 56%,transparent 70%);pointer-events:none;z-index:0}",
  ".hdv-hd{position:relative;z-index:3;padding:22px 24px 0;min-width:0}",
  ".hdv-ey{display:inline-flex;align-items:center;gap:8px;font-size:11.5px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:#D10000}",
  ".hdv-ey i{width:7px;height:7px;border-radius:50%;background:#F50000;box-shadow:0 0 0 4px rgba(245,0,0,.13)}",
  ".hdv-nm{font-weight:600;font-size:30px;line-height:1.12;letter-spacing:-.02em;margin:6px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
  ".hdv-nm .in{display:inline-block;animation:hdvUp .5s cubic-bezier(.2,.8,.2,1) both}",
  ".hdv-sb{font-size:13.5px;color:#6f685f;margin:2px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:20px}",
  ".hdv-tabs{display:flex;gap:4px;margin-top:12px;overflow-x:auto;scrollbar-width:none;padding:2px}",
  ".hdv-tabs::-webkit-scrollbar{display:none}",
  ".hdv-tab{flex:0 0 auto;border:0;height:30px;padding:0 12px;border-radius:999px;background:rgba(255,255,255,.75);box-shadow:0 0 0 1px rgba(27,23,20,.07);font-weight:600;font-size:12px;color:#6f685f;cursor:pointer;white-space:nowrap;position:relative;overflow:hidden;transition:background .2s,color .2s}",
  ".hdv-tab:hover{color:#1b1714}",
  ".hdv-tab[aria-selected=true]{background:#1b1714;color:#fff;box-shadow:none}",
  ".hdv-tab .bar{position:absolute;left:0;bottom:0;height:2px;background:#F50000;width:0}",
  ".hdv-tab[aria-selected=true] .bar{animation:hdvBar 5.2s linear both}",
  ".hdv.paused .hdv-tab .bar{animation-play-state:paused}",
  ".hdv-st{position:relative;z-index:2;min-height:0}",
  ".hdv-ph{position:absolute;top:3%;height:88%;width:auto;left:50%;aspect-ratio:1;max-width:62%;transform:translateX(-50%)}",
  ".hdv-tilt{position:absolute;inset:0;transform:perspective(1100px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transition:transform .7s cubic-bezier(.2,.8,.2,1);will-change:transform}",
  ".hdv-fl{position:absolute;inset:0;animation:hdvFloat 7s ease-in-out infinite}",
  ".hdv-img{position:absolute;inset:0;animation:hdvIn .65s cubic-bezier(.2,.8,.2,1) both;-webkit-mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,#000 84%,transparent 100%);mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,#000 84%,transparent 100%)}",
  ".hdv-ph:before{content:'';position:absolute;inset:-14%;border-radius:50%;background:radial-gradient(closest-side,#fff 64%,rgba(255,255,255,.85) 76%,rgba(255,255,255,0) 100%);pointer-events:none}",
  ".hdv-img img{object-fit:contain;mix-blend-mode:multiply}",
  ".hdv-art{position:absolute;inset:0;width:100%;height:100%;animation:hdvIn .65s both}",
  ".hdv-floor{position:absolute;left:50%;bottom:-3%;width:58%;height:18px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(closest-side,rgba(27,23,20,.2),rgba(27,23,20,0));animation:hdvShadow 7s ease-in-out infinite;z-index:-1}",
  ".hdv-sk{position:absolute;inset:12% 26%;border-radius:28px;background:linear-gradient(90deg,#f6f2ee 25%,#fcfbfa 50%,#f6f2ee 75%);background-size:200% 100%;animation:hdvSh 1.3s linear infinite}",
  ".hdv-hs{position:absolute;z-index:4;display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 13px 0 11px;border-radius:999px;border:0;background:rgba(255,255,255,.93);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 10px 24px -10px rgba(27,23,20,.3),0 0 0 1px rgba(27,23,20,.07);font-weight:600;font-size:12.5px;color:#1b1714;cursor:pointer;white-space:nowrap;transition:transform .2s,background .2s,color .2s,box-shadow .2s,opacity .2s;animation:hdvPop .5s cubic-bezier(.2,.8,.2,1) both}",
  ".hdv-hs.sl{left:4%}",
  ".hdv-hs.sr{right:4%}",
  ".hdv-hs.sl:after,.hdv-hs.sr:after{content:'';position:absolute;top:50%;width:26px;border-top:1.5px dashed rgba(27,23,20,.22)}",
  ".hdv-hs.sl:after{left:100%}",
  ".hdv-hs.sr:after{right:100%}",
  ".hdv-hs .d{width:9px;height:9px;border-radius:50%;background:#F50000;position:relative;flex:0 0 auto}",
  ".hdv-hs .d:after{content:'';position:absolute;inset:-5px;border-radius:50%;border:2px solid rgba(245,0,0,.35);animation:hdvPulse 2.4s ease-out infinite}",
  ".hdv-hs .c{color:#9a9187;font-weight:500}",
  ".hdv-hs:hover{transform:translateY(-2px);box-shadow:0 14px 28px -10px rgba(27,23,20,.35),0 0 0 1px rgba(27,23,20,.1)}",
  ".hdv-hs[aria-pressed=true]{background:#F50000;color:#fff;box-shadow:0 14px 30px -10px rgba(245,0,0,.6)}",
  ".hdv-hs[aria-pressed=true] .d{background:#fff}",
  ".hdv-hs[aria-pressed=true] .d:after{border-color:rgba(255,255,255,.6)}",
  ".hdv-hs[aria-pressed=true] .c{color:rgba(255,255,255,.85)}",
  ".hdv-hs.dim{opacity:.6}",
  ".hdv-row{display:none;position:relative;z-index:3;gap:7px;overflow-x:auto;padding:4px 16px 8px;scrollbar-width:none}",
  ".hdv-row::-webkit-scrollbar{display:none}",
  ".hdv-row .hdv-hs{position:relative;flex:0 0 auto;left:auto;right:auto;top:auto!important}",
  ".hdv-row .hdv-hs:after{display:none}",
  ".hdv-ft{position:relative;z-index:5;margin:0 16px 16px;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 12px 12px 18px;border-radius:18px;background:rgba(255,255,255,.88);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:0 14px 30px -14px rgba(27,23,20,.28),0 0 0 1px rgba(27,23,20,.06)}",
  ".hdv-pr{min-width:0}",
  ".hdv-pr b{display:block;font-weight:600;font-size:16px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
  ".hdv-pr b em{font-style:normal;color:#D10000}",
  ".hdv-pr span{display:block;font-size:12.5px;color:#6f685f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
  ".hdv-cta{flex:0 1 auto;min-width:0;max-width:64%;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:46px;padding:0 18px;border-radius:13px;border:0;background:#F50000;color:#fff;font-weight:600;font-size:14px;cursor:pointer;text-decoration:none;transition:background .15s,transform .12s}",
  ".hdv a.hdv-cta,.hdv a.hdv-cta:hover{color:#fff;text-decoration:none}",
  ".hdv-cta:hover{background:#D10000}",
  ".hdv-cta:active{transform:scale(.98)}",
  ".hdv-cta span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}",
  ".hdv-cta svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2.4;flex:0 0 auto;transition:transform .2s}",
  ".hdv-cta:hover svg{transform:translateX(3px)}",
  ".hdv button:focus-visible,.hdv a:focus-visible{outline:2px solid #1b1714;outline-offset:2px}",
  "@keyframes hdvFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}",
  "@keyframes hdvShadow{0%,100%{transform:translateX(-50%) scale(1);opacity:1}50%{transform:translateX(-50%) scale(.86);opacity:.7}}",
  "@keyframes hdvIn{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}",
  "@keyframes hdvUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}",
  "@keyframes hdvPop{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}}",
  "@keyframes hdvPulse{0%{transform:scale(.6);opacity:1}100%{transform:scale(1.6);opacity:0}}",
  "@keyframes hdvBar{from{width:0}to{width:100%}}",
  "@keyframes hdvSh{to{background-position:-200% 0}}",
  "@media (max-width:1000px){.hdv{height:500px}}",
  "@media (max-width:520px){.hdv{height:540px;border-radius:22px}}",
  "@container hdv (max-width:500px){.hdv-hs.fl{display:none}.hdv-row{display:flex}.hdv-nm{font-size:24px}.hdv-hd{padding:18px 18px 0}.hdv-ph{top:2%;height:92%;max-width:84%}.hdv-ft{flex-direction:column;align-items:stretch;gap:10px;margin:0 12px 12px;padding:12px}.hdv-cta{max-width:none;width:100%}}",
  "@container hdv (min-width:501px) and (max-width:620px){.hdv-hs.sl{left:2%}.hdv-hs.sr{right:2%}.hdv-hs.sl:after,.hdv-hs.sr:after{width:12px}}",
  "@media (prefers-reduced-motion:reduce){.hdv *,.hdv *:before,.hdv *:after{animation:none!important;transition:none!important}.hdv-tilt{transform:none!important}}",
].join("\n")

const Arrow = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/* Illustrerad telefon som syns tills riktiga bilder har laddat. */
const PhoneArt = () => (
  <svg className="hdv-art" viewBox="0 0 400 400" aria-hidden="true">
    <defs>
      <linearGradient id="hdvBody" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4a423b" />
        <stop offset="1" stopColor="#15110e" />
      </linearGradient>
      <linearGradient id="hdvScreen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ff7a64" />
        <stop offset=".55" stopColor="#F50000" />
        <stop offset="1" stopColor="#6d0707" />
      </linearGradient>
      <linearGradient id="hdvGlare" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".38" />
        <stop offset=".45" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect x="111" y="108" width="5" height="30" rx="2.5" fill="#2c2621" />
    <rect x="111" y="150" width="5" height="46" rx="2.5" fill="#2c2621" />
    <rect x="284" y="136" width="5" height="64" rx="2.5" fill="#2c2621" />
    <rect x="115" y="24" width="170" height="352" rx="36" fill="url(#hdvBody)" />
    <rect x="123" y="32" width="154" height="336" rx="29" fill="url(#hdvScreen)" />
    <circle cx="165" cy="120" r="70" fill="#ffb199" opacity=".45" />
    <circle cx="255" cy="310" r="95" fill="#3b0000" opacity=".35" />
    <rect x="174" y="44" width="52" height="16" rx="8" fill="#0d0b09" />
    <text x="200" y="150" textAnchor="middle" fill="#fff" opacity=".92" fontSize="40" fontWeight="600" fontFamily="Poppins, system-ui, sans-serif">
      09:41
    </text>
    <rect x="123" y="32" width="154" height="336" rx="29" fill="url(#hdvGlare)" />
  </svg>
)

export default function HeroDeviceVisual() {
  const st = useSyncExternalStore(deviceStore.subscribe, deviceStore.get, getServerState)
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [itemsMap, setItemsMap] = useState<Record<string, DVItem[]>>({})
  const [broken, setBroken] = useState<Record<string, boolean>>({})
  const tiltRef = useRef<HTMLDivElement>(null)
  const raf = useRef(0)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    if (mq.addEventListener) mq.addEventListener("change", on)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", on)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  const showcase: DVModel[] = useMemo(() => {
    const pop = st.popular || []
    const out: DVModel[] = []
    if (st.savedId) {
      const s = pop.find((m) => m.id === st.savedId)
      if (s) out.push(s)
    }
    for (const name of SHOWCASE) {
      const hit = pop.find((m) => foldText(m.n) === name)
      if (hit && !out.includes(hit)) out.push(hit)
    }
    for (const m of pop) {
      if (out.length >= 5) break
      if (!out.includes(m)) out.push(m)
    }
    return out.slice(0, 6)
  }, [st.popular, st.savedId])

  const chosen = st.model
  const dm: DVModel | null = chosen || (showcase.length ? showcase[idx % showcase.length] : null)
  const part = chosen ? st.part : -1

  /* Auto-rotation bland populära modeller när ingen telefon är vald. */
  useEffect(() => {
    if (chosen || showcase.length < 2 || paused || reduced) return
    const t = window.setInterval(() => {
      if (document.hidden) return
      setIdx((i) => (i + 1) % showcase.length)
    }, 5200)
    return () => window.clearInterval(t)
  }, [chosen, showcase.length, paused, reduced, idx])

  /* Ladda delar (bilder, antal, priser) för visad modell och nästa i turordningen. */
  useEffect(() => {
    if (!dm) return
    const want: DVModel[] = [dm]
    if (!chosen && showcase.length > 1) want.push(showcase[(idx + 1) % showcase.length])
    let alive = true
    for (const m of want) {
      if (itemsMap[m.id]) continue
      loadDeviceItems(m, st.regionId)
        .then((list) => {
          if (alive) setItemsMap((prev) => (prev[m.id] ? prev : { ...prev, [m.id]: list }))
        })
        .catch(() => null)
    }
    return () => {
      alive = false
    }
  }, [dm ? dm.id : "", chosen ? chosen.id : "", idx, showcase, st.regionId])

  const items = dm ? itemsMap[dm.id] || cachedDeviceItems(dm.id, st.regionId) : null
  const loading = !!dm && !items

  const summary = useMemo(() => {
    return PART_TYPES.map((_, i) => {
      const list = items ? items.filter((x) => x.pi === i) : []
      const count = items ? list.length : dm && dm.k && dm.k[i] ? dm.k[i] : 0
      const best = cheapest(list)
      return { count, from: best ? best.price : null }
    })
  }, [items, dm])

  const total = items ? items.length : dm ? Math.max(0, dm.c) : 0
  const overall = items ? cheapest(items) : null
  const baseImg = deviceImage(items)
  const pImg = partImage(items, part)
  const rawImg = pImg || baseImg
  const img = rawImg && !broken[rawImg] ? rawImg : null

  const select = (m: DVModel, p: number) => {
    deviceStore.set({ model: m, part: p }, "visual")
  }
  const togglePart = (i: number) => {
    if (!dm) return
    if (!chosen) select(dm, i)
    else deviceStore.set({ part: part === i ? -1 : i }, "visual")
  }

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || reduced) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / Math.max(1, r.width) - 0.5
    const y = (e.clientY - r.top) / Math.max(1, r.height) - 0.5
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      const el = tiltRef.current
      if (!el) return
      el.style.setProperty("--rx", (-y * 9).toFixed(2) + "deg")
      el.style.setProperty("--ry", (x * 13).toFixed(2) + "deg")
    })
  }
  const onLeave = () => {
    cancelAnimationFrame(raf.current)
    const el = tiltRef.current
    if (el) {
      el.style.setProperty("--rx", "0deg")
      el.style.setProperty("--ry", "0deg")
    }
  }

  const eyebrow = chosen
    ? "Din telefon"
    : dm && st.savedId && dm.id === st.savedId
      ? "Senast valda"
      : dm
        ? "Populärt just nu"
        : "Reservdelar efter modell"

  const sub = dm
    ? dm.bn + (total > 0 ? " · " + total + (total === 1 ? " del" : " delar") + " i sortimentet" : "")
    : "Välj märke och modell så visar vi delarna"

  const visibleSpots = HOTSPOTS.filter((h) => !dm || summary[h.i].count > 0 || (!items && !(dm.k && dm.k.length)))

  const spot = (h: { i: number; side: "l" | "r"; top: number }, floating: boolean, n: number) => {
    const c = summary[h.i].count
    const name = PART_TYPES[h.i].n
    return (
      <button
        key={(floating ? "f" : "r") + h.i + (dm ? dm.id : "")}
        type="button"
        className={"hdv-hs r " + (floating ? "fl s" + h.side : "") + (part >= 0 && part !== h.i ? " dim" : "")}
        style={floating ? { top: h.top + "%", animationDelay: n * 60 + "ms" } : { animationDelay: n * 60 + "ms" }}
        aria-pressed={part === h.i}
        aria-label={c > 0 ? name + ", " + partCountLabel(h.i, c) : name}
        onClick={() => togglePart(h.i)}
      >
        <span className="d" aria-hidden="true" />
        {name}
        {c > 0 ? <span className="c">{c}</span> : null}
      </button>
    )
  }

  let priceLine: React.ReactNode = <>Välj din telefon</>
  let priceSub = "Vi visar bara delar som passar just din modell"
  let cta: React.ReactNode = (
    <a className="hdv-cta r" href="/mobilreservdelar">
      <span>Alla mobilreservdelar</span>
      <Arrow />
    </a>
  )
  if (dm && chosen && part >= 0) {
    const s = summary[part]
    const w = PART_WORDS[part] || PART_WORDS[8]
    const label = PART_TYPES[part] ? PART_TYPES[part].n : w[0]
    priceLine = s.from ? (
      <>
        {label} från <em>{s.from}</em>
      </>
    ) : (
      <>{label}</>
    )
    priceSub = s.count > 0 ? partCountLabel(part, s.count) + " till " + dm.n : loading ? "Hämtar delar..." : "Inga " + w[1] + " just nu"
    cta = (
      <a className="hdv-cta r" href={partSearchHref(dm.n, part)}>
        <span>{partCtaLabel(dm.n, part, s.count)}</span>
        <Arrow />
      </a>
    )
  } else if (dm && chosen) {
    priceLine = overall && overall.price ? (
      <>
        Delar från <em>{overall.price}</em>
      </>
    ) : (
      <>{dm.n}</>
    )
    priceSub = total > 0 ? total + (total === 1 ? " del" : " delar") + " till " + dm.bn + " " + dm.n : "Skärm, batteri, baksida och mer"
    cta = (
      <a className="hdv-cta r" href={dm.path}>
        <span>{"Visa delar till " + dm.n}</span>
        <Arrow />
      </a>
    )
  } else if (dm) {
    const scr = summary[0]
    priceLine = scr.from ? (
      <>
        Skärm från <em>{scr.from}</em>
      </>
    ) : overall && overall.price ? (
      <>
        Delar från <em>{overall.price}</em>
      </>
    ) : (
      <>{dm.n}</>
    )
    priceSub = total > 0 ? total + (total === 1 ? " del" : " delar") + " till " + dm.n : "Tryck för att se delarna"
    cta = (
      <button type="button" className="hdv-cta r" onClick={() => select(dm, -1)}>
        <span>{"Välj " + dm.n}</span>
        <Arrow />
      </button>
    )
  }

  const alt = dm ? (part >= 0 && PART_TYPES[part] ? PART_TYPES[part].n + " till " : "") + dm.bn + " " + dm.n : ""

  return (
    <div
      className={"hdv" + (paused ? " paused" : "")}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setPaused(true)
      }}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-label="Visning av vald telefon"
      role="region"
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="hdv-hd">
        <div className="hdv-ey r">
          <i aria-hidden="true" />
          {eyebrow}
        </div>
        <p className="hdv-nm r" aria-live="polite">
          <span className="in" key={dm ? dm.id : "none"}>
            {dm ? dm.n : "Din telefon här"}
          </span>
        </p>
        <p className="hdv-sb">{sub}</p>
        {!chosen && showcase.length > 1 ? (
          <div className="hdv-tabs" role="tablist" aria-label="Populära modeller">
            {showcase.map((m, i) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                className="hdv-tab r"
                aria-selected={i === idx % showcase.length}
                onClick={() => setIdx(i)}
              >
                {m.n}
                <span className="bar" aria-hidden="true" key={i === idx % showcase.length ? "on" + idx : "off"} />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="hdv-st" onPointerMove={onMove} onPointerLeave={onLeave}>
        <div className="hdv-ph">
          <div className="hdv-tilt" ref={tiltRef}>
            <div className="hdv-fl">
              {img ? (
                <div className="hdv-img" key={img}>
                  <Image
                    src={img}
                    alt={alt}
                    fill
                    unoptimized
                    sizes="(max-width: 520px) 80vw, (max-width: 1000px) 50vw, 340px"
                    onError={() => setBroken((b) => ({ ...b, [img]: true }))}
                  />
                </div>
              ) : loading ? (
                <div className="hdv-sk" />
              ) : (
                <PhoneArt />
              )}
              <div className="hdv-floor" aria-hidden="true" />
            </div>
          </div>
        </div>
        {dm ? visibleSpots.map((h, n) => spot(h, true, n)) : null}
      </div>

      <div className="hdv-row" role="group" aria-label="Delar">
        {dm ? visibleSpots.map((h, n) => spot(h, false, n)) : null}
      </div>

      <div className="hdv-ft">
        <div className="hdv-pr r">
          <b>{priceLine}</b>
          <span>{priceSub}</span>
        </div>
        {cta}
      </div>
    </div>
  )
}
