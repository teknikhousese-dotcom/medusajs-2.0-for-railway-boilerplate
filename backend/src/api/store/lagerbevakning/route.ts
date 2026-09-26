import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, q, ensureTables, genId, normEmail, validEmail } from "../../admin/lagerbevakning/db"

// Public "Bevaka produkt" signup (Wiki: /ajax/?action=productpage-stockreminder).
// POST { email, product_id, variant_id?, page_url?, website? (honeypot) }
// Responses mirror Wiki: OK | IS-SUBSCRIBER | ERR-EMAIL.
// No e-mail is sent here; back-in-stock mails are only sent manually from admin (Inventering).
export const AUTHENTICATE = false

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 8
const hits: Map<string, number[]> = new Map()

function clientIp(req: MedusaRequest): string {
  const xf = String((req.headers["x-forwarded-for"] as string) || "").split(",")[0].trim()
  return xf || String((req as any).ip || (req.socket && req.socket.remoteAddress) || "unknown")
}

function limited(ip: string): boolean {
  const now = Date.now()
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  arr.push(now)
  hits.set(ip, arr)
  if (hits.size > 5000) {
    for (const [k, v] of hits) { if (!v.length || now - v[v.length - 1] > WINDOW_MS) hits.delete(k) }
  }
  return arr.length > MAX_PER_WINDOW
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as any
  if (body.website) return res.json({ ok: true, result: "OK" })
  const ip = clientIp(req)
  if (limited(ip)) return res.status(429).json({ ok: false, result: "ERR-RATE", error: "För många försök. Försök igen om en stund." })

  const email = normEmail(body.email)
  if (!email || !validEmail(email)) {
    return res.status(400).json({ ok: false, result: "ERR-EMAIL", error: "Du måste ange en giltig e-postadress." })
  }
  const productId = String(body.product_id || "").trim()
  if (!productId || productId.length > 100) return res.status(400).json({ ok: false, result: "ERR-PRODUCT", error: "Produkt saknas." })
  const variantId = body.variant_id ? String(body.variant_id).slice(0, 100) : null
  let pageUrl = body.page_url ? String(body.page_url).slice(0, 500) : null
  if (pageUrl && !/^\/[^\s]*$/.test(pageUrl)) pageUrl = null

  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ ok: false, result: "ERR", error: "Databasen är inte tillgänglig." })
  try {
    await ensureTables(pg)
    const prod = await q(pg, `SELECT "id", "title", "handle", "metadata"->>'wiki_id' AS "wiki_id" FROM "product" WHERE "id" = ? AND "deleted_at" IS NULL LIMIT 1`, [productId])
    if (!prod.length) return res.status(404).json({ ok: false, result: "ERR-PRODUCT", error: "Produkten hittades inte." })
    const p = prod[0]
    let sku: string | null = null
    try {
      const v = await q(pg, `SELECT "sku" FROM "product_variant" WHERE "product_id" = ? AND "deleted_at" IS NULL ${variantId ? `AND "id" = ?` : ""} ORDER BY "created_at" LIMIT 1`, variantId ? [productId, variantId] : [productId])
      sku = v[0]?.sku || null
    } catch {}
    const existing = await q(pg, `SELECT "id" FROM "stock_reminder" WHERE "email" = ? AND "product_id" = ? AND "deleted_at" IS NULL AND "notified_at" IS NULL LIMIT 1`, [email, productId])
    if (existing.length) return res.json({ ok: true, result: "IS-SUBSCRIBER", id: existing[0].id })
    const wikiId = p.wiki_id && /^\d+$/.test(String(p.wiki_id)) ? Number(p.wiki_id) : null
    const id = genId()
    await q(pg, `INSERT INTO "stock_reminder" ("id","email","product_id","variant_id","product_title","product_handle","sku","wiki_product_id","page_url","source","ip") VALUES (?,?,?,?,?,?,?,?,?,'storefront',?) ON CONFLICT DO NOTHING`,
      [id, email, p.id, variantId, p.title, p.handle, sku, wikiId, pageUrl, ip.slice(0, 64)])
    return res.json({ ok: true, result: "OK", id })
  } catch (e: any) {
    console.warn("[lagerbevakning] store " + (e?.message || e))
    return res.status(500).json({ ok: false, result: "ERR", error: "Något gick fel. Försök igen." })
  }
}
