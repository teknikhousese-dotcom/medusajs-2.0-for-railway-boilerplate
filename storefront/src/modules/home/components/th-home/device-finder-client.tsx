"use client"

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { sdk } from "@lib/config"
import { getProductPrice } from "@lib/util/get-product-price"
import { PART_TYPES, foldText, partIndexOf } from "./device-parts"
import type { DFData, DFModel } from "./device-finder-data"

type M = DFModel & { b: string; bn: string; path: string; nf: string; hay: string; i: number }
type Item = { id: string; t: string; href: string; img: string | null; price: string | null; oos: boolean; pi: number; amt: number }
type Section = { title: string; items: M[] }

const SAVE_KEY = "th:device"
const POPULAR = ["iPhone 16", "iPhone 15", "iPhone 14", "iPhone 13", "iPhone 12", "iPhone 11", "Galaxy S24", "Galaxy S23", "Galaxy S22", "Galaxy S21 5G"]
const TOP_BRANDS = 5
const PARTS_CACHE = new Map<string, Item[]>()

const CSS = `
.dfx{position:relative;background:#fff;border-radius:22px;padding:18px;box-shadow:0 20px 50px rgba(27,23,20,.12);max-width:600px;contain:inline-size;color:#1b1714;font-family:system-ui,"SF Pro Text",Inter,"Segoe UI",Arial,sans-serif}
.dfx *,.dfx-sh *{box-sizing:border-box}
.dfx .r,.dfx-sh .r{font-family:"Poppins",ui-rounded,"SF Pro Rounded","Segoe UI",system-ui,sans-serif}
.dfx-top{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:34px;margin-bottom:12px}
.dfx-lab{font-weight:600;font-size:14px;display:flex;gap:8px;align-items:center;white-space:nowrap}
.dfx-lab i{width:8px;height:8px;border-radius:50%;background:#F50000;display:inline-block}
.dfx-saved{display:inline-flex;align-items:stretch;min-width:0;background:#f1faf5;border:1px solid #cdebd9;border-radius:999px;font-size:12.5px;overflow:hidden;animation:dfxin .3s ease}
.dfx-saved button{border:0;background:none;padding:0 11px;min-height:34px;font:inherit;color:#146c3d;cursor:pointer;display:inline-flex;align-items:center;gap:5px;min-width:0}
.dfx-saved .sv{min-width:0;overflow:hidden}
.dfx-saved .sv span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600}
.dfx-saved .by{border-left:1px solid #cdebd9;color:#1b1714;font-weight:600}
.dfx-saved button:hover{background:#e3f5ea}
.dfx-brands{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;width:0;min-width:100%}
.dfx-chip{display:inline-flex;align-items:center;height:40px;padding:0 15px;border-radius:999px;border:1.5px solid #e6e0da;background:#fff;font-weight:600;font-size:14px;color:#2c2621;cursor:pointer;white-space:nowrap;transition:background .18s,border-color .18s,color .18s,transform .12s}
.dfx-chip:hover{border-color:#1b1714}
.dfx-chip:active{transform:scale(.97)}
.dfx-chip[aria-pressed=true]{background:#1b1714;border-color:#1b1714;color:#fff}
.dfx-chip.fler{color:#6f685f;border-style:dashed}
.dfx-chip.hid{display:none}
.dfx-row{position:relative;display:grid;grid-template-columns:1fr auto;gap:10px}
.dfx-field{position:relative;display:flex;align-items:center;height:54px;border:2px solid #e6e0da;border-radius:14px;background:#faf8f6;transition:border-color .15s,background .15s,box-shadow .15s;min-width:0}
.dfx-field:focus-within,.dfx-field.on{border-color:#1b1714;background:#fff;box-shadow:0 0 0 4px rgba(27,23,20,.06)}
.dfx-field>svg{position:absolute;left:15px;width:18px;height:18px;stroke:#a49c92;fill:none;stroke-width:2.2;pointer-events:none}
.dfx-in{width:100%;height:100%;border:0;background:transparent;padding:0 44px 0 43px;font-weight:600;font-size:15px;color:#1b1714;outline:none;text-align:left;cursor:text;border-radius:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.dfx-in::placeholder,.dfx-in .ph{color:#9a9187;font-weight:500}
button.dfx-in{display:block;line-height:50px}
.dfx-clear{position:absolute;right:9px;width:30px;height:30px;border-radius:50%;border:0;background:#efeae5;color:#6f685f;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:17px;line-height:1}
.dfx-clear:hover{background:#e6e0da;color:#1b1714}
.dfx-go{height:54px;padding:0 22px;border-radius:14px;border:0;background:#F50000;color:#fff;font-weight:600;font-size:15px;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;text-decoration:none;white-space:nowrap;transition:background .15s,transform .12s}
.dfx-go:hover{background:#D10000}
.dfx a.dfx-go,.dfx a.dfx-all,.dfx a.dfx-go:hover,.dfx a.dfx-all:hover{color:#fff}
.dfx-go:active{transform:scale(.98)}
.dfx-go svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2.4;transition:transform .2s}
.dfx-go:hover svg{transform:translateX(3px)}
.dfx-hint{margin-top:10px;font-size:13px;color:#6f685f;height:20px;line-height:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dfx-hint b{color:#1b1714;font-weight:600}
.dfx-pop{position:absolute;left:0;right:0;top:calc(100% + 8px);z-index:60;background:#fff;border-radius:16px;box-shadow:0 24px 60px -12px rgba(27,23,20,.3),0 0 0 1px rgba(27,23,20,.06);max-height:min(380px,60vh);overflow:auto;overscroll-behavior:contain;padding:6px;opacity:0;transform:translateY(-6px) scale(.99);transform-origin:top center;pointer-events:none;visibility:hidden;transition:opacity .16s,transform .16s,visibility 0s .16s}
.dfx-pop.on{opacity:1;transform:none;pointer-events:auto;visibility:visible;transition:opacity .16s,transform .16s,visibility 0s}
.dfx-gh{position:sticky;top:-6px;background:rgba(255,255,255,.96);backdrop-filter:blur(6px);padding:10px 12px 6px;font-weight:600;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:#9a9187;z-index:1}
.dfx-op{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:46px;padding:8px 12px;border-radius:10px;cursor:pointer;font-size:14.5px;color:#1b1714;user-select:none}
.dfx-op .nm{font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dfx-op .mt{font-size:12.5px;color:#9a9187;white-space:nowrap;flex:0 0 auto}
.dfx-op[aria-selected=true]{background:#fff1ef}
.dfx-op[aria-selected=true] .nm{color:#D10000}
.dfx-op.cur .nm:after{content:" ✓";color:#1a9d55}
.dfx-empty{padding:18px 12px;font-size:14px;color:#6f685f;line-height:1.5}
.dfx-empty a{color:#D10000;font-weight:600;text-decoration:underline;text-underline-offset:3px}
.dfx-more{padding:10px 12px 8px;font-size:12.5px;color:#9a9187}
.dfx-exp{display:grid;grid-template-rows:0fr;transition:grid-template-rows .4s cubic-bezier(.2,.8,.2,1)}
.dfx-exp.on{grid-template-rows:1fr}
.dfx-exp>div{overflow:hidden;min-height:0}
.dfx-parts{display:flex;flex-wrap:wrap;gap:7px;padding:14px 0 4px;width:0;min-width:100%;scrollbar-width:none}
.dfx-parts::-webkit-scrollbar{display:none}
.dfx-pc{flex:0 0 auto;height:38px;padding:0 13px;border-radius:999px;border:1.5px solid #efeae5;background:#faf8f6;font-weight:600;font-size:13px;color:#2c2621;cursor:pointer;display:inline-flex;gap:6px;align-items:center;transition:background .15s,border-color .15s,color .15s}
.dfx-pc:hover{border-color:#cfc6bd}
.dfx-pc span{color:#9a9187;font-weight:500}
.dfx-pc[aria-pressed=true]{background:#F50000;border-color:#F50000;color:#fff}
.dfx-pc[aria-pressed=true] span{color:rgba(255,255,255,.85)}
.dfx-list{margin-top:8px;display:flex;flex-direction:column;gap:2px;max-height:292px;overflow:auto;overscroll-behavior:contain}
.dfx-it{display:grid;grid-template-columns:52px 1fr auto;gap:12px;align-items:center;padding:6px 8px;border-radius:12px;text-decoration:none;color:#1b1714;transition:background .15s;animation:dfxin .28s ease both}
.dfx-it:hover{background:#faf8f6}
.dfx-it img,.dfx-it .ph{width:52px;height:52px;border-radius:10px;object-fit:contain;background:#faf8f6;display:block}
.dfx-it .t{font-size:13.5px;line-height:1.32;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dfx-it .p{font-weight:600;font-size:14px;white-space:nowrap;text-align:right}
.dfx-it .o{display:block;font-weight:500;font-size:11.5px;color:#9a9187}
.dfx-sk{height:64px;border-radius:12px;background:linear-gradient(90deg,#f5f2ee 25%,#fbfaf8 50%,#f5f2ee 75%);background-size:200% 100%;animation:dfxsh 1.2s linear infinite}
.dfx-all{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;padding:13px 16px;border-radius:13px;background:#1b1714;color:#fff;font-weight:600;font-size:14px;text-decoration:none;transition:background .15s}
.dfx-all:hover{background:#2c2621}
.dfx-all svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2.4;flex:0 0 auto}
.dfx-note{font-size:13.5px;color:#6f685f;padding:14px 4px 2px;line-height:1.5}
@keyframes dfxsh{to{background-position:-200% 0}}
@keyframes dfxin{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.dfx-ov{position:fixed;inset:0;z-index:1000;background:rgba(27,23,20,.45);opacity:0;visibility:hidden;transition:opacity .25s,visibility 0s .25s}
.dfx-ov.on{opacity:1;visibility:visible;transition:opacity .25s,visibility 0s}
.dfx-sh{position:fixed;left:0;right:0;bottom:0;z-index:1001;height:88vh;height:88dvh;background:#fff;border-radius:22px 22px 0 0;display:flex;flex-direction:column;transform:translateY(105%);visibility:hidden;transition:transform .34s cubic-bezier(.2,.8,.2,1),visibility 0s .34s;padding-bottom:env(safe-area-inset-bottom);color:#1b1714;font-family:system-ui,"SF Pro Text",Inter,"Segoe UI",Arial,sans-serif;box-shadow:0 -10px 40px rgba(27,23,20,.18)}
.dfx-sh.on{transform:none;visibility:visible;transition:transform .34s cubic-bezier(.2,.8,.2,1),visibility 0s}
.dfx-grab{width:42px;height:5px;border-radius:3px;background:#e6e0da;margin:9px auto 2px;flex:0 0 auto}
.dfx-shh{display:flex;align-items:center;justify-content:space-between;padding:6px 14px 10px 18px;flex:0 0 auto}
.dfx-shh b{font-weight:600;font-size:18px}
.dfx-x{width:44px;height:44px;border-radius:50%;border:0;background:#faf8f6;color:#1b1714;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.dfx-shs{padding:0 16px;flex:0 0 auto}
.dfx-shs .dfx-in{font-size:16px}
.dfx-sh .dfx-brands{flex-wrap:nowrap;overflow-x:auto;padding:12px 16px 6px;margin:0;width:auto;min-width:0;scrollbar-width:none;flex:0 0 auto}
.dfx-sh .dfx-brands::-webkit-scrollbar{display:none}
.dfx-sh .dfx-chip.hid{display:inline-flex}
.dfx-sh .dfx-chip.fler{display:none}
.dfx-shl{flex:1 1 auto;overflow:auto;padding:4px 10px 18px;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
.dfx-shl .dfx-gh{top:-4px}
.dfx-shl .dfx-op{min-height:50px;font-size:15.5px}
@media (max-width:640px){
.dfx{padding:14px;border-radius:18px;max-width:none}
.dfx-brands{flex-wrap:nowrap;overflow-x:auto;margin:0 -14px 12px;padding:0 14px 2px;min-width:calc(100% + 28px);scrollbar-width:none}
.dfx-brands::-webkit-scrollbar{display:none}
.dfx-chip.hid{display:inline-flex}
.dfx-chip.fler{display:none}
.dfx-row{grid-template-columns:1fr}
.dfx-go{width:100%}
.dfx-parts{flex-wrap:nowrap;overflow-x:auto;padding:14px 14px 4px;margin:0 -14px;min-width:calc(100% + 28px)}
.dfx-top{flex-wrap:nowrap}
}
@media (max-width:440px){.dfx-top.hs .dfx-lab .lt{display:none}.dfx-saved{max-width:calc(100% - 24px)}}
@media (prefers-reduced-motion:reduce){.dfx *,.dfx-sh,.dfx-ov,.dfx-sh *{transition:none!important;animation:none!important}}
`

const Arrow = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
const Search = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" strokeLinecap="round" /></svg>
)

const delar = (n: number) => (n === 1 ? "1 del" : n + " delar")

function scoreOf(m: M, qf: string, tokens: string[]): number {
  const full = foldText(m.bn + " " + m.n)
  let s = 3
  if (m.nf === qf || full === qf) s = 0
  else if (m.nf.startsWith(qf) || full.startsWith(qf)) s = 1
  const words = new Set(full.split(/[\s/()]+/))
  if (tokens.every((t) => words.has(t))) s -= 0.5
  return s
}

export default function DeviceFinderClient({ data, regionId }: { data: DFData | null; regionId?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const listId = "dfx-list-" + uid
  const brands = data?.brands || []

  const all: M[] = useMemo(() => {
    const out: M[] = []
    for (const b of brands) {
      for (const m of b.m) {
        const nf = foldText(m.n)
        out.push({
          ...m,
          b: b.s,
          bn: b.n,
          path: b.p + "/" + m.s,
          nf,
          hay: foldText(b.n + " " + m.n + " " + m.g) + " " + nf.replace(/\s+/g, ""),
          i: out.length,
        })
      }
    }
    return out
  }, [brands])

  const [brand, setBrand] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [model, setModel] = useState<M | null>(null)
  const [saved, setSaved] = useState<M | null>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [expanded, setExpanded] = useState(false)
  const [part, setPart] = useState(-1)
  const [items, setItems] = useState<Item[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [isSheet, setIsSheet] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showAllBrands, setShowAllBrands] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const sheetInputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)

  /* Mobil: bottom sheet i stället för rullgardin. */
  useEffect(() => {
    setMounted(true)
    const mq = window.matchMedia("(max-width: 640px)")
    const on = () => setIsSheet(mq.matches)
    on()
    if (mq.addEventListener) mq.addEventListener("change", on)
    else mq.addListener(on)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", on)
      else mq.removeListener(on)
    }
  }, [])

  /* Sparad enhet från förra besöket. */
  useEffect(() => {
    if (!all.length) return
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return
      const s = JSON.parse(raw)
      const hit = all.find((m) => m.id === s?.id) || all.find((m) => m.path === s?.path)
      if (hit) setSaved(hit)
    } catch {
      /* ignorera trasig post */
    }
  }, [all])

  const qf = foldText(query).trim().replace(/\s+/g, " ")
  const searching = !!qf && !(model && qf === model.nf)

  const sections: Section[] = useMemo(() => {
    if (searching) {
      const tokens = qf.split(" ")
      const hits = all
        .filter((m) => (!brand || m.b === brand) && tokens.every((t) => m.hay.includes(t)))
        .map((m) => ({ m, s: scoreOf(m, qf, tokens) }))
        .sort((a, b) => a.s - b.s || a.m.n.length - b.m.n.length || a.m.i - b.m.i)
        .slice(0, 60)
        .map((x) => x.m)
      return hits.length ? [{ title: "Träffar", items: hits }] : []
    }
    if (brand) {
      const groups = new Map<string, M[]>()
      for (const m of all) {
        if (m.b !== brand) continue
        if (!groups.has(m.g)) groups.set(m.g, [])
        groups.get(m.g)!.push(m)
      }
      return Array.from(groups, ([title, items]) => ({ title, items }))
    }
    const pop: M[] = []
    for (const name of POPULAR) {
      const f = foldText(name)
      const hit = all.find((m) => m.nf === f)
      if (hit && !pop.includes(hit)) pop.push(hit)
    }
    if (pop.length < 6) {
      for (const m of all.slice().sort((a, b) => b.c - a.c)) {
        if (pop.length >= 10) break
        if (!pop.includes(m)) pop.push(m)
      }
    }
    return pop.length ? [{ title: "Populära modeller", items: pop }] : []
  }, [all, brand, qf, searching])

  const flat = useMemo(() => sections.flatMap((s) => s.items), [sections])

  useEffect(() => {
    setActive(searching && flat.length ? 0 : -1)
  }, [qf, brand, searching, flat.length])

  /* Håll aktivt alternativ synligt vid piltangenter. */
  useEffect(() => {
    if (active < 0) return
    const pop = popRef.current
    const el = document.getElementById(`dfx-o-${uid}-${active}`)
    if (!pop || !el) return
    const top = el.offsetTop
    const bottom = top + el.offsetHeight
    if (top < pop.scrollTop + 34) pop.scrollTop = Math.max(0, top - 34)
    else if (bottom > pop.scrollTop + pop.clientHeight) pop.scrollTop = bottom - pop.clientHeight + 6
  }, [active, uid])

  /* Stäng rullgardinen vid klick utanför. */
  useEffect(() => {
    if (!open || isSheet) return
    const h = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    document.addEventListener("touchstart", h)
    return () => {
      document.removeEventListener("mousedown", h)
      document.removeEventListener("touchstart", h)
    }
  }, [open, isSheet])

  /* Lås sidan bakom bottom sheet. */
  useEffect(() => {
    if (!(open && isSheet)) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const t = window.setTimeout(() => sheetInputRef.current?.focus(), 60)
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet()
    }
    document.addEventListener("keydown", k)
    return () => {
      document.body.style.overflow = prev
      window.clearTimeout(t)
      document.removeEventListener("keydown", k)
    }
  }, [open, isSheet])

  const loadItems = useCallback(
    async (m: M) => {
      setFailed(false)
      const hit = PARTS_CACHE.get(m.id)
      if (hit) {
        setItems(hit)
        return
      }
      setItems(null)
      try {
        const res: any = await sdk.client.fetch("/store/products", {
          method: "GET",
          query: {
            category_id: [m.id],
            limit: 100,
            ...(regionId ? { region_id: regionId } : {}),
            fields: regionId
              ? "id,title,handle,thumbnail,+metadata,*variants.calculated_price"
              : "id,title,handle,thumbnail,+metadata",
          },
        })
        const prefix = [foldText(m.bn + " " + m.n), foldText(m.n), foldText(m.bn)]
        const list: Item[] = (res?.products || []).map((p: any) => {
          let price: string | null = null
          let amt = 0
          try {
            const cp: any = getProductPrice({ product: p }).cheapestPrice
            price = cp?.calculated_price || null
            amt = Number(cp?.calculated_price_number || 0)
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
          const v = p?.metadata?.in_stock
          return {
            id: p.id,
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
        PARTS_CACHE.set(m.id, list)
        setItems(list)
      } catch {
        setFailed(true)
        setItems([])
      }
    },
    [regionId]
  )

  const choose = (m: M, expand = true) => {
    setModel(m)
    setBrand(m.b)
    setQuery(m.n)
    setOpen(false)
    setPart(-1)
    setSaved(m)
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ id: m.id, path: m.path, n: m.n }))
    } catch {
      /* privat läge */
    }
    if (expand) {
      setExpanded(true)
      loadItems(m)
    }
    if (isSheet) window.setTimeout(() => triggerRef.current?.focus(), 30)
  }

  const openPicker = () => {
    setOpen(true)
    if (!isSheet) window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  function closeSheet() {
    setOpen(false)
    window.setTimeout(() => triggerRef.current?.focus(), 30)
  }

  const pickBrand = (s: string) => {
    setBrand(brand === s ? null : s)
    setModel(null)
    setExpanded(false)
    setPart(-1)
    setQuery("")
    openPicker()
  }

  const onType = (v: string) => {
    setQuery(v)
    setOpen(true)
    if (model && foldText(v).trim() !== model.nf) {
      setModel(null)
      setExpanded(false)
    }
  }

  const clear = () => {
    setQuery("")
    setModel(null)
    setExpanded(false)
    setPart(-1)
    openPicker()
  }

  const change = () => {
    setSaved(null)
    try {
      localStorage.removeItem(SAVE_KEY)
    } catch {
      /* privat läge */
    }
    setModel(null)
    setExpanded(false)
    setQuery("")
    setPart(-1)
    openPicker()
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (!open) setOpen(true)
      setActive((a) => Math.min(flat.length - 1, a + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (open && active >= 0 && flat[active]) choose(flat[active])
      else if (model) window.location.href = model.path
      else if (qf) window.location.href = "/results/" + encodeURIComponent(query.trim())
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault()
        if (isSheet) closeSheet()
        else setOpen(false)
      }
    } else if (e.key === "Tab" && !isSheet) {
      setOpen(false)
    }
  }

  const go = () => {
    if (model) return
    if (searching && flat[0]) choose(flat[0])
    else if (qf) window.location.href = "/results/" + encodeURIComponent(query.trim())
    else if (saved) choose(saved)
    else openPicker()
  }

  const brandName = brand ? brands.find((b) => b.s === brand)?.n : null
  const modelCount = data?.counted ? data.models : all.length

  const hint = model ? (
    <>
      <b>{model.n}</b>
      {model.c > 0 ? <>: {delar(model.c)} i sortimentet</> : null}
    </>
  ) : brandName ? (
    <>
      <b>{brandName}</b>: {all.filter((m) => m.b === brand).length} modeller. Sök eller välj i listan.
    </>
  ) : (
    <>Välj märke och modell så visar vi delarna som passar.</>
  )

  const partCounts: number[] = items && items.length
    ? PART_TYPES.map((_, i) => items.filter((x) => x.pi === i).length)
    : model?.k || []
  const partChips = partCounts.length ? PART_TYPES.map((p, i) => ({ ...p, i, c: partCounts[i] || 0 })).filter((p) => p.c > 0) : []
  const totalParts = items && items.length ? items.length : model?.c || 0
  const shown: Item[] = useMemo(() => {
    if (!items) return []
    if (part >= 0) return items.filter((x) => x.pi === part)
    const pick: Item[] = []
    for (const pi of [0, 1, 2, 4, 3]) {
      const x = items.find((it) => it.pi === pi && !it.oos)
      if (x) pick.push(x)
      if (pick.length >= 4) break
    }
    for (const x of items) {
      if (pick.length >= 4) break
      if (!pick.includes(x)) pick.push(x)
    }
    return pick
  }, [items, part])

  const renderOptions = (inSheet: boolean) => {
    if (!flat.length) {
      return (
        <div className="dfx-empty">
          {qf ? (
            <>
              Vi hittar ingen modell som matchar &quot;{query.trim()}&quot;{brandName ? <> hos {brandName}</> : null}.{" "}
              <a href={"/results/" + encodeURIComponent(query.trim())}>Sök i hela butiken</a>
            </>
          ) : (
            <>Börja skriva namnet på din modell.</>
          )}
        </div>
      )
    }
    let idx = -1
    return (
      <>
        {sections.map((s) => (
          <div role="group" aria-label={s.title} key={s.title}>
            <div className="dfx-gh r" aria-hidden="true">{s.title}</div>
            {s.items.map((m) => {
              idx++
              const i = idx
              return (
                <div
                  key={m.id}
                  id={inSheet ? undefined : `dfx-o-${uid}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={"dfx-op" + (model?.id === m.id ? " cur" : "")}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseMove={() => active !== i && setActive(i)}
                  onClick={() => choose(m)}
                >
                  <span className="nm">{m.n}</span>
                  <span className="mt">{!brand || searching ? m.bn + (m.c > 0 ? " · " : "") : ""}{m.c > 0 ? delar(m.c) : ""}</span>
                </div>
              )
            })}
          </div>
        ))}
        {!searching && !brand ? <div className="dfx-more">Skriv för att söka bland alla {modelCount} modeller.</div> : null}
      </>
    )
  }

  const brandChips = (inSheet: boolean) => (
    <div className="dfx-brands" role="group" aria-label="Märke">
      {brands.map((b, i) => (
        <button
          key={b.s}
          type="button"
          className={"dfx-chip r" + (!inSheet && !showAllBrands && i >= TOP_BRANDS && brand !== b.s ? " hid" : "")}
          aria-pressed={brand === b.s}
          onClick={() => pickBrand(b.s)}
        >
          {b.n}
        </button>
      ))}
      {!inSheet && brands.length > TOP_BRANDS && !showAllBrands ? (
        <button type="button" className="dfx-chip fler r" onClick={() => setShowAllBrands(true)} aria-label="Visa fler märken">
          +{brands.length - TOP_BRANDS} fler
        </button>
      ) : null}
    </div>
  )

  if (!data || !brands.length) {
    return (
      <div className="dfx">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="dfx-top"><div className="dfx-lab r"><i /> Vilken telefon har du?</div></div>
        <a className="dfx-go r" href="/mobilreservdelar" style={{ width: "100%" }}>Visa alla mobilreservdelar <Arrow /></a>
      </div>
    )
  }

  const placeholder = brandName ? `Sök bland ${brandName}-modeller` : "Sök modell, t.ex. iPhone 13"

  return (
    <div className="dfx" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className={"dfx-top" + (saved && !model ? " hs" : "")}>
        <div className="dfx-lab r"><i /> <span className="lt">Vilken telefon har du?</span></div>
        {saved && !model ? (
          <div className="dfx-saved">
            <button
              type="button"
              className="sv"
              onClick={() => {
                choose(saved)
              }}
              aria-label={`Din enhet: ${saved.n}. Visa delar`}
            >
              <span>Din enhet: {saved.n}</span>
            </button>
            <button type="button" className="by" onClick={change}>Byt</button>
          </div>
        ) : null}
      </div>

      {brandChips(false)}

      <div className="dfx-row">
        <div className={"dfx-field" + (open && !isSheet ? " on" : "")}>
          <Search />
          {isSheet ? (
            <button
              ref={triggerRef}
              type="button"
              className="dfx-in r"
              aria-haspopup="dialog"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              {query ? query : <span className="ph">{placeholder}</span>}
            </button>
          ) : (
            <input
              ref={inputRef}
              className="dfx-in r"
              type="text"
              role="combobox"
              aria-label="Sök din modell"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={open && active >= 0 ? `dfx-o-${uid}-${active}` : undefined}
              autoComplete="off"
              spellCheck={false}
              placeholder={placeholder}
              value={query}
              onChange={(e) => onType(e.target.value)}
              onFocus={() => setOpen(true)}
              onClick={() => setOpen(true)}
              onKeyDown={onKey}
            />
          )}
          {query ? (
            <button type="button" className="dfx-clear" aria-label="Rensa" onClick={clear}>×</button>
          ) : null}
        </div>
        {model ? (
          <a className="dfx-go r" href={model.path}>Visa delar <Arrow /></a>
        ) : (
          <button type="button" className="dfx-go r" onClick={go}>Visa delar <Arrow /></button>
        )}
        {!isSheet ? (
          <div ref={popRef} className={"dfx-pop" + (open ? " on" : "")} id={listId} role="listbox" aria-label="Modeller">
            {open ? renderOptions(false) : null}
          </div>
        ) : null}
      </div>

      <div className="dfx-hint" aria-live="polite">{hint}</div>

      <div className={"dfx-exp" + (expanded && model ? " on" : "")} aria-hidden={!(expanded && model)}>
        <div>
          {model && expanded ? (
            <>
              {partChips.length > 1 ? (
                <div className="dfx-parts" role="group" aria-label="Typ av del">
                  <button type="button" className="dfx-pc r" aria-pressed={part === -1} onClick={() => setPart(-1)}>
                    Allt <span>{totalParts}</span>
                  </button>
                  {partChips.map((p) => (
                    <button key={p.k} type="button" className="dfx-pc r" aria-pressed={part === p.i} onClick={() => setPart(part === p.i ? -1 : p.i)}>
                      {p.n} <span>{p.c}</span>
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="dfx-list">
                {items === null ? (
                  <>
                    <div className="dfx-sk" />
                    <div className="dfx-sk" />
                    <div className="dfx-sk" />
                  </>
                ) : failed ? (
                  <div className="dfx-note">Vi kunde inte hämta delarna just nu. Du hittar alla på modellens sida.</div>
                ) : shown.length ? (
                  shown.map((x) => (
                    <a key={x.id} className="dfx-it" href={x.href}>
                      {x.img ? <img src={x.img} alt="" loading="lazy" width={52} height={52} /> : <span className="ph" />}
                      <span className="t">{x.t}</span>
                      <span className="p r">
                        {x.price || ""}
                        {x.oos ? <span className="o">Tillfälligt slut</span> : null}
                      </span>
                    </a>
                  ))
                ) : (
                  <div className="dfx-note">Just nu finns inga delar av den typen här.</div>
                )}
              </div>
              <a className="dfx-all r" href={model.path}>
                <span>
                  {totalParts > 1 ? `Visa alla ${delar(totalParts)} till ${model.n}` : `Visa alla delar till ${model.n}`}
                </span>
                <Arrow />
              </a>
            </>
          ) : null}
        </div>
      </div>

      {mounted && isSheet
        ? createPortal(
            <>
              <div className={"dfx-ov" + (open ? " on" : "")} onClick={closeSheet} aria-hidden="true" />
              <div className={"dfx-sh" + (open ? " on" : "")} role="dialog" aria-modal="true" aria-label="Välj modell">
                <div className="dfx-grab" />
                <div className="dfx-shh">
                  <b className="r">Välj modell</b>
                  <button type="button" className="dfx-x" aria-label="Stäng" onClick={closeSheet}>×</button>
                </div>
                <div className="dfx-shs">
                  <div className="dfx-field on">
                    <Search />
                    <input
                      ref={sheetInputRef}
                      className="dfx-in r"
                      type="search"
                      enterKeyHint="search"
                      aria-label="Sök din modell"
                      aria-controls={listId + "-s"}
                      autoComplete="off"
                      spellCheck={false}
                      placeholder={placeholder}
                      value={query}
                      onChange={(e) => onType(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          if (flat[0] && searching) choose(flat[0])
                          else if (qf && !flat.length) window.location.href = "/results/" + encodeURIComponent(query.trim())
                        }
                      }}
                    />
                    {query ? (
                      <button type="button" className="dfx-clear" aria-label="Rensa" onClick={() => onType("")}>×</button>
                    ) : null}
                  </div>
                </div>
                {brandChips(true)}
                <div className="dfx-shl" id={listId + "-s"} role="listbox" aria-label="Modeller">
                  {open ? renderOptions(true) : null}
                </div>
              </div>
            </>,
            document.body
          )
        : null}
    </div>
  )
}
