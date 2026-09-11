"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

/**
 * Server-side product search used by the /results page.
 *
 * Backed by Medusa's own catalog (no MeiliSearch service needed). Medusa's raw
 * `q` param is a strict substring match, which fails on Swedish diacritics
 * ("skarm" vs "skärm") and on word order, so instead we keep a small in-memory
 * index of { id, folded title } for the whole published catalog and match every
 * query token against it, accent-folded. This mirrors teknikhouse's forgiving
 * search: "iphone 11 skarm" finds "iPhone 11 Skärm …".
 *
 * The index is cached in module scope for 10 minutes (the storefront runs as a
 * long-lived Node server on Railway, so this persists across requests). If the
 * index can't be built we fall back to Medusa's plain `q` search.
 */

type Idx = { id: string; t: string }
let INDEX: Idx[] | null = null
let INDEX_AT = 0
const TTL = 10 * 60 * 1000

const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g")
const fold = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(DIACRITICS, "")

async function loadIndex(): Promise<Idx[]> {
  const now = Date.now()
  if (INDEX && now - INDEX_AT < TTL) return INDEX

  const out: Idx[] = []
  let offset = 0
  const limit = 200
  for (let i = 0; i < 200; i++) {
    const { products, count } =
      await sdk.client.fetch<HttpTypes.StoreProductListResponse>(
        "/store/products",
        {
          method: "GET",
          query: { limit, offset, fields: "id,title" },
          cache: "no-store",
        }
      )
    const list = products || []
    for (const p of list) out.push({ id: p.id as string, t: fold(p.title || "") })
    offset += list.length
    if (list.length < limit || offset >= (count || 0)) break
  }

  INDEX = out
  INDEX_AT = now
  return out
}

export async function search(query: string) {
  const folded = fold((query || "").trim())
  if (!folded) return []
  const tokens = folded.split(/\s+/).filter(Boolean)
  if (!tokens.length) return []

  try {
    const index = await loadIndex()
    const hits = index.filter((p) => tokens.every((tok) => p.t.includes(tok)))
    // Cap the id set: the results page fetches every id in one request, so an
    // unbounded list (a broad term like "skarm" matches hundreds) overflows the
    // query string and crashes the page. 100 is plenty for a search result set.
    return hits.slice(0, 100).map((p) => ({ id: p.id }))
  } catch {
    // Fallback: Medusa's plain substring search if the index build failed.
    try {
      const { products } =
        await sdk.client.fetch<HttpTypes.StoreProductListResponse>(
          "/store/products",
          {
            method: "GET",
            query: { q: query, limit: 100, fields: "id" },
            cache: "no-store",
          }
        )
      return (products || []).map((p) => ({ id: p.id }))
    } catch {
      return []
    }
  }
}
