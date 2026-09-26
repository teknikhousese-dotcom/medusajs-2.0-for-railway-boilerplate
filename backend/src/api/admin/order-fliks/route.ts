import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Order-flikar (som Wikinggruppens manuella order-flikar).
 * Order flyttas till en flik genom att sätta metadata.orderflik på ordern.
 * Medusas /admin/orders kan inte filtrera på metadata, så denna route sköter
 * flik-listning (via rå SQL på order.metadata) + hantering av egna flikar.
 *
 *  GET  /admin/order-fliks                    → { fliks:[{key,label,is_system,count}], unread }
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

/* Sortering som Wiki: nyast först efter ordertid (svensk lokal tid). Wiki-ordrar har metadata.wiki_order_time
   (eller order_time), nya Medusa-ordrar saknar den och sorteras på created_at omräknat till svensk tid.
   Därefter Wiki-ordernumret och id som stabil tie-breaker. Sortering + LIMIT/OFFSET sker i SQL över ALLA ordrar. */
const TS_FMT = `'YYYY-MM-DD HH24:MI:SS'`
const tsExpr = (k: string) => `CASE WHEN COALESCE(o.metadata->>'${k}','') = '' THEN NULL WHEN (o.metadata->>'${k}') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9:.]+(Z|[+-][0-9]{2}:{0,1}[0-9]{2})$' THEN to_char(((o.metadata->>'${k}')::timestamptz) AT TIME ZONE 'Europe/Stockholm', ${TS_FMT}) ELSE LEFT(REPLACE(o.metadata->>'${k}','T',' '), 19) END`
const SORT_T = `COALESCE(${tsExpr("wiki_order_time")}, ${tsExpr("order_time")}, to_char(o.created_at AT TIME ZONE 'Europe/Stockholm', ${TS_FMT}))`
const SORT_W = `COALESCE(CASE WHEN (o.metadata->>'wiki_order_id') ~ '^[0-9]{1,15}$' THEN (o.metadata->>'wiki_order_id')::bigint END, 0)`
const ORDER_BY = `ORDER BY ${SORT_T} DESC, ${SORT_W} DESC, o.id DESC`

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const p = pg(req.scope)
  await ensure(p)
  const flik = String((req.query as any).flik || "")
  const qq: any = req.query || {}

  /* Olästa ordrar (samma definition som listan: flik Nya och metadata.read !== true). Billig räkning server-side. */
  if (qq.unread) {
    let unread = 0
    try { unread = (await p.raw(`SELECT count(*)::int AS c FROM "order" o WHERE o.deleted_at IS NULL AND ${nyaCond} AND (o.metadata->>'read') IS DISTINCT FROM 'true'`)).rows[0]?.c || 0 } catch { unread = 0 }
    return res.json({ unread })
  }
  /* Slå upp order-id från Wiki-ordernummer (metadata.wiki_order_id). */
  if (qq.wiki) {
    const r = await p.raw(`SELECT o.id FROM "order" o WHERE o.deleted_at IS NULL AND o.metadata->>'wiki_order_id' = ? LIMIT 1`, [String(qq.wiki)])
    return res.json({ id: (r.rows && r.rows[0] && r.rows[0].id) || null })
  }
  /* Lista Wiki-importerade ordrar (wiki_imported) lagda efter ett datum (svensk tid). */
  if (qq.wiki_list) {
    const since = String(qq.since || "2000-01-01")
    const r = await p.raw(`SELECT o.id, o.metadata->>'wiki_order_id' AS wid, o.metadata->>'wiki_order_time' AS t, o.metadata->>'wiki_activated' AS act, o.metadata->>'payment_method' AS pm, o.metadata->>'orderflik' AS flik, (o.metadata->>'ip_address') IS NOT NULL AS has_ip, (o.metadata->>'wiki_shipping_desc') IS NOT NULL AS has_ship, (o.metadata->>'wiki_klarna_order_id') IS NOT NULL AS has_kl FROM "order" o WHERE o.deleted_at IS NULL AND o.metadata->>'wiki_imported' = 'true' AND COALESCE(o.metadata->>'wiki_order_time','') >= ? ORDER BY o.metadata->>'wiki_order_time' ASC`, [since])
    return res.json({ orders: r.rows || [] })
  }
  /* Föregående/nästa order (samma sortering som listan, över alla ordrar). next = nyare, prev = äldre. */
  if (qq.nav) {
    const cur = (await p.raw(`SELECT ${SORT_T} AS t, ${SORT_W} AS w, o.id FROM "order" o WHERE o.id = ?`, [String(qq.nav)])).rows?.[0]
    if (!cur) return res.json({ prev: null, next: null })
    const sel = `SELECT o.id, o.display_id, o.metadata->>'wiki_order_id' AS wid FROM "order" o WHERE o.deleted_at IS NULL AND`
    const tup = `(${SORT_T}, ${SORT_W}, o.id)`
    const nx = (await p.raw(`${sel} ${tup} > (?, ?, ?) ORDER BY ${SORT_T} ASC, ${SORT_W} ASC, o.id ASC LIMIT 1`, [cur.t, cur.w, cur.id])).rows?.[0]
    const pv = (await p.raw(`${sel} ${tup} < (?, ?, ?) ${ORDER_BY} LIMIT 1`, [cur.t, cur.w, cur.id])).rows?.[0]
    const shape = (r: any) => r ? { id: r.id, display_id: r.display_id, metadata: { wiki_order_id: r.wid || undefined } } : null
    return res.json({ prev: shape(pv), next: shape(nx) })
  }
  /* Täckning av Wiki-fält (för kontroll). */
  if (qq.wiki_stats) {
    const r = await p.raw(`SELECT count(*)::int AS total,
      count(*) FILTER (WHERE (o.metadata->>'wiki_order_id') IS NOT NULL)::int AS wiki,
      count(*) FILTER (WHERE o.metadata->>'wiki_imported' = 'true')::int AS imported,
      count(*) FILTER (WHERE (o.metadata->>'order_time') IS NOT NULL)::int AS order_time,
      count(*) FILTER (WHERE (o.metadata->>'wiki_order_time') IS NOT NULL)::int AS wiki_order_time,
      count(*) FILTER (WHERE COALESCE(o.metadata->>'ip_address','') <> '')::int AS ip,
      count(*) FILTER (WHERE COALESCE(o.metadata->>'wiki_shipping_method','') <> '')::int AS ship,
      count(*) FILTER (WHERE COALESCE(o.metadata->>'wiki_shipping_desc','') <> '')::int AS ship_desc,
      count(*) FILTER (WHERE COALESCE(o.metadata->>'wiki_klarna_order_id','') <> '')::int AS klarna
      FROM "order" o WHERE o.deleted_at IS NULL`)
    return res.json((r.rows && r.rows[0]) || {})
  }

  if (!flik) {
    const defs = ((await p.raw(`SELECT "key","label","is_system","sort" FROM "order_flik" ORDER BY "sort" ASC, "label" ASC`)).rows) || []
    const grp = ((await p.raw(`SELECT COALESCE(NULLIF(o.metadata->>'orderflik',''),'nya') AS f, count(*)::int AS c FROM "order" o WHERE o.deleted_at IS NULL GROUP BY f`)).rows) || []
    const cmap: any = {}
    for (const g of grp) cmap[g.f] = g.c
    const fliks = defs.map((d: any) => ({ key: d.key, label: d.label, is_system: d.is_system, count: cmap[d.key] || 0 }))
    // Olästa ordrar = nya ordrar som ännu inte öppnats (metadata.read != 'true').
    let unread = 0
    try {
      unread = (await p.raw(`SELECT count(*)::int AS c FROM "order" o WHERE o.deleted_at IS NULL AND ${nyaCond} AND (o.metadata->>'read') IS DISTINCT FROM 'true'`)).rows[0]?.c || 0
    } catch { unread = 0 }
    return res.json({ fliks, unread })
  }

  const limit = Math.min(500, parseInt(String((req.query as any).limit || "100")) || 100)
  const offset = parseInt(String((req.query as any).offset || "0")) || 0
  const isNya = flik === "nya"
  const cond = isNya ? nyaCond : `o.metadata->>'orderflik' = ?`
  const binds: any[] = isNya ? [] : [flik]

  let count = 0
  try { count = (await p.raw(`SELECT count(*)::int AS c FROM "order" o WHERE o.deleted_at IS NULL AND ${cond}`, binds)).rows[0]?.c || 0 } catch { count = 0 }
  const idRows = ((await p.raw(`SELECT o.id FROM "order" o WHERE o.deleted_at IS NULL AND ${cond} ${ORDER_BY} LIMIT ${limit} OFFSET ${offset}`, binds)).rows) || []
  const ids = idRows.map((r: any) => r.id)

  let orders: any[] = []
  if (ids.length) {
    try {
      const { data } = await query(req.scope).graph({
        entity: "order",
        fields: ["id", "display_id", "email", "total", "currency_code", "created_at", "payment_status", "fulfillment_status", "status", "shipping_address.first_name", "shipping_address.last_name", "shipping_address.country_code", "payment_collections.status", "payment_collections.payments.provider_id", "metadata"],
        filters: { id: ids },
      })
      const byId: any = {}
      for (const o of data || []) byId[o.id] = o
      orders = ids.map((id: string) => byId[id]).filter(Boolean)
      /* query.graph ger inte orderns beräknade payment_status. Härled den ur betalningssamlingarna
         så att listan kan färga nya ordrar (godkänd = authorized, dragen = captured). */
      const PS: Record<string, string> = { completed: "captured", partially_captured: "partially_captured", authorized: "authorized", partially_authorized: "partially_authorized", canceled: "canceled", failed: "canceled", awaiting: "awaiting", not_paid: "not_paid" }
      for (const o of orders) {
        if (o.payment_status) continue
        const sts = (o.payment_collections || []).map((pc: any) => String((pc && pc.status) || ""))
        const pick = ["completed", "partially_captured", "authorized", "partially_authorized", "canceled", "failed", "awaiting", "not_paid"].find((k) => sts.includes(k))
        o.payment_status = pick ? PS[pick] : "not_paid"
      }
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
