"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

/**
 * Produktsök för /results-sidan.
 *
 * Primärt: backendens egen sökmotor GET /store/search (relevansrankning,
 * svenska synonymer, rätt totalantal och sidindelning). Om den inte svarar
 * (t.ex. under en deploy) används ett enklare index här i storefronten, där
 * alla ord i sökningen måste finnas i titeln.
 */

export type SearchSort = "relevance" | "price_asc" | "price_desc" | "newest" | "name"

export type SearchHit = {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  href: string
  in_stock: boolean
  price: number | null
}

export type SearchCategory = { id: string; name: string; path: string; count: number }

export type SearchResponse = {
  q: string
  count: number
  offset: number
  limit: number
  partial: boolean
  hits: SearchHit[]
  categories: SearchCategory[]
}

const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

type Idx = { id: string; t: string; handle: string; title: string; thumbnail: string | null }
let INDEX: Idx[] | null = null
let INDEX_AT = 0
const TTL = 10 * 60 * 1000

const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g")
const fold = (s: string) => (s || "").toLowerCase().normalize("NFD").replace(DIACRITICS, "")

async function loadIndex(): Promise<Idx[]> {
  const now = Date.now()
  if (INDEX && now - INDEX_AT < TTL) return INDEX
  const out: Idx[] = []
  let offset = 0
  const limit = 100
  for (let i = 0; i < 200; i++) {
    const { products, count } = await sdk.client.fetch<HttpTypes.StoreProductListResponse>("/store/products", {
      method: "GET",
      query: { limit, offset, fields: "id,title,handle,thumbnail" },
      cache: "no-store",
    })
    const list = products || []
    for (const p of list) {
      out.push({
        id: p.id as string,
        t: fold(p.title || ""),
        handle: p.handle || "",
        title: p.title || "",
        thumbnail: p.thumbnail || null,
      })
    }
    offset += list.length
    if (list.length < limit || offset >= (count || 0)) break
  }
  INDEX = out
  INDEX_AT = now
  return out
}

async function fallbackSearch(q: string, limit: number, offset: number): Promise<SearchResponse> {
  const tokens = fold(q.trim()).split(/\s+/).filter(Boolean)
  const empty: SearchResponse = { q, count: 0, offset, limit, partial: false, hits: [], categories: [] }
  if (!tokens.length) return empty
  try {
    const index = await loadIndex()
    const all = index.filter((p) => tokens.every((tok) => p.t.includes(tok)))
    return {
      ...empty,
      count: all.length,
      hits: all.slice(offset, offset + limit).map((p) => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        thumbnail: p.thumbnail,
        href: "/products/" + p.handle,
        in_stock: true,
        price: null,
      })),
    }
  } catch {
    return empty
  }
}

export async function searchProducts({
  query,
  page = 1,
  limit = 24,
  sort = "relevance",
}: {
  query: string
  page?: number
  limit?: number
  sort?: SearchSort
}): Promise<SearchResponse> {
  const q = safeDecode(query || "").trim()
  const offset = Math.max(0, (Math.max(1, page) - 1) * limit)
  if (!q) return { q, count: 0, offset, limit, partial: false, hits: [], categories: [] }
  try {
    const res = await sdk.client.fetch<SearchResponse>("/store/search", {
      method: "GET",
      query: { q, limit, offset, sort },
      cache: "no-store",
    })
    if (res && Array.isArray(res.hits)) {
      return {
        q,
        count: Number(res.count) || 0,
        offset,
        limit,
        partial: !!res.partial,
        hits: res.hits,
        categories: res.categories || [],
      }
    }
  } catch {
    /* backend-sök saknas eller svarar inte: använd reserven nedan */
  }
  return fallbackSearch(q, limit, offset)
}

/** Äldre anrop: bara id:n för de 100 första träffarna. */
export async function search(query: string) {
  const r = await searchProducts({ query, limit: 100 })
  return r.hits.map((h) => ({ id: h.id }))
}
