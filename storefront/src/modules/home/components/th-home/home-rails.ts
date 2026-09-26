import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import { getRegion } from "@lib/data/regions"
import { listCategories } from "@lib/data/categories"
import { getDeviceFinderData } from "./device-finder-data"
import { foldText, partIndexOf } from "./device-parts"

/*
Innehållet i startsidans tre produktrader. ThHome delar listan i block om
fem: 0-4 Bästsäljare, 5-9 Produkter på rea, 10-14 Nyss inkommet. Här byggs
exakt den ordningen, och en produkt visas bara en gång på sidan.

Bästsäljare: Medusa har ännu ingen försäljningshistorik att räkna på, så
raden visar det butiken säljer mest av: skärmar och sedan batterier till de
vanligaste modellerna (iPhone 11 till 15, Galaxy S21 och S22). Färgvarianter
av samma del räknas som en produkt, så samma skärm syns aldrig två gånger.
I varje rad visas högst en produkt per modell och deltyp, så att en rad
inte fylls med fem nästan likadana skärmskydd.

Produkter på rea: bara produkter där priset faktiskt är lägre än ordinarie
pris (samma villkor som ger rött pris och överstruket pris på kortet).
Delar till modeller från 2019 och framåt först, sedan störst rabatt. Från
Fynd och outlet och från sortimentet i övrigt.

Nyss inkommet: alla importerade produkter har samma skapandedatum, så datumet
säger inget om vad som är nytt. Raden visar i stället delar till de nyaste
telefonmodellerna, och inom samma modellår de senast skapade produkterna.

Bara produkter i lager och med pris visas. Allt hämtas med ett fåtal smala
anrop (bara de fält korten behöver, ingen produkttext) som cachas i tio
minuter för alla besökare. Hela produkter med beskrivning blir för stora för
Next data cache (max 2 MB per svar), och då hämtades allt på nytt vid varje
sidvisning.
*/

type P = HttpTypes.StoreProduct
type Price = { calc: number; orig: number; sale: boolean }

const RAIL = 5

const FIELDS =
  "id,title,handle,thumbnail,created_at,+metadata,*variants.calculated_price,categories.id,categories.handle,categories.parent_category_id"

/* Reserv om det smala anropet skulle avvisas: samma fält som produktlistorna. */
const FULL_FIELDS =
  "*variants.calculated_price,+categories.handle,+categories.parent_category_id,+categories.id,+metadata"

const RAIL_CACHE = {
  cache: "force-cache" as const,
  next: { revalidate: 600, tags: ["products", "home-rails"] },
}

const BESTSELLER_MODELS = [
  "iPhone 13",
  "iPhone 12",
  "iPhone 11",
  "iPhone 14",
  "Galaxy S21",
  "iPhone 15",
  "Galaxy S22",
  "iPhone XR",
]

const OUTLET = "outlet-fyndvaror"

/* Rearaden visar delar till modeller från det här året och framåt först. */
const RECENT_YEAR = 2019

async function fetchList(query: Record<string, unknown>): Promise<P[]> {
  const res = await sdk.client.fetch<HttpTypes.StoreProductListResponse>(
    "/store/products",
    { method: "GET", query, ...RAIL_CACHE }
  )
  return res?.products || []
}

async function list(query: Record<string, unknown>): Promise<P[]> {
  try {
    return await fetchList(query)
  } catch {
    try {
      const limit = Math.min(Number(query.limit) || 50, 50)
      return await fetchList({ ...query, fields: FULL_FIELDS, limit })
    } catch {
      return []
    }
  }
}

const inStock = (p: P): boolean => {
  const v = (p.metadata as Record<string, unknown> | null | undefined)?.in_stock
  return !(v === false || v === "false" || v === 0 || v === "0")
}

/* Billigaste varianten, som getProductPrice räknar på kortet. */
function priceOf(p: P): Price | null {
  let best: any = null
  for (const v of (p.variants || []) as any[]) {
    const cp = v?.calculated_price
    const amount = Number(cp?.calculated_amount)
    if (!cp || !(amount > 0)) continue
    if (!best || amount < Number(best.calculated_amount)) best = cp
  }
  if (!best) return null
  const calc = Number(best.calculated_amount)
  const orig = Number(best.original_amount) || calc
  return {
    calc,
    orig,
    sale: calc < orig && best.calculated_price?.price_list_type === "sale",
  }
}

const sellable = (p: P): boolean => inStock(p) && !!priceOf(p)

const onSale = (p: P): boolean => sellable(p) && !!priceOf(p)?.sale

const discount = (p: P): number => {
  const pr = priceOf(p)
  return pr && pr.sale && pr.orig > 0 ? (pr.orig - pr.calc) / pr.orig : 0
}

const COLOR_WORDS =
  /\b(svart|vit|vita|silver|guld|gold|rosa|rose|rosegold|roseguld|bla|gron|rod|lila|violett|gra|grafit|midnatt|stjarnglans|korall|coral|gul|orange|titan|beige|brun|turkos|mint|black|white|blue|green|red|purple|grey|gray|pink|yellow)\b/g

/* Samma del i olika färger ger samma nyckel. */
const groupKey = (title: string): string =>
  foldText(title)
    .replace(COLOR_WORDS, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()

/* Modell i en titel, t.ex. "iphone13" eller "galaxys21". Tom om ingen hittas. */
const modelKey = (title: string): string => {
  const m = foldText(title).match(
    /(iphone|ipad|galaxy|pixel|xperia|redmi|oneplus|huawei|nokia|moto)s*[a-z]*s*d+/
  )
  return m ? m[0].replace(/s+/g, "") : ""
}

/* Ungefärligt lanseringsår för modellen i en titel, 0 om okänt. */
function modelYear(text: string): number {
  const t = foldText(text)
  let m = t.match(/iphone (\d{1,2})\b/)
  if (m) {
    const n = Number(m[1])
    return n >= 11 ? 2008 + n : 2009 + n
  }
  if (/iphone (xs max|xs|xr|x)\b/.test(t)) return 2018
  if (/iphone se\b/.test(t)) return 2020
  m = t.match(/galaxy (?:s|note) ?(\d{1,2})\b/)
  if (m) {
    const n = Number(m[1])
    return n >= 20 ? 2000 + n : 2009 + n
  }
  m = t.match(/galaxy z (?:fold|flip) ?(\d)\b/)
  if (m) return 2018 + Number(m[1])
  m = t.match(/galaxy a(\d{2})\b/)
  if (m) return 2018 + (Number(m[1]) % 10)
  m = t.match(/pixel (\d{1,2})\b/)
  if (m) return 2015 + Number(m[1])
  return 0
}

const createdAt = (p: P): number => {
  const t = Date.parse(String(p.created_at || ""))
  return Number.isFinite(t) ? t : 0
}

/*
Plockar produkter utan dubbletter på sidan (samma id, eller samma del i en
annan färg) och med högst en produkt per modell och deltyp i varje rad.
*/
function makePicker() {
  const ids = new Set<string>()
  const groups = new Set<string>()
  const perRail = new Map<string, Set<string>>()
  return (rail: string, cands: P[], n: number, ok: (p: P) => boolean): P[] => {
    let seen = perRail.get(rail)
    if (!seen) {
      seen = new Set<string>()
      perRail.set(rail, seen)
    }
    const out: P[] = []
    for (const p of cands) {
      if (out.length >= n) break
      if (!p?.id || ids.has(p.id) || !ok(p)) continue
      const title = p.title || ""
      const g = groupKey(title)
      if (g && groups.has(g)) continue
      const mk = modelKey(title)
      const slot = mk ? mk + ":" + partIndexOf(title) : ""
      if (slot && seen.has(slot)) continue
      ids.add(p.id)
      if (g) groups.add(g)
      if (slot) seen.add(slot)
      out.push(p)
    }
    return out
  }
}

async function bestsellerCandidates(regionId: string): Promise<P[]> {
  const data = await getDeviceFinderData().catch(() => null)
  const ids: string[] = []
  for (const name of BESTSELLER_MODELS) {
    const f = foldText(name)
    for (const b of data?.brands || []) {
      const hit = b.m.find((m) => {
        const nf = foldText(m.n)
        return nf === f || nf === f + " 5g"
      })
      if (hit) {
        ids.push(hit.id)
        break
      }
    }
  }
  if (!ids.length) return []
  const products = await list({
    category_id: ids,
    limit: 150,
    region_id: regionId,
    fields: FIELDS,
  })
  const byModel = new Map<string, P[]>(ids.map((id): [string, P[]] => [id, []]))
  for (const p of products) {
    for (const c of p.categories || []) {
      const arr = c?.id ? byModel.get(c.id) : undefined
      if (arr) arr.push(p)
    }
  }
  const out: P[] = []
  for (const part of [0, 1]) {
    for (const id of ids) {
      const hit = (byModel.get(id) || []).find(
        (p) => partIndexOf(p.title || "") === part && sellable(p)
      )
      if (hit) out.push(hit)
    }
  }
  return out
}

async function outletProducts(regionId: string): Promise<P[]> {
  const cats: HttpTypes.StoreProductCategory[] = await listCategories().catch(() => [])
  const root = cats.find((c) => c.handle === OUTLET)
  if (!root) return []
  const ids = new Set<string>([root.id])
  let grew = true
  while (grew) {
    grew = false
    for (const c of cats) {
      if (c.parent_category_id && ids.has(c.parent_category_id) && !ids.has(c.id)) {
        ids.add(c.id)
        grew = true
      }
    }
  }
  return list({
    category_id: Array.from(ids).slice(0, 100),
    limit: 100,
    region_id: regionId,
    fields: FIELDS,
  })
}

async function newestModelProducts(regionId: string): Promise<P[]> {
  const data = await getDeviceFinderData().catch(() => null)
  const models: { id: string; y: number }[] = []
  for (const b of data?.brands || []) {
    for (const m of b.m) {
      const y = modelYear(b.n + " " + m.n)
      if (y > 0) models.push({ id: m.id, y })
    }
  }
  models.sort((a, b) => b.y - a.y)
  const ids = models.slice(0, 12).map((m) => m.id)
  if (!ids.length) return []
  return list({
    category_id: ids,
    limit: 100,
    order: "-created_at",
    region_id: regionId,
    fields: FIELDS,
  })
}

export const getHomeRails = cache(async function (
  countryCode: string
): Promise<P[]> {
  const region = await getRegion(countryCode)
  if (!region?.id) return []
  const regionId = region.id
  const base = { region_id: regionId, fields: FIELDS }

  const [best, pool, recent, outlet, newest] = await Promise.all([
    bestsellerCandidates(regionId),
    list({ ...base, limit: 100 }),
    list({ ...base, limit: 100, order: "-created_at" }),
    outletProducts(regionId),
    newestModelProducts(regionId),
  ])

  const pick = makePicker()
  const byNewModel = (a: P, b: P) =>
    modelYear(b.title || "") - modelYear(a.title || "") ||
    createdAt(b) - createdAt(a)

  const isRecent = (p: P): number =>
    modelYear(p.title || "") >= RECENT_YEAR ? 1 : 0

  const bestRail = pick("best", best, RAIL, sellable)
  const saleRail = pick(
    "sale",
    [...outlet, ...pool, ...recent]
      .filter(onSale)
      .sort((a, b) => isRecent(b) - isRecent(a) || discount(b) - discount(a)),
    RAIL,
    onSale
  )
  const newRail = pick("new", [...newest, ...recent].sort(byNewModel), RAIL, sellable)

  bestRail.push(...pick("best", pool, RAIL - bestRail.length, sellable))
  saleRail.push(...pick("sale", outlet, RAIL - saleRail.length, sellable))
  newRail.push(
    ...pick("new", [...recent].sort(byNewModel), RAIL - newRail.length, sellable)
  )

  /* ThHome delar listan efter position, så en ofullständig rad avslutar listan. */
  const out: P[] = []
  for (const rail of [bestRail, saleRail, newRail]) {
    out.push(...rail)
    if (rail.length < RAIL) break
  }
  return out
})
