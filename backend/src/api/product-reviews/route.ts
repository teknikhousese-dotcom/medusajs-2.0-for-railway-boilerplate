import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getPg, genId, ensureTables, q } from "../admin/reviews/db"

const TOKEN = "thmigrate-2026-reviews"

function cors(res: MedusaResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
}

function norm(s: any): string {
  return String(s || "").toLowerCase().replace(/\s+/g, " ").trim()
}

function clampRating(v: any): number {
  let n = parseInt(String(v), 10)
  if (isNaN(n) || n < 1) n = 5
  if (n > 5) n = 5
  return n
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  cors(res)
  res.status(204).send("")
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  cors(res)
  const pid = String((req.query.product_id as string) || "").trim()
  if (!pid) { res.json({ reviews: [], count: 0, average: 0 }); return }
  const pg = getPg(req.scope)
  await ensureTables(pg)
  const rows: any[] = await q(pg, 'SELECT "author","rating","comment","created_at" FROM "product_review" WHERE "product_id"=? ORDER BY "created_at" DESC', [pid])
  let sum = 0
  for (const r of rows) sum += Number(r.rating) || 0
  const count = rows.length
  const average = count ? Math.round((sum / count) * 10) / 10 : 0
  res.setHeader("Cache-Control", "public, max-age=120")
  res.json({ reviews: rows, count, average })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  cors(res)
  const body: any = req.body || {}
  if (body.token !== TOKEN) { res.status(403).json({ error: "forbidden" }); return }
  const items: any[] = Array.isArray(body.products) ? body.products : []
  const pg = getPg(req.scope)
  await ensureTables(pg)

  const query: any = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const map: any = {}
  let skip = 0
  const take = 500
  for (let guard = 0; guard < 40; guard++) {
    const out = await query.graph({ entity: "product", fields: ["id", "title"], pagination: { skip, take } })
    const data = (out && out.data) || []
    for (const p of data) { const k = norm(p.title); if (k && !map[k]) map[k] = { id: p.id, title: p.title } }
    if (data.length < take) break
    skip += take
  }

  if (body.replace) { await q(pg, 'DELETE FROM "product_review"', []) }

  const report: any = { productsIn: items.length, matched: 0, unmatched: 0, reviewsInserted: 0, unmatchedNames: [] }
  for (const it of items) {
    const name = String((it && it.name) || "").trim()
    const reviews = Array.isArray(it && it.reviews) ? it.reviews : []
    const hit = map[norm(name)]
    const productId = hit ? hit.id : ""
    const productTitle = hit ? hit.title : name
    if (hit) report.matched++
    else { report.unmatched++; if (report.unmatchedNames.length < 40) report.unmatchedNames.push(name.slice(0, 50)) }
    for (const rv of reviews) {
      try {
        const author = String((rv && rv.author) || "").slice(0, 120)
        const comment = String((rv && rv.comment) || "").slice(0, 4000)
        const rating = clampRating(rv && rv.rating)
        let created = String((rv && rv.date) || "").trim()
        if (!created) created = new Date().toISOString().slice(0, 10)
        await q(pg, 'INSERT INTO "product_review" ("id","product_id","product_title","author","rating","comment","is_read","created_at") VALUES (?,?,?,?,?,?,?,?)', [genId("prev"), productId, productTitle, author, rating, comment, true, created])
        report.reviewsInserted++
      } catch (e) {}
    }
  }
  res.json(report)
}
