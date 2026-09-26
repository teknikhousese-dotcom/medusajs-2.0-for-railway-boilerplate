import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, q, ensureTables, genId, normEmail, validEmail, stockStatus } from "./db"

// Admin: Inventering / Lagerbevakning (Wiki statistics.php?action=stockreminders)
//  GET  /admin/lagerbevakning           -> { products:[{product_id,title,sku,handle,in_stock,reminders:[{id,email,created_at,source}]}], total, products_count }
//       ?status=notified                -> already notified reminders instead of active ones
//  POST /admin/lagerbevakning { mode:"import", rows:[{wiki_id, sku, title, emails:[...]}] }
//       Imports Wiki reminders; product mapped by product.metadata.wiki_id, then by exact title. Idempotent.

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ error: "Databasen är inte tillgänglig." })
  await ensureTables(pg)
  const notified = String((req.query as any)?.status || "") === "notified"
  const rows = await q(pg, `SELECT "id","email","product_id","variant_id","product_title","product_handle","sku","wiki_product_id","page_url","source","created_at","notified_at"
    FROM "stock_reminder" WHERE "deleted_at" IS NULL AND "notified_at" IS ${notified ? "NOT " : ""}NULL ORDER BY "created_at" ASC`)
  const pids = [...new Set(rows.map((r: any) => r.product_id).filter(Boolean))] as string[]
  const stock = await stockStatus(pg, pids)
  let live: Record<string, any> = {}
  if (pids.length) {
    try {
      const ps = await q(pg, `SELECT "id","title","handle" FROM "product" WHERE "id" IN (${pids.map(() => "?").join(",")})`, pids)
      for (const p of ps) live[p.id] = p
    } catch {}
  }
  const groups: Record<string, any> = {}
  for (const r of rows) {
    const key = r.product_id || ("wiki:" + (r.wiki_product_id || r.product_title || r.id))
    if (!groups[key]) {
      const lp = r.product_id ? live[r.product_id] : null
      groups[key] = {
        key,
        product_id: r.product_id,
        wiki_product_id: r.wiki_product_id,
        title: lp?.title || r.product_title || "(okänd produkt)",
        handle: lp?.handle || r.product_handle || null,
        sku: r.sku || null,
        in_stock: r.product_id && r.product_id in stock ? stock[r.product_id] : null,
        reminders: [],
      }
    }
    if (!groups[key].sku && r.sku) groups[key].sku = r.sku
    groups[key].reminders.push({ id: r.id, email: r.email, created_at: r.created_at, notified_at: r.notified_at, source: r.source, page_url: r.page_url })
  }
  const products = Object.values(groups).sort((a: any, b: any) => String(a.sku || "").localeCompare(String(b.sku || ""), "sv"))
  return res.json({ products, total: rows.length, products_count: products.length })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as any
  if (body.mode !== "import") return res.status(400).json({ error: "Okänt läge." })
  const rows: any[] = Array.isArray(body.rows) ? body.rows : []
  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ error: "Databasen är inte tillgänglig." })
  await ensureTables(pg)
  let inserted = 0, existing = 0, invalid = 0, mapped = 0, unmapped = 0
  const unmappedIds: number[] = []
  for (const r of rows) {
    const wikiId = Number(r.wiki_id) || null
    const title = String(r.title || "").trim()
    let prod: any = null
    if (wikiId) {
      const a = await q(pg, `SELECT "id","title","handle" FROM "product" WHERE "deleted_at" IS NULL AND "metadata"->>'wiki_id' = ? ORDER BY "created_at" LIMIT 1`, [String(wikiId)])
      prod = a[0] || null
    }
    if (!prod && title) {
      const b = await q(pg, `SELECT "id","title","handle" FROM "product" WHERE "deleted_at" IS NULL AND lower("title") = lower(?) ORDER BY "created_at" LIMIT 1`, [title])
      prod = b[0] || null
    }
    if (prod) mapped++
    else { unmapped++; if (wikiId) unmappedIds.push(wikiId) }
    const emails: string[] = Array.isArray(r.emails) ? r.emails : []
    for (const raw of emails) {
      const email = normEmail(raw)
      if (!validEmail(email)) { invalid++; continue }
      const dup = await q(pg, `SELECT "id" FROM "stock_reminder" WHERE "deleted_at" IS NULL AND "notified_at" IS NULL AND "email" = ? AND (("product_id" IS NOT NULL AND "product_id" = ?) OR ("wiki_product_id" IS NOT NULL AND "wiki_product_id" = ?)) LIMIT 1`, [email, prod?.id || "", wikiId || -1])
      if (dup.length) { existing++; continue }
      await q(pg, `INSERT INTO "stock_reminder" ("id","email","product_id","product_title","product_handle","sku","wiki_product_id","source") VALUES (?,?,?,?,?,?,?,'wiki') ON CONFLICT DO NOTHING`,
        [genId(), email, prod?.id || null, prod?.title || title || null, prod?.handle || null, r.sku ? String(r.sku).slice(0, 100) : null, wikiId])
      inserted++
    }
  }
  return res.json({ received: rows.length, mapped, unmapped, unmapped_wiki_ids: unmappedIds, inserted, existing, invalid })
}
