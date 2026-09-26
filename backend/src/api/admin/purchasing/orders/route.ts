import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, ensureTables, genId, q, normName } from "../db"

function ts(v: any): string | null {
  if (v == null || v === "") return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope); await ensureTables(pg)
  const status = (req.query.status as string) || undefined
  let orders: any[]
  if (status) orders = await q(pg, `SELECT * FROM "purchase_order" WHERE "deleted_at" IS NULL AND "status" = ? ORDER BY "created_at" DESC`, [status])
  else orders = await q(pg, `SELECT * FROM "purchase_order" WHERE "deleted_at" IS NULL ORDER BY "created_at" DESC`)
  const out: any[] = []
  for (const o of orders) {
    const lines = await q(pg, `SELECT * FROM "purchase_order_line" WHERE "purchase_order_id" = ? AND "deleted_at" IS NULL`, [o.id])
    out.push({ ...o, line_count: lines.length,
      total_ordered: lines.reduce((s: number, l: any) => s + (l.qty_ordered || 0), 0),
      total_delivered: lines.reduce((s: number, l: any) => s + (l.qty_delivered || 0), 0) })
  }
  res.json({ orders: out, count: out.length })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope); await ensureTables(pg)
  const b: any = req.body || {}
  let supplierId: string | null = b.supplier_id || null
  let supplier_name = b.supplier_name || null
  if (!supplierId && supplier_name) {
    const s = await q(pg, `SELECT "id" FROM "supplier" WHERE lower(trim("name")) = ? AND "deleted_at" IS NULL`, [normName(supplier_name)])
    supplierId = s[0]?.id || null
  }
  if (!supplierId) { res.status(400).json({ message: "supplier_id is required" }); return }
  if (!supplier_name) {
    const s = await q(pg, `SELECT "name" FROM "supplier" WHERE "id" = ?`, [supplierId])
    supplier_name = s[0]?.name || null
  }
  const wikiId = b.wiki_id != null && b.wiki_id !== "" ? Number(b.wiki_id) : null
  if (wikiId != null && !isNaN(wikiId)) {
    const ex = await q(pg, `SELECT * FROM "purchase_order" WHERE "wiki_id" = ? AND "deleted_at" IS NULL`, [wikiId])
    if (ex.length) { res.json({ order: ex[0], line_count: 0, existing: true }); return }
  }
  const status = ["open", "sent", "archived"].includes(b.status) ? b.status : "open"
  const createdAt = ts(b.created_at)
  const poId = genId("po")
  await q(pg, `INSERT INTO "purchase_order" ("id","supplier_id","supplier_name","status","reference","wiki_id","sent_at","archived_at","comment","created_at") VALUES (?,?,?,?,?,?,?,?,?,COALESCE(?::timestamptz, now()))`,
    [poId, supplierId, supplier_name, status, b.reference || null, wikiId, ts(b.sent_at), ts(b.archived_at) || (status === "archived" ? new Date().toISOString() : null), b.comment || null, createdAt])
  const lines = Array.isArray(b.lines) ? b.lines : []
  const created: any[] = []
  for (const l of lines) {
    if (!l || (!l.title && !l.variant_id)) continue
    const lid = genId("pol")
    await q(pg, `INSERT INTO "purchase_order_line" ("id","purchase_order_id","variant_id","product_id","inventory_item_id","title","sku","qty_ordered","qty_delivered","min_stock","cost") VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [lid, poId, l.variant_id || null, l.product_id || null, l.inventory_item_id || null, l.title || "", l.sku || null,
       Number(l.qty_ordered) || 0, Number(l.qty_delivered) || 0, Number(l.min_stock) || 0, l.cost != null && l.cost !== "" ? Number(l.cost) : null])
    created.push(lid)
  }
  const rows = await q(pg, `SELECT * FROM "purchase_order" WHERE "id" = ?`, [poId])
  res.json({ order: rows[0], line_count: created.length })
}
