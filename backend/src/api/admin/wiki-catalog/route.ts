import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/core-flows"

// Wiki -> Medusa catalog import (categories + products). Admin-authenticated.
// POST { mode: "categories"|"products", rows: [...] }  — idempotent, resumable.
// categories: send top-level rows first (parent ""), then child rows (parent = parent name).
// products: idempotent by handle. Prices are EXCL VAT (SEK); region tax adds VAT.

let CHANNEL_ID: string | null = null
let CAT_CACHE: Map<string, string> | null = null

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body: any = req.body || {}
  const mode = body.mode
  const rows: any[] = Array.isArray(body.rows) ? body.rows : []
  const productModule: any = req.scope.resolve(Modules.PRODUCT)

  if (mode === "categories") {
    let created = 0, skipped = 0, failed = 0
    const errors: string[] = []
    const map: Record<string, string> = {}
    for (const c of rows) {
      const name = String(c.name || "").trim()
      if (!name) { skipped++; continue }
      const parentName = String(c.parent || "").trim()
      let parent_id: string | undefined
      if (parentName) {
        const pe = await productModule.listProductCategories({ name: parentName }, { select: ["id"], take: 1 })
        parent_id = pe[0]?.id
      }
      const existing = await productModule.listProductCategories({ name }, { select: ["id", "parent_category_id"], take: 25 })
      const match = existing.find((e: any) => (parent_id ? e.parent_category_id === parent_id : !e.parent_category_id))
      if (match) { map[name] = match.id; skipped++; continue }
      try {
        const made = await productModule.createProductCategories([{ name, parent_category_id: parent_id, is_active: true }])
        map[name] = made[0].id
        created++
      } catch (e: any) { failed++; if (errors.length < 8) errors.push(name + ": " + e.message) }
    }
    CAT_CACHE = null
    return res.json({ mode, received: rows.length, created, skipped, failed, errors, map })
  }

  if (mode === "products") {
    const channelModule: any = req.scope.resolve(Modules.SALES_CHANNEL)
    if (!CHANNEL_ID) {
      const [c] = await channelModule.listSalesChannels({ name: process.env.CHANNEL_NAME || "Teknikhouse.se" }, { take: 1 })
      CHANNEL_ID = c?.id || null
    }
    if (!CHANNEL_ID) return res.status(400).json({ error: "sales channel not found" })
    if (!CAT_CACHE) {
      CAT_CACHE = new Map()
      const all = await productModule.listProductCategories({}, { select: ["id", "name"], take: 10000 })
      for (const c of all) CAT_CACHE.set(String(c.name || "").toLowerCase(), c.id)
    }
    const handles = rows.map((p) => p.handle).filter(Boolean)
    const existing = handles.length
      ? await productModule.listProducts({ handle: handles }, { select: ["id", "handle"], take: handles.length })
      : []
    const have = new Set(existing.map((p: any) => p.handle))
    const toCreate = rows.filter((p) => p.handle && !have.has(p.handle))
    let created = 0, failed = 0
    const errors: string[] = []
    for (const p of toCreate) {
      const catId =
        CAT_CACHE.get(String(p.subcategory || "").toLowerCase()) ||
        CAT_CACHE.get(String(p.category || "").toLowerCase())
      const input: any = {
        title: p.title,
        handle: p.handle,
        status: "published",
        description: p.description || undefined,
        thumbnail: p.image_url || undefined,
        images: p.image_url ? [{ url: p.image_url }] : [],
        options: [{ title: "Standard", values: ["Standard"] }],
        variants: [{
          title: "Standard",
          sku: p.sku || undefined,
          manage_inventory: false,
          options: { Standard: "Standard" },
          prices: [{ amount: Number(p.price_excl_vat) || 0, currency_code: "sek" }],
        }],
        category_ids: catId ? [catId] : [],
        sales_channels: [{ id: CHANNEL_ID }],
        metadata: {
          wiki_sku: p.sku, wiki_url_path: p.url_path, brand: p.brand, model: p.model,
          meta_title: p.meta_title, meta_description: p.meta_description,
          wiki_stock: p.stock, wiki_hidden: !!p.hidden, wiki_migrated: true,
        },
      }
      try {
        await createProductsWorkflow(req.scope).run({ input: { products: [input] } })
        created++
      } catch (e: any) { failed++; if (errors.length < 10) errors.push(String(p.handle || p.sku) + ": " + e.message) }
    }
    return res.json({ mode, received: rows.length, created, skipped: rows.length - toCreate.length, failed, errors })
  }

  return res.status(400).json({ error: "unknown mode (use categories|products)" })
}
