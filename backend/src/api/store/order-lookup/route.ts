import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getPg, q } from "../../admin/editable/db"

// Teknikhouse.se public order lookup for the return flow.
// Matches the order number against JSONB metadata.wiki_order_id (text) and native display_id,
// then loads the order (with items) via the query graph.

async function findOrderId(req: MedusaRequest, num: string): Promise<{ id: string | null; via: string }> {
  const n = parseInt(String(num), 10)
  try {
    const pg: any = getPg(req.scope)
    if (pg) {
      const rows: any = await q(
        pg,
        'SELECT id FROM "order" WHERE metadata @> ?::jsonb LIMIT 1',
        [JSON.stringify({ wiki_order_id: String(num) })]
      )
      if (rows && rows[0] && rows[0].id) return { id: rows[0].id, via: "sql-wiki" }
      if (!isNaN(n)) {
        const rows2: any = await q(pg, 'SELECT id FROM "order" WHERE display_id = ? LIMIT 1', [n])
        if (rows2 && rows2[0] && rows2[0].id) return { id: rows2[0].id, via: "sql-display" }
      }
    }
  } catch (e) {
    // ignore and fall through
  }
  return { id: null, via: "none" }
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query: any = req.query
  const email = String(query.email || "").trim().toLowerCase()
  const num = String(query.order || query.ordernummer || "").trim()
  res.setHeader("Cache-Control", "no-store")
  if (!email || !num) {
    return res.status(400).json({ error: "Ange både ordernummer och e-postadress." })
  }
  try {
    const f = await findOrderId(req, num)
    if (!f.id) {
      return res.status(404).json({ error: "Vi hittade ingen order med det ordernumret." })
    }
    const graph: any = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await graph.graph({
      entity: "order",
      fields: [
        "id",
        "email",
        "display_id",
        "created_at",
        "items.id",
        "items.title",
        "items.quantity",
        "items.raw_quantity",
        "items.variant_sku",
        "items.metadata",
      ],
      filters: { id: f.id },
    })
    const order: any = data && data[0]
    if (!order) {
      return res.status(404).json({ error: "Vi hittade ingen order med det ordernumret." })
    }
    if (String(order.email || "").toLowerCase() !== email) {
      return res.status(404).json({ error: "E-postadressen matchar inte den här ordern." })
    }
    const items = (order.items || []).map((it: any) => ({
      id: it.id,
      title: it.title,
      sku: (it.metadata && it.metadata.sku) || it.variant_sku || "",
      quantity: Number((it.raw_quantity && it.raw_quantity.value) != null ? it.raw_quantity.value : (it.quantity != null ? it.quantity : 1)),
    }))
    return res.json({
      ok: true,
      _via: f.via,
      order: {
        id: order.id,
        number: num,
        display_id: order.display_id,
        created_at: order.created_at,
        items,
      },
      items,
    })
  } catch (e: any) {
    return res.status(500).json({ error: "Något gick fel. Försök igen eller kontakta kundtjänst." })
  }
}
