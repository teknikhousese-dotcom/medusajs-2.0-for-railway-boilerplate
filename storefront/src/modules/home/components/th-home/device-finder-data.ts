import { sdk } from "@lib/config"
import { buildCategoryPathMap } from "@lib/util/teknik-url"
import { niceCategoryName } from "@lib/util/category-name"
import { PART_TYPES, partIndexOf } from "./device-parts"

/*
   Data för enhetsväljaren på startsidan. Bygger ett litet träd
   märke -> modell under Mobilreservdelar ur det riktiga kategoriträdet, med
   antal delar per modell och per deltyp. Allt hämtas med smala fält och
   cachas i Next data cache (varje svar långt under 2 MB), och resultatet
   hålls dessutom i minnet så att startsidan aldrig väntar på backend.
 */

export type DFModel = {
  n: string /* visningsnamn */
  s: string /* sista url-segmentet */
  id: string /* kategori-id */
  g: string /* serie, t.ex. "Galaxy S" */
  c: number /* antal delar, -1 = okänt */
  k: number[] /* antal per deltyp i PART_TYPES-ordning */
}
export type DFBrand = { n: string; s: string; p: string; m: DFModel[] }
export type DFData = { brands: DFBrand[]; models: number; counted: boolean }

type Cat = { id: string; name: string; handle: string; rank?: number | null; parent_category_id?: string | null }

const ROOT = "mobilreservdelar"
const TTL = 20 * 60 * 1000
const BRAND_ORDER = ["apple", "samsung", "huawei", "oneplus", "google", "sony-xperia", "xiaomi", "motorola", "lg", "htc", "nokia", "asus", "ovriga-tillverkare"]
const SERIES_ORDER: Record<string, string[]> = {
  apple: ["iPhone", "iPad", "Apple Watch"],
  samsung: ["Galaxy S", "Galaxy Z", "Galaxy A", "Galaxy Note", "Galaxy Xcover", "Galaxy M", "Galaxy J", "Galaxy Tab"],
  huawei: ["P-serien", "Mate", "Honor"],
}

async function fetchCategories(): Promise<Cat[]> {
  const res = await sdk.client.fetch<{ product_categories: Cat[] }>("/store/product-categories", {
    method: "GET",
    query: { fields: "id,name,handle,rank,parent_category_id", limit: 1000 },
    next: { tags: ["categories", "device-finder"], revalidate: 600 },
  } as any)
  return res?.product_categories || []
}

type P = { id: string; title?: string | null; categories?: { id: string }[] | null }

async function fetchPage(offset: number) {
  return sdk.client.fetch<{ products: P[]; count: number }>("/store/products", {
    method: "GET",
    query: { limit: 100, offset, fields: "id,title,categories.id" },
    next: { tags: ["device-finder"], revalidate: 1800 },
  } as any)
}

/* Antal delar per kategori-id, uppdelat per deltyp. */
async function fetchPartCounts(): Promise<Map<string, number[]>> {
  const first = await fetchPage(0)
  const all: P[] = [...(first?.products || [])]
  const total = Math.min(first?.count || 0, 20000)
  const offsets: number[] = []
  for (let o = 100; o < total; o += 100) offsets.push(o)
  for (let i = 0; i < offsets.length; i += 8) {
    const pages = await Promise.all(offsets.slice(i, i + 8).map((o) => fetchPage(o).catch(() => null)))
    for (const pg of pages) if (pg?.products) all.push(...pg.products)
  }
  const m = new Map<string, number[]>()
  for (const p of all) {
    const pi = partIndexOf(p.title || "")
    for (const c of p.categories || []) {
      if (!c?.id) continue
      let arr = m.get(c.id)
      if (!arr) {
        arr = PART_TYPES.map(() => 0)
        m.set(c.id, arr)
      }
      arr[pi]++
    }
  }
  return m
}

function cleanName(raw: string, brand: string): string {
  let s = niceCategoryName(raw).replace(/\.$/, "").replace(/\s+/g, " ").trim()
  if (brand === "samsung") s = s.replace(/^Samsung\s+/i, "").replace(/^(I\d{4}|GT-\S+)\s+/i, "")
  return s
}

function seriesOf(brand: string, name: string, brandName: string): string {
  if (brand === "apple") {
    if (/^iphone/i.test(name)) return "iPhone"
    if (/^ipad/i.test(name)) return "iPad"
    if (/watch/i.test(name)) return "Apple Watch"
    return "Övrigt"
  }
  if (brand === "samsung") {
    const n = name.replace(/^Galaxy\s+/i, "")
    if (/^z\s?(fold|flip)/i.test(n)) return "Galaxy Z"
    if (/^note/i.test(n)) return "Galaxy Note"
    if (/^xcover/i.test(n)) return "Galaxy Xcover"
    if (/^tab/i.test(n)) return "Galaxy Tab"
    if (/^s\s?(\d|i{1,3}\b)/i.test(n)) return "Galaxy S"
    if (/^a\d/i.test(n)) return "Galaxy A"
    if (/^j\d|^j\b/i.test(n)) return "Galaxy J"
    if (/^m\d/i.test(n)) return "Galaxy M"
    return "Övriga Galaxy"
  }
  if (brand === "huawei") {
    if (/honor/i.test(name)) return "Honor"
    if (/mate/i.test(name)) return "Mate"
    if (/\bp\s?\d|p smart/i.test(name)) return "P-serien"
    return "Övrigt"
  }
  return brandName
}

const variantWeight = (n: string) => {
  const t = n.toLowerCase()
  if (/ultra|pro max/.test(t)) return 0
  if (/plus|\+|\bpro\b/.test(t)) return 1
  if (/\bfe\b/.test(t)) return 3
  if (/lite|mini|\d+e\b|\bcompact\b/.test(t)) return 4
  return 2
}
const mainNumber = (n: string) => {
  const roman = n.match(/\bS\s(III|II|I)\b/)
  if (roman) return roman[1].length
  const m = n.replace(/\b(19|20)\d\d\b/g, " ").match(/\d+(\.\d+)?/)
  return m ? parseFloat(m[0]) : -1
}
const yearOf = (n: string) => {
  const m = n.match(/\b(19|20)\d\d\b/)
  return m ? parseInt(m[0], 10) : 0
}

function build(cats: Cat[], counts: Map<string, number[]> | null): DFData {
  const paths = buildCategoryPathMap(cats as any)
  const root = cats.find((c) => c.handle === ROOT)
  if (!root) return { brands: [], models: 0, counted: false }
  const kids = new Map<string, Cat[]>()
  for (const c of cats) {
    if (!c.parent_category_id) continue
    if (!kids.has(c.parent_category_id)) kids.set(c.parent_category_id, [])
    kids.get(c.parent_category_id)!.push(c)
  }
  const brands: DFBrand[] = []
  let total = 0
  for (const b of kids.get(root.id) || []) {
    const bp = paths.get(b.handle)
    if (!bp) continue
    const slug = bp.split("/").pop() || b.handle
    const bName = niceCategoryName(b.name, slug).replace(/^Övriga tillverkare$/, "Övriga")
    const models: (DFModel & { r: number })[] = []
    const walk = (parent: Cat) => {
      for (const c of kids.get(parent.id) || []) {
        const sub = kids.get(c.id) || []
        const k = counts?.get(c.id) || PART_TYPES.map(() => 0)
        const n = k.reduce((a, x) => a + x, 0)
        const p = paths.get(c.handle)
        if (p && (counts ? n > 0 : sub.length === 0)) {
          const name = cleanName(c.name, slug)
          models.push({
            n: name,
            s: p.slice(bp.length + 1),
            id: c.id,
            g: seriesOf(slug, name, bName),
            c: counts ? n : -1,
            k: counts ? k : [],
            r: c.rank ?? 0,
          })
        }
        if (sub.length) walk(c)
      }
    }
    walk(b)
    if (!models.length) continue
    const order = SERIES_ORDER[slug] || []
    const gi = (g: string) => {
      const i = order.indexOf(g)
      return i === -1 ? 99 : i
    }
    models.sort((x, y) => {
      const d = gi(x.g) - gi(y.g) || x.g.localeCompare(y.g, "sv")
      if (d) return d
      if (slug === "apple" && x.g === "iPhone") return x.r - y.r
      if (slug === "apple" && x.g === "iPad") return yearOf(y.n) - yearOf(x.n) || y.r - x.r
      return (
        mainNumber(y.n) - mainNumber(x.n) ||
        yearOf(y.n) - yearOf(x.n) ||
        variantWeight(x.n) - variantWeight(y.n) ||
        x.n.localeCompare(y.n, "sv")
      )
    })
    total += models.length
    brands.push({ n: bName, s: slug, p: "/" + bp, m: models.map(({ r, ...m }) => m) })
  }
  const bi = (s: string) => {
    const i = BRAND_ORDER.indexOf(s)
    return i === -1 ? 50 : i
  }
  brands.sort((a, b) => bi(a.s) - bi(b.s) || a.n.localeCompare(b.n, "sv"))
  return { brands, models: total, counted: !!counts }
}

let MEMO: { at: number; data: DFData } | null = null
let INFLIGHT: Promise<DFData> | null = null
let WAITED = false

async function load(): Promise<DFData> {
  const [cats, counts] = await Promise.all([fetchCategories(), fetchPartCounts().catch(() => null)])
  const data = build(cats, counts)
  if (data.brands.length && data.counted) MEMO = { at: Date.now(), data }
  return data
}

function refresh(): Promise<DFData> {
  if (!INFLIGHT) {
    INFLIGHT = load().finally(() => {
      INFLIGHT = null
    })
    INFLIGHT.catch(() => null)
  }
  return INFLIGHT
}

/**
 * Returnerar trädet direkt ur minnet om det finns (och uppdaterar i bakgrunden
 * när det blivit gammalt). Bara allra första anropet efter start väntar, högst
 * ~1,8 s. Hinner antalen inte bli klara visas modellerna utan antal och nästa
 * besök får hela trädet. Startsidan väntar alltså aldrig på backend i onödan.
 */
export async function getDeviceFinderData(): Promise<DFData | null> {
  try {
    if (MEMO) {
      if (Date.now() - MEMO.at > TTL) refresh()
      return MEMO.data
    }
    const pending = refresh()
    if (!WAITED) {
      WAITED = true
      const timeout = new Promise<null>((r) => setTimeout(() => r(null), 1800))
      const quick = await Promise.race([pending.catch(() => null), timeout])
      if (quick && quick.brands.length && quick.counted) return quick
    }
    const fallback = build(await fetchCategories(), null)
    return fallback.brands.length ? fallback : null
  } catch {
    return null
  }
}
