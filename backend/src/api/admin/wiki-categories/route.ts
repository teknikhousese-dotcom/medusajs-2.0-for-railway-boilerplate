import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// Wiki "Hantera Varugrupper" mirror — lists/creates/edits/deletes/orders Medusa
// product categories from the Swedish field set. SEO + Google-category go in
// category.metadata.

function q(scope: any) { return scope.resolve(ContainerRegistrationKeys.QUERY) }
function pmod(scope: any) { return scope.resolve(Modules.PRODUCT) }

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { data } = await q(req.scope).graph({
      entity: "product_category",
      fields: ["id", "name", "handle", "parent_category_id", "rank", "is_active", "is_internal", "description", "metadata"],
      pagination: { take: 5000 },
    })
    const byId: any = {}
    for (const c of data || []) byId[c.id] = c
    const label = (c: any) => {
      const parts = [c.name]
      let p = c.parent_category_id, guard = 0
      while (p && byId[p] && guard < 6) { parts.unshift(byId[p].name); p = byId[p].parent_category_id; guard++ }
      return parts.join(" - ")
    }
    const cats = (data || []).map((c: any) => ({
      id: c.id, name: c.name, handle: c.handle, parent_category_id: c.parent_category_id || "",
      rank: c.rank || 0, is_active: c.is_active !== false, is_internal: !!c.is_internal,
      description: c.description || "", metadata: c.metadata || {}, label: label(c),
    })).sort((a: any, b: any) => a.label.localeCompare(b.label, "sv"))
    res.json({ categories: cats })
  } catch (e: any) { res.status(500).json({ error: String(e && e.message || e) }) }
}

function slugify(s: string) {
  return String(s || "").toLowerCase().trim()
    .replace(/å|ä/g, "a").replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b: any = req.body || {}
  const kind = b.kind
  const svc = pmod(req.scope)
  try {
    if (kind === "new") {
      const name = (b.name || "").trim()
      if (!name) return res.status(400).json({ error: "Namn krävs." })
      const input: any = { name, handle: (b.handle || "").trim() || slugify(name), is_active: b.is_active !== false }
      if (b.parent_category_id) input.parent_category_id = b.parent_category_id
      if (b.description) input.description = b.description
      const meta = buildMeta(b)
      if (Object.keys(meta).length) input.metadata = meta
      const created = await svc.createProductCategories([input])
      return res.json({ ok: true, id: (created && created[0] && created[0].id) || null })
    }
    if (kind === "update") {
      if (!b.id) return res.status(400).json({ error: "id krävs." })
      const upd: any = {}
      if (b.name != null) upd.name = String(b.name).trim()
      if (b.handle != null) upd.handle = String(b.handle).trim() || slugify(b.name || "")
      if (b.parent_category_id !== undefined) upd.parent_category_id = b.parent_category_id || null
      if (b.is_active != null) upd.is_active = !!b.is_active
      if (b.description != null) upd.description = b.description
      if (b.rank != null) upd.rank = Math.round(Number(b.rank) || 0)
      const meta = buildMeta(b)
      if (Object.keys(meta).length) upd.metadata = meta
      await svc.updateProductCategories(b.id, upd)
      return res.json({ ok: true, id: b.id })
    }
    if (kind === "delete") {
      if (!b.id) return res.status(400).json({ error: "id krävs." })
      await svc.deleteProductCategories([b.id])
      return res.json({ ok: true })
    }
    if (kind === "rank") {
      // batch: [{id, rank}]
      const items = Array.isArray(b.items) ? b.items : []
      for (const it of items) { if (it && it.id) await svc.updateProductCategories(it.id, { rank: Math.round(Number(it.rank) || 0) }) }
      return res.json({ ok: true, count: items.length })
    }
    return res.status(400).json({ error: "okänd åtgärd" })
  } catch (e: any) {
    return res.status(500).json({ error: String(e && e.message || e) })
  }
}

function buildMeta(b: any) {
  const m: any = {}
  if (b.seo_title != null && b.seo_title !== "") m.seo_title = b.seo_title
  if (b.seo_desc != null && b.seo_desc !== "") m.seo_desc = b.seo_desc
  if (b.google_category != null && b.google_category !== "") m.google_category = b.google_category
  return m
}
