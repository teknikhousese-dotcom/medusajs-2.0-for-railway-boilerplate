import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/*
   Teknikhouse butikssök: GET /store/search

   Parametrar: q, limit (1..100, standard 24), offset, sort
   (relevance | price_asc | price_desc | newest | name), prefix=1 för
   typeahead (sista ordet räknas som början på ett ord).

   Hela katalogen (runt 5 500 produkter) hålls som ett index i minnet och
   byggs om var 10:e minut i bakgrunden. Relevansen viktar:
   exakt fras i titeln > alla ord i titeln > sku/ean exakt > kategori/modell.
   Svenska synonymer (skärm/display/lcd/oled, batteri/battery, baksida/bakglas,
   laddkontakt/laddport ...) och ihopskrivna modeller ("iphone13", "s21").
*/

type Doc = {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  href: string
  created: number
  inStock: boolean
  price: number | null
  nt: string
  tt: string[]
  ts: Set<string>
  ct: Set<string>
  catIds: string[]
  modelKeys: Set<string>
  codes: Set<string>
}

type CatDoc = {
  id: string
  name: string
  path: string
  nt: string
  tt: string[]
  count: number
  depth: number
}

type Index = { docs: Doc[]; cats: CatDoc[]; at: number }

const TTL = 10 * 60 * 1000
let INDEX: Index | null = null
let BUILDING: Promise<Index> | null = null

const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g")

function norm(s: string): string {
  let t = (s || "").toLowerCase().normalize("NFD").replace(DIACRITICS, "")
  t = t.replace(/\+/g, " plus ")
  t = t.replace(/[^a-z0-9]+/g, " ")
  t = t.replace(/\b(iphone|ipad|pixel|redmi|xperia|mate|nova|watch|note|honor|oneplus|nord|moto)(\d)/g, "$1 $2")
  t = t.replace(/\bgalaxy([a-z]\d)/g, "galaxy $1")
  t = t.replace(/(\d)(pro|max|plus|mini|ultra|lite|fe)\b/g, "$1 $2")
  t = t.replace(/\bpromax\b/g, "pro max")
  return t.replace(/\s+/g, " ").trim()
}

const GROUPS: string[][] = [
  ["skarm", "skarmen", "display", "displayen", "lcd", "oled", "screen", "digitizer", "touchskarm", "skarmbyte"],
  ["batteri", "batteriet", "battery", "batterier"],
  ["baksida", "baksidan", "bakglas", "batterilucka", "backcover", "bakstycke", "baksidor"],
  ["laddkontakt", "laddport", "laddningsport", "laddningskontakt", "laddkontakten", "laddingang"],
  ["kamera", "kameran", "camera", "kameror"],
  ["hogtalare", "speaker", "hogtalaren"],
  ["skal", "fodral", "case", "mobilskal", "skalet"],
  ["skarmskydd", "skyddsglas", "glasskydd", "hardat", "tempered", "skarmskyddet"],
  ["laddare", "charger", "snabbladdare"],
  ["kabel", "sladd", "cable", "laddkabel"],
]
const GROUP_OF = new Map<string, number>()
GROUPS.forEach((g, i) => g.forEach((w) => GROUP_OF.set(w, i)))
const SCREEN = 0
const CASE = 6
const PROTECT = 7

const QUALIFIERS = new Set(["mini", "pro", "max", "plus", "ultra", "lite", "fe", "e", "se", "air", "fold", "flip", "edge", "neo", "5g", "4g"])
const STOP = new Set(["till", "for", "och", "med", "i", "av", "the", "en", "ett"])

const isNum = (t: string) => /^\d+$/.test(t)

function tokens(s: string): string[] {
  return norm(s).split(" ").filter(Boolean)
}

function buildPathMap(cats: any[]): Map<string, string> {
  const byId = new Map<string, any>(cats.map((c) => [c.id, c]))
  const memo = new Map<string, string>()
  const seg = (c: any) => {
    const p = c.parent_category_id ? byId.get(c.parent_category_id) : null
    return p && p.handle && c.handle ? String(c.handle).slice(String(p.handle).length + 1) : c.handle || ""
  }
  const path = (c: any, depth = 0): string => {
    if (memo.has(c.id)) return memo.get(c.id)!
    const p = c.parent_category_id ? byId.get(c.parent_category_id) : null
    const r = p && depth < 12 ? path(p, depth + 1) + "/" + seg(c) : seg(c)
    memo.set(c.id, r)
    return r
  }
  const m = new Map<string, string>()
  for (const c of cats) if (c.handle) m.set(c.id, path(c))
  return m
}

async function loadPrices(req: MedusaRequest): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  try {
    let pg: any = null
    try {
      pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch {
      pg = null
    }
    if (!pg || typeof pg.raw !== "function") return out
    const r: any = await pg.raw(
      `SELECT pv.product_id AS pid, MIN(p.amount)::float AS amt
         FROM product_variant pv
         JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id AND pvps.deleted_at IS NULL
         JOIN price p ON p.price_set_id = pvps.price_set_id AND p.deleted_at IS NULL
         LEFT JOIN price_list pl ON pl.id = p.price_list_id
        WHERE pv.deleted_at IS NULL
          AND lower(p.currency_code) = 'sek'
          AND (p.min_quantity IS NULL OR p.min_quantity <= 1)
          AND (
            p.price_list_id IS NULL OR (
              pl.deleted_at IS NULL AND pl.status = 'active'
              AND (pl.starts_at IS NULL OR pl.starts_at <= now())
              AND (pl.ends_at IS NULL OR pl.ends_at > now())
            )
          )
        GROUP BY pv.product_id`
    )
    const rows = r && r.rows ? r.rows : r
    for (const row of rows || []) {
      const a = Number(row.amt)
      if (row.pid && isFinite(a)) out.set(String(row.pid), a)
    }
  } catch {
    return out
  }
  return out
}

async function build(req: MedusaRequest): Promise<Index> {
  const query: any = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const catRes = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle", "parent_category_id", "is_active", "is_internal"],
    pagination: { skip: 0, take: 5000 },
  })
  const rawCats: any[] = (catRes?.data || []).filter((c: any) => c && c.is_active !== false && c.is_internal !== true)
  const paths = buildPathMap(rawCats)
  const catById = new Map<string, any>(rawCats.map((c) => [c.id, c]))
  const handleToPath = new Map<string, string>()
  for (const c of rawCats) {
    const p = paths.get(c.id)
    if (p && c.handle) handleToPath.set(c.handle, p)
  }

  const prices = await loadPrices(req)

  const docs: Doc[] = []
  const counts = new Map<string, number>()
  const take = 500
  for (let skip = 0; skip < 50000; skip += take) {
    const { data } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "thumbnail",
        "status",
        "created_at",
        "metadata",
        "variants.sku",
        "variants.ean",
        "variants.upc",
        "variants.barcode",
        "categories.id",
      ],
      filters: { status: "published" },
      pagination: { skip, take, order: { created_at: "DESC" } },
    })
    const list: any[] = data || []
    for (const p of list) {
      if (!p?.id || !p?.handle) continue
      const title = String(p.title || "")
      const tt = tokens(title)
      const catIds: string[] = (p.categories || []).map((c: any) => c?.id).filter((id: any) => id && catById.has(id))
      const ct = new Set<string>()
      const modelKeys = new Set<string>()
      let best = ""
      for (const cid of catIds) {
        counts.set(cid, (counts.get(cid) || 0) + 1)
        let c = catById.get(cid)
        let guard = 0
        const own = tokens(c?.name || "")
        if (own.length) modelKeys.add(own.join(" "))
        while (c && guard++ < 12) {
          for (const w of tokens(c.name || "")) ct.add(w)
          c = c.parent_category_id ? catById.get(c.parent_category_id) : null
        }
        const path = paths.get(cid) || ""
        if (path.length > best.length) best = path
      }
      const meta = (p.metadata || {}) as Record<string, any>
      const pin = typeof meta.url_category === "string" ? handleToPath.get(meta.url_category) : undefined
      const href = pin ? "/" + pin + "/" + p.handle : best ? "/" + best + "/" + p.handle : "/products/" + p.handle
      const codes = new Set<string>()
      for (const v of p.variants || []) {
        for (const k of ["sku", "ean", "upc", "barcode"]) {
          const val = v?.[k]
          if (val) codes.add(String(val).toLowerCase().replace(/\s+/g, ""))
        }
      }
      const st = meta.in_stock
      const inStock = !(st === false || st === "false" || st === 0 || st === "0")
      docs.push({
        id: p.id,
        title,
        handle: p.handle,
        thumbnail: p.thumbnail || null,
        href,
        created: p.created_at ? new Date(p.created_at).getTime() : 0,
        inStock,
        price: prices.has(p.id) ? prices.get(p.id)! : null,
        nt: " " + tt.join(" ") + " ",
        tt,
        ts: new Set(tt),
        ct,
        catIds,
        modelKeys,
        codes,
      })
    }
    if (list.length < take) break
  }

  const cats: CatDoc[] = []
  for (const c of rawCats) {
    const path = paths.get(c.id)
    const n = counts.get(c.id) || 0
    if (!path || !n) continue
    const tt = tokens(c.name || "")
    cats.push({ id: c.id, name: String(c.name || ""), path: "/" + path, nt: tt.join(" "), tt, count: n, depth: path.split("/").length })
  }

  return { docs, cats, at: Date.now() }
}

async function getIndex(req: MedusaRequest): Promise<Index> {
  const fresh = INDEX && Date.now() - INDEX.at < TTL
  if (INDEX && fresh) return INDEX
  if (!BUILDING) {
    BUILDING = build(req)
      .then((ix) => {
        INDEX = ix
        return ix
      })
      .finally(() => {
        BUILDING = null
      })
  }
  if (INDEX) {
    BUILDING.catch(() => null)
    return INDEX
  }
  return BUILDING
}

type QTok = { t: string; g: number; num: boolean; last: boolean }

function matchToken(q: QTok, d: Doc, prefix: boolean): number {
  const t = q.t
  if (d.ts.has(t)) return 100
  if (q.g >= 0) {
    for (const w of GROUPS[q.g]) if (d.ts.has(w)) return 88
    if (q.g !== PROTECT) {
      for (const w of d.tt) {
        if (q.g === SCREEN && (GROUP_OF.get(w) === PROTECT || w.startsWith("skarmskydd") || w.startsWith("skydd"))) continue
        if (GROUP_OF.has(w) && GROUP_OF.get(w) !== q.g) continue
        for (const s of GROUPS[q.g]) if (s.length >= 5 && w.startsWith(s)) return 60
      }
    }
  }
  if (!q.num && t.length >= 3) {
    for (const w of d.tt) {
      if (q.g === SCREEN && w.startsWith("skarmskydd")) continue
      if (q.g >= 0 && GROUP_OF.has(w) && GROUP_OF.get(w) !== q.g) continue
      if (w.startsWith(t)) return 58
    }
  }
  if (q.last && prefix) {
    for (const w of d.tt) if (w.startsWith(t)) return 70
  }
  if (t.length >= 4) {
    for (const c of d.codes) if (c === t) return 150
    if (!q.num || t.length >= 6) for (const c of d.codes) if (c.includes(t)) return 55
  }
  if (d.ct.has(t)) return 38
  if (q.g >= 0) for (const w of GROUPS[q.g]) if (d.ct.has(w)) return 34
  if (!q.num && t.length >= 3) for (const w of d.ct) if (w.startsWith(t)) return 22
  if (q.last && prefix) for (const w of d.ct) if (w.startsWith(t)) return 22
  return 0
}

function extraQualifierPenalty(d: Doc, qset: Set<string>, nums: string[]): number {
  let pen = 0
  for (const n of nums) {
    let seen = 0
    let clean = 0
    for (let i = 0; i < d.tt.length; i++) {
      if (d.tt[i] !== n) continue
      seen++
      let extra = false
      for (let j = i + 1; j < d.tt.length && QUALIFIERS.has(d.tt[j]); j++) {
        if (!qset.has(d.tt[j])) {
          extra = true
          break
        }
      }
      if (!extra) clean++
    }
    if (seen && !clean) pen += 140
  }
  return pen
}

function scoreDoc(d: Doc, qt: QTok[], qnorm: string, qcompact: string, prefix: boolean, allowMiss: number): number | null {
  let sum = 0
  let miss = 0
  let inTitle = 0
  for (const q of qt) {
    const s = matchToken(q, d, prefix)
    if (!s) {
      miss++
      if (miss > allowMiss) return null
    } else {
      sum += s
      if (s >= 58) inTitle++
    }
  }
  let score = sum
  if (qcompact.length >= 4 && d.codes.has(qcompact)) score += 5000
  if (qnorm && d.nt.includes(" " + qnorm + " ")) score += 400
  else if (qnorm && prefix && d.nt.includes(" " + qnorm)) score += 300
  if (inTitle === qt.length) score += 250
  const qset = new Set(qt.map((x) => x.t))
  const nums = qt.filter((x) => x.num).map((x) => x.t)
  if (nums.length) score -= extraQualifierPenalty(d, qset, nums)
  const hasScreen = qt.some((x) => x.g === SCREEN)
  const wantsProtect = qt.some((x) => x.g === PROTECT || x.g === CASE)
  if (hasScreen && !wantsProtect) {
    if (d.tt.some((w) => GROUP_OF.get(w) === PROTECT || w.startsWith("skarmskydd") || w === "skydd" || w === "privacy")) score -= 450
  }
  const modelTokens = qt.filter((x) => x.g < 0).map((x) => x.t).join(" ")
  if (modelTokens && d.modelKeys.has(modelTokens)) score += 120
  if (qt.length && d.tt.slice(0, qt.length).join(" ") === qnorm) score += 40
  score += d.inStock ? 15 : -70
  score -= Math.min(60, d.title.length * 0.3)
  score -= miss * 1000
  return score
}

function searchCats(ix: Index, qt: QTok[], prefix: boolean): CatDoc[] {
  const modelQ = qt.filter((x) => x.g < 0)
  if (!modelQ.length) return []
  const scored: { c: CatDoc; s: number }[] = []
  for (const c of ix.cats) {
    if (!c.tt.length) continue
    const cs = new Set(c.tt)
    let ok = true
    let s = 0
    for (const q of modelQ) {
      if (cs.has(q.t)) s += 10
      else if ((!q.num || (q.last && prefix)) && c.tt.some((w) => w.startsWith(q.t))) s += 5
      else {
        ok = false
        break
      }
    }
    if (!ok) continue
    const qn = modelQ.map((x) => x.t).join(" ")
    if (c.nt === qn) s += 50
    s -= (c.tt.length - modelQ.length) * 4
    s += Math.min(10, Math.log2(1 + c.count))
    s += c.depth >= 3 ? 3 : 0
    scored.push({ c, s })
  }
  scored.sort((a, b) => b.s - a.s || b.c.count - a.c.count)
  const out: CatDoc[] = []
  const seen = new Set<string>()
  for (const x of scored) {
    const key = x.c.name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(x.c)
    if (out.length >= 6) break
  }
  return out
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const t0 = Date.now()
  const qp: any = req.query || {}
  const raw = String(qp.q || "").slice(0, 120)
  const limit = Math.max(1, Math.min(100, parseInt(String(qp.limit || "24"), 10) || 24))
  const offset = Math.max(0, parseInt(String(qp.offset || "0"), 10) || 0)
  const sort = String(qp.sort || "relevance")
  const prefix = String(qp.prefix || "") === "1"

  res.setHeader("Cache-Control", "public, max-age=30")

  const toks: string[] = []
  for (const t of tokens(raw)) if (!STOP.has(t) && !toks.includes(t)) toks.push(t)
  if (!toks.length) {
    return res.json({ q: raw, count: 0, offset, limit, hits: [], categories: [], partial: false })
  }

  let ix: Index
  try {
    ix = await getIndex(req)
  } catch (e: any) {
    return res.status(503).json({ message: "Sökindexet kunde inte byggas", error: String(e?.message || e) })
  }

  const qt: QTok[] = toks.map((t, i) => ({ t, g: GROUP_OF.has(t) ? GROUP_OF.get(t)! : -1, num: isNum(t), last: i === toks.length - 1 }))
  const qnorm = toks.join(" ")
  const qcompact = raw.toLowerCase().replace(/\s+/g, "")

  let partial = false
  const scored: { d: Doc; s: number }[] = []
  for (const d of ix.docs) {
    const s = scoreDoc(d, qt, qnorm, qcompact, prefix, 0)
    if (s !== null) scored.push({ d, s })
  }
  if (!scored.length && qt.length >= 2) {
    partial = true
    for (const d of ix.docs) {
      const s = scoreDoc(d, qt, qnorm, qcompact, prefix, 1)
      if (s !== null) scored.push({ d, s })
    }
  }

  const byName = (a: Doc, b: Doc) => a.title.localeCompare(b.title, "sv")
  if (sort === "price_asc" || sort === "price_desc") {
    const dir = sort === "price_asc" ? 1 : -1
    scored.sort((a, b) => {
      const pa = a.d.price
      const pb = b.d.price
      if (pa === null && pb === null) return b.s - a.s
      if (pa === null) return 1
      if (pb === null) return -1
      return (pa - pb) * dir || b.s - a.s
    })
  } else if (sort === "newest" || sort === "created_at") {
    scored.sort((a, b) => b.d.created - a.d.created || b.s - a.s)
  } else if (sort === "name" || sort === "title") {
    scored.sort((a, b) => byName(a.d, b.d))
  } else {
    scored.sort((a, b) => b.s - a.s || byName(a.d, b.d))
  }

  const page = scored.slice(offset, offset + limit)
  const categories = offset === 0 ? searchCats(ix, qt, prefix) : []

  return res.json({
    q: raw,
    count: scored.length,
    offset,
    limit,
    partial,
    took_ms: Date.now() - t0,
    indexed: ix.docs.length,
    hits: page.map(({ d, s }) => ({
      id: d.id,
      title: d.title,
      handle: d.handle,
      thumbnail: d.thumbnail,
      href: d.href,
      in_stock: d.inStock,
      price: d.price,
      score: Math.round(s),
    })),
    categories: categories.map((c) => ({ id: c.id, name: c.name, path: c.path, count: c.count })),
  })
}
