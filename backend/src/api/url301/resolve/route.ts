import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// Publik uppslagning for gamla Wiki-adresser (SEO). Storefrontens middleware fragar
// har nar en /avdelning/.../slug-adress inte ar en kategori. Svar:
//   { kind: "product" }            produkten finns och ar publicerad, visa den
//   { kind: "category" }           adressen ar en aktiv kategori
//   { kind: "redirect", to: "/x" } 301 till ny adress (produkt eller narmaste kategori)
//   { kind: "none" }               inget hittat, visa 404
// Ordning: (a) url301-regel, (b) produkt via handle / gammal Wiki-adress i metadata,
// (c) liknande produkt i samma modellkategori, (d) narmaste aktiva kategori.

type Cat = { id: string; handle: string; parent: string | null; active: boolean }
type Prod = { id: string; handle: string; published: boolean; wiki: string; pin: string; cats: string[] }

let INDEX: {
  at: number
  cats: Map<string, Cat>
  catByHandle: Map<string, Cat>
  paths: Map<string, string>
  prodByHandle: Map<string, Prod>
  prodByWiki: Map<string, Prod>
  prodsByCat: Map<string, Prod[]>
} | null = null
let BUILDING: Promise<any> | null = null
const TTL = 10 * 60 * 1000

async function rows(pg: any, sql: string, b: any[] = []) {
  const r = await pg.raw(sql, b)
  return (r && r.rows) || r || []
}

function normPath(s: string): string {
  let v = String(s || "").trim()
  const q = v.indexOf("?")
  if (q >= 0) v = v.slice(0, q)
  const h = v.indexOf("#")
  if (h >= 0) v = v.slice(0, h)
  try { v = decodeURIComponent(v) } catch (e) {}
  if (v.charAt(0) !== "/") v = "/" + v
  while (v.length > 1 && v.charAt(v.length - 1) === "/") v = v.slice(0, -1)
  return v.toLowerCase()
}

async function buildIndex(scope: any) {
  const pg = scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const catRows = await rows(pg, 'SELECT id, handle, parent_category_id, is_active, is_internal FROM "product_category" WHERE deleted_at IS NULL')
  const cats = new Map<string, Cat>()
  const catByHandle = new Map<string, Cat>()
  for (const r of catRows) {
    const c: Cat = { id: r.id, handle: String(r.handle || ""), parent: r.parent_category_id || null, active: !!r.is_active && !r.is_internal }
    cats.set(c.id, c)
    if (c.handle) catByHandle.set(c.handle, c)
  }
  const paths = new Map<string, string>()
  const pathOf = (c: Cat, guard: number): string => {
    if (paths.has(c.id)) return paths.get(c.id) as string
    const p = c.parent ? cats.get(c.parent) : undefined
    let r = c.handle
    if (p && guard < 10) {
      const seg = p.handle && c.handle.indexOf(p.handle + "-") === 0 ? c.handle.slice(p.handle.length + 1) : c.handle
      r = pathOf(p, guard + 1) + "/" + seg
    }
    paths.set(c.id, r)
    return r
  }
  for (const c of cats.values()) pathOf(c, 0)

  const prodRows = await rows(pg, 'SELECT id, handle, status, metadata->>\'wiki_url_path\' AS wiki, metadata->>\'url_category\' AS pin FROM "product" WHERE deleted_at IS NULL')
  const linkRows = await rows(pg, 'SELECT product_id, product_category_id FROM "product_category_product"')
  const catsOf = new Map<string, string[]>()
  for (const l of linkRows) {
    if (!catsOf.has(l.product_id)) catsOf.set(l.product_id, [])
    ;(catsOf.get(l.product_id) as string[]).push(l.product_category_id)
  }
  const prodByHandle = new Map<string, Prod>()
  const prodByWiki = new Map<string, Prod>()
  const prodsByCat = new Map<string, Prod[]>()
  for (const r of prodRows) {
    const p: Prod = { id: r.id, handle: String(r.handle || ""), published: r.status === "published", wiki: r.wiki ? normPath(r.wiki) : "", pin: r.pin || "", cats: catsOf.get(r.id) || [] }
    if (!p.handle) continue
    const prev = prodByHandle.get(p.handle)
    if (!prev || (!prev.published && p.published)) prodByHandle.set(p.handle, p)
    if (p.wiki) {
      const pw = prodByWiki.get(p.wiki)
      if (!pw || (!pw.published && p.published)) prodByWiki.set(p.wiki, p)
    }
    if (p.published) {
      for (const cid of p.cats) {
        if (!prodsByCat.has(cid)) prodsByCat.set(cid, [])
        ;(prodsByCat.get(cid) as Prod[]).push(p)
      }
    }
  }
  INDEX = { at: Date.now(), cats, catByHandle, paths, prodByHandle, prodByWiki, prodsByCat }
  return INDEX
}

async function getIndex(scope: any) {
  if (INDEX && Date.now() - INDEX.at < TTL) return INDEX
  if (!BUILDING) {
    BUILDING = buildIndex(scope).finally(() => { BUILDING = null })
  }
  if (INDEX) {
    BUILDING.catch(() => null)
    return INDEX
  }
  return BUILDING
}

function productPath(ix: any, p: Prod): string {
  const pin = p.pin ? ix.catByHandle.get(p.pin) : undefined
  if (pin && pin.active) return "/" + ix.paths.get(pin.id) + "/" + p.handle
  let best = ""
  for (const cid of p.cats) {
    const c = ix.cats.get(cid)
    if (!c || !c.active) continue
    const path = ix.paths.get(cid) || ""
    if (path.length > best.length) best = path
  }
  return best ? "/" + best + "/" + p.handle : "/products/" + p.handle
}

function tokens(s: string): string[] {
  return String(s || "").toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 0)
}

function similarity(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0
  const A = new Set(a)
  const B = new Set(b)
  let inter = 0
  for (const t of A) if (B.has(t)) inter++
  return inter / (A.size + B.size - inter)
}

// Ord som far skilja gamla och nya slugen at utan att det blir en annan produkt.
// Modell, farg, typ (lcd/oled) m.m. maste vara lika, annars blir det kategori-301 i stallet.
const GENERIC = new Set(["livstidsgaranti", "garanti", "original", "org", "hogsta", "kvalitet", "kvalite", "premium", "ny", "nya", "med", "och", "for", "till", "i", "av", "pa", "inkl", "inklusive", "hog"])

// Sant om alla ord i a som saknas i b ar generiska.
function onlyGeneric(a: string[], b: string[]): boolean {
  const B = new Set(b)
  for (const t of a) if (!B.has(t) && !GENERIC.has(t)) return false
  return true
}

// Narmaste aktiva kategori langs sokvagen: /a/b/c/d -> a-b-c-d, a-b-c, a-b, a
function nearestCategory(ix: any, segs: string[]): Cat | null {
  for (let n = segs.length; n >= 1; n--) {
    const c = ix.catByHandle.get(segs.slice(0, n).join("-"))
    if (c && c.active) return c
    if (c && !c.active) {
      let p = c.parent ? ix.cats.get(c.parent) : undefined
      let guard = 0
      while (p && !p.active && guard < 10) { p = p.parent ? ix.cats.get(p.parent) : undefined; guard++ }
      if (p && p.active) return p
    }
  }
  return null
}

const MEMO = new Map<string, any>()

export async function resolvePath(scope: any, raw: string) {
  const path = normPath(raw)
  const segs = path.split("/").filter(Boolean)
  if (!segs.length) return { kind: "none" }

  const ix: any = await getIndex(scope)
  const memoKey = ix.at + "|" + path
  if (MEMO.has(memoKey)) return MEMO.get(memoKey)
  if (MEMO.size > 5000) MEMO.clear()

  const done = (r: any) => {
    if (r && r.kind === "redirect" && normPath(r.to) === path) r = { kind: "none" }
    MEMO.set(memoKey, r)
    return r
  }

  // (a) exakt url301-regel
  try {
    const svc = scope.resolve(Modules.STORE)
    const stores = await svc.listStores({}, { take: 1 })
    const meta: any = (stores && stores[0] && stores[0].metadata) || {}
    const rules = Array.isArray(meta.url301) ? meta.url301 : []
    for (const r of rules) {
      if (r && r.to && normPath(r.from) === path && normPath(r.to) !== path) return done({ kind: "redirect", to: r.to, via: "url301" })
    }
  } catch (e) {}

  const last = segs[segs.length - 1]
  const own = ix.catByHandle.get(segs.join("-"))
  if (own && own.active) {
    const cp = "/" + ix.paths.get(own.id)
    return done(cp === path ? { kind: "category" } : { kind: "redirect", to: cp, via: "category" })
  }

  // (b) produkt via handle eller gammal Wiki-adress
  const byHandle = ix.prodByHandle.get(last)
  const byWiki = ix.prodByWiki.get(path)
  // Gammal Wiki-adress (metadata.wiki_url_path) till en publicerad produkt: 301 till produktens
  // aktuella adress under huvudkategorin (metadata.url_category, annars djupaste kategorin).
  // Da foljer adressen alltid ratt kategori och ingen url301-regel per produkt behovs.
  if (byWiki && byWiki.published && (!byHandle || !byHandle.published || byHandle.id === byWiki.id)) {
    const canon = productPath(ix, byWiki)
    if (canon.indexOf("/products/") !== 0 && normPath(canon) !== path) return done({ kind: "redirect", to: canon, via: "wiki_url_path" })
  }
  if (byHandle && byHandle.published) return done({ kind: "product" })
  if (byWiki && byWiki.published) return done({ kind: "redirect", to: productPath(ix, byWiki), via: "wiki_url_path" })

  // (c) liknande produkt i samma modellkategori (eller produktens egen kategori om den ar avpublicerad)
  const home = (byHandle && (byHandle.pin ? ix.catByHandle.get(byHandle.pin) : ix.cats.get(byHandle.cats[0]))) || nearestCategory(ix, segs.slice(0, -1))
  const near = nearestCategory(ix, segs.slice(0, -1))
  const want = tokens(last)
  if (want.length >= 3) {
    let best: Prod | null = null
    let score = 0
    const seen = new Set<string>()
    for (const c of [home, near]) {
      if (!c) continue
      for (const p of ix.prodsByCat.get(c.id) || []) {
        if (seen.has(p.id)) continue
        seen.add(p.id)
        const have = tokens(p.handle)
        if (!onlyGeneric(want, have) || !onlyGeneric(have, want)) continue
        const s = similarity(want, have)
        if (s > score) { score = s; best = p }
      }
    }
    if (best && score >= 0.5) return done({ kind: "redirect", to: productPath(ix, best), via: "fuzzy", score: Math.round(score * 100) / 100 })
  }

  // (d) narmaste aktiva kategori
  let cat: Cat | null = null
  if (home && home.active) cat = home
  if (!cat) cat = near
  if (!cat) cat = nearestCategory(ix, segs)
  if (cat) return done({ kind: "redirect", to: "/" + ix.paths.get(cat.id), via: "category" })
  return done({ kind: "none" })
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const p = String((req.query as any).p || (req.query as any).path || "")
    const r = await resolvePath(req.scope, p)
    res.setHeader("Cache-Control", "public, max-age=300")
    res.json(r)
  } catch (e) {
    res.json({ kind: "none" })
  }
}
