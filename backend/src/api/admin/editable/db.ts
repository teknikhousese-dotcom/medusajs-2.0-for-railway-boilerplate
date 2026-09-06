import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

let ensured = false

export function getPg(scope: any): any {
  try { return scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) }
  catch { try { return scope.resolve("__pg_connection__") } catch { return null } }
}
export function genId(prefix: string) { return prefix + "_" + randomUUID().replace(/-/g, "") }
export async function q(pg: any, sql: string, bindings: any[] = []) {
  const r = await pg.raw(sql, bindings); return (r && r.rows) ? r.rows : r
}

const AREAS: string[] = [
  "Ansökan avtalskund", "Bekräftelse", "Kampanjer", "Kassan", "Kassan (sidhuvud)",
  "Reklamation - nästa steg", "Retur - nästa steg", "Retur & Reklamation",
  "Sidfot (Följ oss)", "Sidfot (Handla)", "Sidfot (Information)", "Sidfot (Kontakta oss)",
  "Sidfot (loggor)", "Sidfot (Nyhetsbrev)", "Startsidan", "Startsidan - 1 - 1-2",
  "Startsidan - 4 boxar", "Startsidan (Sök)", "Startsidan (USP:ar)",
  "Toppmeny (kontakt)", "Toppmeny (USP:ar)",
]
// [name, slug, protected]
const PAGES: [string, string, boolean][] = [
  ["Integritetspolicy", "integritetspolicy", false],
  ["Om oss", "om-oss", true],
  ["Villkor", "villkor", true],
  ["Öppet köp & Retur", "oppet-kop-retur", false],
]

export async function ensureTables(pg: any) {
  if (ensured || !pg || typeof pg.raw !== "function") return
  await pg.raw(`CREATE TABLE IF NOT EXISTS "editable_area" (
    "id" text NOT NULL, "code" text NOT NULL, "name" text NOT NULL, "content" text NULL,
    "updated_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "editable_area_pkey" PRIMARY KEY ("id"));`)
  await pg.raw(`CREATE TABLE IF NOT EXISTS "editable_page" (
    "id" text NOT NULL, "name" text NOT NULL, "slug" text NULL, "content" text NULL,
    "show_in_footer" boolean NOT NULL DEFAULT false, "protected" boolean NOT NULL DEFAULT false,
    "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz NULL, CONSTRAINT "editable_page_pkey" PRIMARY KEY ("id"));`)
  const ac = await q(pg, `SELECT count(*)::int AS n FROM "editable_area"`)
  if (!ac.length || ac[0].n === 0) {
    for (let i = 0; i < AREAS.length; i++) {
      await q(pg, `INSERT INTO "editable_area" (id,code,name,content) VALUES (?,?,?,?)`,
        [genId("earea"), "area_" + i, AREAS[i], ""])
    }
  }
  const pc = await q(pg, `SELECT count(*)::int AS n FROM "editable_page"`)
  if (!pc.length || pc[0].n === 0) {
    for (const [name, slug, prot] of PAGES) {
      await q(pg, `INSERT INTO "editable_page" (id,name,slug,content,protected) VALUES (?,?,?,?,?)`,
        [genId("epage"), name, slug, "", prot])
    }
  }
  ensured = true
}
