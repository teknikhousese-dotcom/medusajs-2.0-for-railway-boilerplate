import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Order-flikar (som Wikinggruppens manuella order-flikar).
 * Order flyttas till en flik genom att sätta metadata.orderflik på ordern.
 * Medusas /admin/orders kan inte filtrera på metadata, så denna route sköter
 * flik-listning (via rå SQL på order.metadata) + hantering av egna flikar.
 *
 *  GET  /admin/order-fliks                    → { fliks:[{key,label,is_system,count}] }
 *  GET  /admin/order-fliks?flik=<key>&limit=&offset=  → { orders, count }
 *  POST /admin/order-fliks  { kind:"create", name } | { kind:"rename", key, name } | { kind:"delete", key }
 */

const SYSTEM = [
  { key: "nya", label: "Nya" },
  { key: "makulerade", label: "Makulerade" },
  { key: "arkiverade", label: "Arkiverade" },
]

function pg(scope: any) { return scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) }
function query(scope: any) { return scope.resolve(ContainerRegistrationKeys.QUERY) }

async function ensure(p: any) {
  await p.raw(`CREATE TABLE IF NOT EXISTS "order_flik" (
    "key" text PRIMARY KEY, "label" text NOT NULL, "is_system" boolean DEFAULT false, "sort" int DEFAULT 100
  )`)
  for (let i = 0; i < SYSTEM.length; i++) {
    const s = SYSTEM[i]
    await p.raw(`INSERT INTO "order_flik" ("key","label","is_system","sort") VALUES (?, ?, true, ?) ON CONFLICT ("key") DO NOTHING`, [s.key, s.label, i])
  }
}

const nyaCond = `(o.metadata->>'orderflik' IS NULL OR o.metadata->>'orderflik' IN ('nya',''))`

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const p = pg(req.scope)
  await ensure(p)
  const flik = String((req.query as any).flik || "")

  if (!flik) {
    const defs = ((await p.raw(`SELECT "key","label","is_system","sort" FROM "order_flik" ORDER BY "sort" ASC, "label" ASC`)).rows) || []
    const grp = ((await p.raw(`SELECT COALESCE(NULLIF(o.metadata->>'orderflik',''),'nya') AS f, count(*)::int AS c FROM "order" o WHERE o.deleted_at IS NULL GROUP BY f`)).rows) || []
    const cmap: any = {}
    for (const g of grp) cmap[g.f] = g.c
    const fliks = defs.map((d: any) => ({ key: d.key, label: d.label, is_system: d.is_system, count: cmap[d.key] || 0 }))
    return res.json({ fliks })
  }

  const limit = Math.min(200, parseInt(String((req.query as any).limit || "50")) || 50)
  const offset = parseInt(String((req.query as any).offset || "0")) || 0
  const isNya = flik === "nya"
  const cond = isNya ? nyaCond : `o.metadata->>'orderflik' = ?`
  const binds: any[] = isNya ? [] : [flik]

  let count = 0
  try { count = (await p.raw(`SELECT count(*)::int AS c FROM "order" o WHERE o.deleted_at IS NULL AND ${cond}`, binds)).rows[0]?.c || 0 } catch { count = 0 }
  const idRows = ((await p.raw(`SELECT o.id FROM "order" o WHERE o.deleted_at IS NULL AND ${cond} ORDER BY o.display_id DESC LIMIT ${limit} OFFSET ${offset}`, binds)).rows) || []
  const ids = idRows.map((r: any) => r.id)

  let orders: any[] = []
  if (ids.length) {
    try {
      const { data } = await query(req.scope).graph({
        entity: "order",
        fields: ["id", "display_id", "email", "total", "currency_code", "created_at", "payment_status", "fulfillment_status", "status", "*shipping_address", "metadata"],
        filters: { id: ids },
      })
      const byId: any = {}
      for (const o of data || []) byId[o.id] = o
      orders = ids.map((id: string) => byId[id]).filter(Boolean)
    } catch { orders = [] }
  }
  return res.json({ orders, count })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const p = pg(req.scope)
  await ensure(p)
  const b: any = req.body || {}

  if (b.kind === "create") {
    const label = String(b.name || "").trim()
    if (!label) return res.status(400).json({ message: "Namn saknas." })
    let key = label.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    if (!key || ["nya", "makulerade", "arkiverade"].includes(key)) key = "flik-" + Date.now().toString(36)
    await p.raw(`INSERT INTO "order_flik" ("key","label","is_system","sort") VALUES (?, ?, false, 100) ON CONFLICT ("key") DO UPDATE SET "label"=EXCLUDED."label"`, [key, label])
    return res.json({ ok: true, key, label })
  }
  if (b.kind === "rename") {
    await p.raw(`UPDATE "order_flik" SET "label"=? WHERE "key"=? AND "is_system"=false`, [String(b.name || "").trim(), b.key])
    return res.json({ ok: true })
  }
  if (b.kind === "delete") {
    await p.raw(`UPDATE "order" SET metadata = metadata - 'orderflik' WHERE metadata->>'orderflik' = ?`, [b.key])
    await p.raw(`DELETE FROM "order_flik" WHERE "key"=? AND "is_system"=false`, [b.key])
    return res.json({ ok: true })
  }
  return res.status(400).json({ message: "okänd kind" })
}
