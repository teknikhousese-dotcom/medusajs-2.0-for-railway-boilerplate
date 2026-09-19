import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createProductsWorkflow, updateProductsWorkflow } from "@medusajs/medusa/core-flows"

// Wiki "NY PRODUKT" mirror — reads reference data and creates/updates a Medusa
// product from the Swedish Wiki field set. Extras that Medusa has no native slot
// for (skick, momssats, inpris, leverantör, modell, sökord, SEO, visning) are
// stored in product.metadata so nothing from the Wiki form is lost.

function q(scope: any) { return scope.resolve(ContainerRegistrationKeys.QUERY) }

async function firstId(scope: any, entity: string) {
  try {
    const { data } = await q(scope).graph({ entity, fields: ["id"], pagination: { take: 1 } })
    return data && data[0] && data[0].id
  } catch { return null }
}

// Skriv verkligt lagersaldo (Medusa inventory) — körs på både skapa OCH uppdatera.
async function syncStock(scope: any, productId: string, b: any) {
  try {
    if (b.oandligt || b.antal == null) return
    const locId = await firstId(scope, "stock_location")
    if (!locId) return
    const inv = scope.resolve(Modules.INVENTORY)
    const { data } = await q(scope).graph({
      entity: "product", fields: ["variants.inventory_items.inventory_item_id"], filters: { id: productId },
    })
    const iid = data?.[0]?.variants?.[0]?.inventory_items?.[0]?.inventory_item_id
    if (!iid) return
    const qty = Math.round(Number(String(b.antal).replace(",", ".")) || 0)
    try { await inv.updateInventoryLevels([{ inventory_item_id: iid, location_id: locId, stocked_quantity: qty }]) }
    catch { await inv.createInventoryLevels([{ inventory_item_id: iid, location_id: locId, stocked_quantity: qty }]) }
  } catch (e) { /* lager är best-effort */ }
}

async function loadCategories(scope: any) {
  try {
    const { data } = await q(scope).graph({
      entity: "product_category",
      fields: ["id", "name", "parent_category_id"],
      pagination: { take: 5000 },
    })
    const byId: any = {}
    for (const c of data || []) byId[c.id] = c
    const label = (c: any) => {
      const parts = [c.name]
      let p = c.parent_category_id
      let guard = 0
      while (p && byId[p] && guard < 6) { parts.unshift(byId[p].name); p = byId[p].parent_category_id; guard++ }
      return parts.join(" - ")
    }
    return (data || []).map((c: any) => ({ id: c.id, label: label(c) })).sort((a: any, b: any) => a.label.localeCompare(b.label, "sv"))
  } catch { return [] }
}

const SUPPLIERS = [
  "Ander LCD Factory", "Bizbee B2B", "C2B inköp", "China", "Copter B2B", "Cyberphoto B2B",
  "DCS Danmark", "Deltaco / Aurdel B2B", "Elgiganten B2B", "Fourcom B2B", "G-SP B2B",
  "Genuine Solutions B2B", "Green Cell B2B", "ingram B2B", "itegra B2B", "Komplett B2B",
  "mstore", "netonnet B2B", "Order Nordic AB", "Phoenix B2B", "Proshop B2B", "Restore Capital B2B",
  "Saver B2B", "Spares B2B", "Webhallen", "Zandparts B2B",
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = (req.query.id as string) || ""
  if (id) {
    try {
      const { data } = await q(req.scope).graph({
        entity: "product",
        fields: [
          "id", "title", "subtitle", "description", "status", "weight", "metadata",
          "categories.id", "images.url", "thumbnail",
          "variants.id", "variants.sku", "variants.barcode",
          "variants.prices.amount", "variants.prices.currency_code",
        ],
        filters: { id },
      })
      const p = (data || [])[0]
      if (!p) return res.status(404).json({ error: "not found" })
      const v = (p.variants || [])[0] || {}
      const prices = v.prices || []
      const sek = prices.find((x: any) => (x.currency_code || "").toLowerCase() === "sek") || prices[0]
      const md: any = p.metadata || {}
      // När kampanj är aktiv ligger kampanjpriset på varianten — visa det ordinarie priset i Utpris-fältet.
      const utprisVal = md.kampanj && md.ordinarie_pris ? Number(md.ordinarie_pris) : (sek && sek.amount != null ? sek.amount : "")
      return res.json({
        product: {
          id: p.id, artnr: v.sku || "", namn: p.title || "", googleNamn: p.subtitle || "",
          beskrivning: p.description || "", ean: v.barcode || "", weight: p.weight || "",
          utpris: utprisVal,
          category_ids: (p.categories || []).map((c: any) => c.id),
          images: (p.images || []).map((i: any) => i.url),
          status: p.status, metadata: p.metadata || {},
        },
      })
    } catch (e: any) { return res.status(500).json({ error: "Något gick fel. Försök igen." }) }
  }
  const categories = await loadCategories(req.scope)
  res.json({ categories, suppliers: SUPPLIERS })
}

function toStatus(visning: string) {
  // Visa=published, "Dölj i butiken men inte för sökmotorer"=proposed, "Dölj fullständigt"=draft
  if (visning === "hide_full") return "draft"
  if (visning === "hide_shop") return "proposed"
  return "published"
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b: any = req.body || {}
  const namn = (b.namn || "").trim()
  const artnr = (b.artnr || "").trim()
  if (!namn || !artnr) return res.status(400).json({ error: "Artikelnummer och namn krävs." })

  const utpris = Math.round(Number(String(b.utpris ?? "").replace(",", ".")) || 0)
  const kampanjpris = Math.round(Number(String(b.kampanjpris ?? "").replace(",", ".")) || 0)
  const inprisNum = String(b.inpris ?? "").trim() !== "" ? Number(String(b.inpris).replace(",", ".")) : null
  // Kampanj: checkbox-avsikten sparas alltid i metadata (så formuläret laddar rätt);
  // priset byts bara om dagens datum ligger inom kampanjfönstret.
  const kampanjChecked = !!b.kampanj && kampanjpris > 0
  const today = new Date().toISOString().slice(0, 10)
  const withinWindow = (!b.kampanjStart || String(b.kampanjStart) <= today) && (!b.kampanjSlut || String(b.kampanjSlut) >= today)
  const kampanjAktiv = kampanjChecked && withinWindow
  const price = kampanjAktiv ? kampanjpris : utpris
  const weight = Number(String(b.weight ?? "").replace(",", ".")) || undefined
  const catIds: string[] = Array.isArray(b.category_ids) ? b.category_ids : []
  const images: any[] = Array.isArray(b.images) ? b.images.filter(Boolean).map((u: string) => ({ url: u })) : []
  const thumbnail = (typeof b.thumbnail === "string" && b.thumbnail) || (images[0] && images[0].url) || undefined
  const metadata: any = {
    skick: b.skick || "", momssats: b.momssats != null ? String(b.momssats) : "",
    inpris: inprisNum != null && !Number.isNaN(inprisNum) ? String(inprisNum) : "", leverantor: b.leverantor || "",
    tillverkare: b.tillverkare || "", color: b.color || "", modell: b.modell || "", lagerplats: b.lagerplats || "",
    sokord: b.sokord || "", google_namn: b.googleNamn || "", html_falt: b.htmlFalt || "",
    seo_title: b.metaTitle || "", seo_desc: b.metaDesc || "", meta_title: b.metaTitle || "", meta_description: b.metaDesc || "", h1: b.h1 || "",
    visning: b.visning || "show", kampanj: kampanjChecked, kampanjpris: kampanjChecked ? String(kampanjpris) : "", kampanj_start: b.kampanjStart || "", kampanj_slut: b.kampanjSlut || "", ordinarie_pris: kampanjChecked ? String(utpris) : "", antal: b.antal != null ? String(b.antal) : "",
    oandligt: !!b.oandligt, lagervarning: b.lagervarning != null ? String(b.lagervarning) : "",
    skrymmande: !!b.skrymmande, bestallningsvara: !!b.bestallningsvara, empty_stock_text: b.emptyStockText || "", custom_text: b.customText || "",
  }

  const variant: any = {
    title: namn, sku: artnr, manage_inventory: !b.oandligt, allow_backorder: !!b.bestallningsvara,
    options: { Variant: "Standard" },
    prices: [{ amount: price, currency_code: "sek" }],
    metadata: { inpris: metadata.inpris, momssats: metadata.momssats },
  }
  if (b.ean) variant.barcode = String(b.ean).trim()
  if (weight) variant.weight = weight

  const productInput: any = {
    title: namn, subtitle: b.googleNamn || undefined, description: b.beskrivning || "",
    status: toStatus(b.visning || "show"), weight, thumbnail,
    options: [{ title: "Variant", values: ["Standard"] }],
    category_ids: catIds, images, metadata, variants: [variant],
  }
  const scId = await firstId(req.scope, "sales_channel")
  if (scId) productInput.sales_channels = [{ id: scId }]

  try {
    if (b.id) {
      productInput.id = b.id
      await updateProductsWorkflow(req.scope).run({ input: { products: [productInput] } })
      await syncStock(req.scope, b.id, b)
      return res.json({ ok: true, id: b.id })
    }
    const { result } = await createProductsWorkflow(req.scope).run({ input: { products: [productInput] } })
    const created = (result || [])[0]
    if (created) await syncStock(req.scope, created.id, b)
    return res.json({ ok: true, id: created && created.id })
  } catch (e: any) {
    return res.status(500).json({ error: "Något gick fel. Försök igen." })
  }
}
