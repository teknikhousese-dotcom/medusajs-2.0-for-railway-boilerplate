// Live-betyg och senaste omdömen från Trustindex för teknikhouse.se.
// Hämtas på servern från den publika omdömessidan och läses ur dess JSON-LD
// (aggregateRating och review). Next cachar svaret i 6 timmar (revalidate 21600).
// Om hämtningen misslyckas används senast kända värden, så sidan aldrig går sönder.
// Används bara i synligt UI. Lägg INTE till aggregateRating i butikens egen
// Organization JSON-LD, Google tillåter inte egna omdömen i den markupen.

import type { Review } from "./trustindex-reviews"

export const TRUSTINDEX_URL = "https://www.trustindex.io/reviews/teknikhouse.se"

const REVALIDATE_SECONDS = 21600
const TIMEOUT_MS = 6000
const FALLBACK_RATING = 4.6
const FALLBACK_COUNT = 2116
const MAX_REVIEWS = 14
const MAX_TEXT = 260
const MONTHS = ["jan", "feb", "mars", "apr", "maj", "juni", "juli", "aug", "sep", "okt", "nov", "dec"]

export type TrustindexData = {
  rating: number
  count: number
  reviews: Review[]
  live: boolean
}

let lastGood: TrustindexData | null = null

export function formatRating(rating: number): string {
  return rating.toFixed(1).replace(".", ",")
}

function groupThousands(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

export function formatCount(count: number): string {
  if (count >= 100) return groupThousands(Math.floor(count / 100) * 100) + "+"
  return groupThousands(count)
}

function isUpper(word: string): boolean {
  const c = word.charAt(0)
  return c !== "" && c === c.toUpperCase() && c !== c.toLowerCase()
}

function shortName(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "Kund"
  const last = parts.slice(1).find(isUpper)
  return last ? parts[0] + " " + last.charAt(0) + "." : parts[0]
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear()
}

function clip(text: string): string {
  const t = text.replace(/\s+/g, " ").trim()
  if (t.length <= MAX_TEXT) return t
  const cut = t.slice(0, MAX_TEXT)
  const sp = cut.lastIndexOf(" ")
  return (sp > 120 ? cut.slice(0, sp) : cut).replace(/[\s,.;:!-]+$/, "") + " …"
}

function findAggregate(node: any): any {
  if (!node || typeof node !== "object") return null
  if (Array.isArray(node)) {
    for (const item of node) {
      const hit = findAggregate(item)
      if (hit) return hit
    }
    return null
  }
  if (node.aggregateRating) return node
  if (node["@graph"]) return findAggregate(node["@graph"])
  return null
}

function parseHtml(html: string): any {
  const re = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g
  let m: RegExpExecArray | null = re.exec(html)
  while (m !== null) {
    let hit: any = null
    try {
      hit = findAggregate(JSON.parse(m[1]))
    } catch (err) {
      hit = null
    }
    if (hit) return hit
    m = re.exec(html)
  }
  return null
}

function toReviews(list: any): Review[] {
  if (!Array.isArray(list)) return []
  const sorted = list
    .filter((r: any) => r && typeof r === "object")
    .map((r: any) => ({ r, t: Date.parse(String(r.datePublished || "")) || 0 }))
    .sort((a: { t: number }, b: { t: number }) => b.t - a.t)
  const out: Review[] = []
  for (const item of sorted) {
    const r = item.r
    const stars = Number(r.reviewRating && r.reviewRating.ratingValue)
    const text = clip(String(r.reviewBody || ""))
    if (!(stars >= 4) || text.length < 8) continue
    out.push({
      name: shortName(String((r.author && r.author.name) || "")),
      date: formatDate(String(r.datePublished || "")),
      source: "Trustindex",
      stars: Math.min(5, Math.round(stars)),
      text,
    })
    if (out.length >= MAX_REVIEWS) break
  }
  return out
}

function fallback(): TrustindexData {
  if (lastGood) return lastGood
  return { rating: FALLBACK_RATING, count: FALLBACK_COUNT, reviews: [], live: false }
}

export async function getTrustindex(): Promise<TrustindexData> {
  try {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Trustindex timeout")), TIMEOUT_MS)
    })
    const res = await Promise.race([
      fetch(TRUSTINDEX_URL, {
        next: { revalidate: REVALIDATE_SECONDS },
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; TeknikhouseBot/1.0; +https://www.teknikhouse.se)",
          "accept-language": "sv-SE,sv;q=0.9,en;q=0.5",
          accept: "text/html",
        },
      }),
      timeout,
    ])
    if (!res.ok) return fallback()
    const node = parseHtml(await res.text())
    const agg = node && node.aggregateRating
    const rating = Number(agg && agg.ratingValue)
    const count = Number(agg && (agg.reviewCount || agg.ratingCount))
    if (!(rating >= 1 && rating <= 5) || !(count > 0)) return fallback()
    const data: TrustindexData = { rating, count, reviews: toReviews(node.review), live: true }
    lastGood = data
    return data
  } catch (err) {
    return fallback()
  }
}
