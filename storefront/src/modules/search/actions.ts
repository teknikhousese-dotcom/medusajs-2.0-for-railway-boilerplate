"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

/**
 * Server-side product search used by the /results page.
 *
 * Backed by Medusa's own store product search (the `q` query param) instead of
 * a separate MeiliSearch service, so search works with no extra infrastructure.
 * Returns lightweight hits ({ id }); the results template hydrates full
 * products by id (with prices) afterwards.
 */
export async function search(query: string) {
  const q = (query || "").trim()
  if (!q) return []

  try {
    const { products } = await sdk.client.fetch<HttpTypes.StoreProductListResponse>(
      "/store/products",
      {
        method: "GET",
        query: { q, limit: 100, fields: "id" },
        cache: "no-store",
      }
    )
    return (products || []).map((p) => ({ id: p.id }))
  } catch {
    return []
  }
}
