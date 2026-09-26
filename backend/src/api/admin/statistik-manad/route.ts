import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, q } from "../lagerbevakning/db"

// Statistik per månad/år – samma definitioner som Wiki (statistics.php?action=months).
// Aggregates ALL orders server-side in SQL (no 1000-order limit).
//  GET /admin/statistik-manad                  -> { months:[{ym,orders,items,goods,value}], years:[...] }
//  GET /admin/statistik-manad?month=2026-09    -> { days:[{day,orders,items,goods,value}] }
//  GET /admin/statistik-manad?debug=1          -> adds per-month breakdown per exclusion group
// Definitions (Wiki):
//  - Datum: Wikis ordertid (metadata.wiki_order_time, svensk lokal tid); egna ordrar: created_at i Europe/Stockholm.
//  - Räknas: ej Makulerade (flik/wiki_status/canceled), ej ofullständiga köp (wiki_activated=false), ej counts_in_stats=false, ej utkast.
//  - Beställda varor: summa antal på varurader (rader med negativt pris, t.ex. rabatter, räknas inte).
//  - Varuvärde: varornas värde inkl. moms. Frakt, avgifter och rabatter ej inräknade.
//  - Ordervärde: vad kunden betalade för hela ordern inkl. moms (Wiki: total exkl. moms + moms).

const NUM = `'^-{0,1}[0-9]+([.][0-9]+){0,1}$'`

function baseSql(where: string, keyExpr: string) {
  return `
WITH o AS (
  SELECT o."id", o."version", o."status", o."metadata" AS m,
    CASE WHEN o."metadata"->>'wiki_order_time' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN substr(o."metadata"->>'wiki_order_time', 1, 19)
         ELSE to_char(o."created_at" AT TIME ZONE 'Europe/Stockholm', 'YYYY-MM-DD HH24:MI:SS') END AS lt
  FROM "order" o
  WHERE o."deleted_at" IS NULL AND COALESCE(o."status"::text, '') <> 'draft'
),
c AS (
  SELECT o.*,
    CASE
      WHEN lower(COALESCE(o.m->>'orderflik', '')) LIKE 'makuler%' OR lower(COALESCE(o.m->>'wiki_status', '')) LIKE 'makuler%' OR COALESCE(o."status"::text, '') = 'canceled' OR lower(COALESCE(o.m->>'wiki_cancelled', o.m->>'makulerad', '')) IN ('true', '1') THEN 'M'
      WHEN lower(COALESCE(o.m->>'wiki_activated', '')) IN ('false', '0') THEN 'N'
      WHEN lower(COALESCE(o.m->>'counts_in_stats', '')) IN ('false', '0') THEN 'X'
      ELSE 'A' END AS grp
  FROM o
),
li AS (
  SELECT oi."order_id",
    SUM(CASE WHEN l."unit_price" >= 0 THEN oi."quantity" ELSE 0 END) AS qty,
    SUM(CASE WHEN l."unit_price" >= 0 THEN oi."quantity" * l."unit_price" *
      (CASE WHEN l."is_tax_inclusive" THEN 1 ELSE 1 + COALESCE(CASE WHEN l."metadata"->>'vat_rate' ~ ${NUM} THEN (l."metadata"->>'vat_rate')::numeric END, tl.rate, 0) / 100 END)
      ELSE 0 END) AS goods
  FROM c
  JOIN "order_item" oi ON oi."order_id" = c."id" AND oi."version" = c."version" AND oi."deleted_at" IS NULL
  JOIN "order_line_item" l ON l."id" = oi."item_id" AND l."deleted_at" IS NULL
  LEFT JOIN (SELECT "item_id", SUM("rate") AS rate FROM "order_line_item_tax_line" WHERE "deleted_at" IS NULL GROUP BY "item_id") tl ON tl."item_id" = l."id"
  GROUP BY oi."order_id"
),
v AS (
  SELECT c."id",
    CASE WHEN c.m->>'wiki_total_excl_vat' ~ ${NUM}
      THEN (c.m->>'wiki_total_excl_vat')::numeric + COALESCE(CASE WHEN c.m->>'wiki_total_vat' ~ ${NUM} THEN (c.m->>'wiki_total_vat')::numeric END, 0)
      ELSE (SELECT CASE WHEN s."totals"->>'current_order_total' ~ ${NUM} THEN (s."totals"->>'current_order_total')::numeric
                        WHEN s."totals"->>'original_order_total' ~ ${NUM} THEN (s."totals"->>'original_order_total')::numeric END
            FROM "order_summary" s WHERE s."order_id" = c."id" AND s."deleted_at" IS NULL ORDER BY s."version" DESC LIMIT 1)
    END AS value
  FROM c
)
SELECT ${keyExpr} AS k, c.grp,
  COUNT(*)::int AS orders,
  COALESCE(SUM(li.qty), 0)::float AS items,
  COALESCE(SUM(li.goods), 0)::float AS goods,
  COALESCE(SUM(v.value), 0)::float AS value
FROM c
LEFT JOIN li ON li."order_id" = c."id"
LEFT JOIN v ON v."id" = c."id"
${where}
GROUP BY 1, 2
ORDER BY 1 DESC`
}

let cache: { at: number; data: any } | null = null

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ error: "Databasen är inte tillgänglig." })
  const query = (req.query || {}) as any
  const debug = String(query.debug || "") === "1"
  const month = String(query.month || "")
  try {
    if (/^\d{4}-\d{2}$/.test(month)) {
      const rows = await q(pg, baseSql(`WHERE left(c.lt, 7) = ?`, `left(c.lt, 10)`), [month])
      const days = rows.filter((r: any) => r.grp === "A").map((r: any) => ({ day: r.k, orders: r.orders, items: r.items, goods: r.goods, value: r.value }))
      return res.json({ month, days })
    }
    const fresh = String(query.fresh || "") === "1"
    let rows: any[]
    if (!fresh && cache && Date.now() - cache.at < 60 * 1000) rows = cache.data
    else {
      rows = await q(pg, baseSql("", `left(c.lt, 7)`))
      cache = { at: Date.now(), data: rows }
    }
    const months = rows.filter((r: any) => r.grp === "A").map((r: any) => ({ ym: r.k, orders: r.orders, items: r.items, goods: r.goods, value: r.value }))
    const yearMap: Record<string, any> = {}
    for (const m of months) {
      const y = m.ym.slice(0, 4)
      if (!yearMap[y]) yearMap[y] = { year: y, orders: 0, items: 0, goods: 0, value: 0 }
      yearMap[y].orders += m.orders; yearMap[y].items += m.items; yearMap[y].goods += m.goods; yearMap[y].value += m.value
    }
    const years = Object.values(yearMap).sort((a: any, b: any) => b.year.localeCompare(a.year))
    const excluded: Record<string, number> = { M: 0, N: 0, X: 0 }
    for (const r of rows) if (r.grp !== "A") excluded[r.grp] = (excluded[r.grp] || 0) + r.orders
    const out: any = {
      generated_at: new Date().toISOString(),
      months,
      years,
      counted_orders: months.reduce((a: number, m: any) => a + m.orders, 0),
      excluded: { makulerade: excluded.M, ej_slutforda: excluded.N, ej_statistik: excluded.X },
    }
    if (debug) out.debug = rows.map((r: any) => [r.k, r.grp, r.orders, Math.round(r.items), Math.round(r.goods), Math.round(r.value)])
    return res.json(out)
  } catch (e: any) {
    return res.status(500).json({ error: "Statistikfel: " + (e?.message || String(e)) })
  }
}
