import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, q, ensureTables, stockStatus } from "../db"

// "Skicka bevakningsmejl" – manual only. Nothing runs automatically (no subscriber/job).
//  GET  /admin/lagerbevakning/skicka  -> preview: active reminders whose product is back in stock
//  POST /admin/lagerbevakning/skicka { confirm: "SKICKA", ids?: string[] }
//       Sends via Resend (RESEND_API_KEY / RESEND_FROM_EMAIL), marks notified_at. Max 200 per click.

const MAX_PER_RUN = 200

function esc(s: any): string {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function storeUrl(): string {
  return String(process.env.STORE_URL || process.env.STOREFRONT_URL || "https://teknikhouse.se").replace(/\/+$/, "")
}

async function pending(pg: any) {
  const rows = await q(pg, `SELECT "id","email","product_id","product_title","product_handle","page_url","created_at" FROM "stock_reminder"
    WHERE "deleted_at" IS NULL AND "notified_at" IS NULL AND "product_id" IS NOT NULL ORDER BY "created_at" ASC`)
  const pids = [...new Set(rows.map((r: any) => r.product_id))] as string[]
  const stock = await stockStatus(pg, pids)
  return rows.filter((r: any) => stock[r.product_id] === true)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ error: "Databasen är inte tillgänglig." })
  await ensureTables(pg)
  const rows = await pending(pg)
  const products = new Set(rows.map((r: any) => r.product_id)).size
  return res.json({ ready: rows.length, products, ids: rows.map((r: any) => r.id), resend_configured: !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as any
  if (body.confirm !== "SKICKA") return res.status(400).json({ error: "Bekräftelse saknas (confirm: \"SKICKA\")." })
  const key = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!key || !from) return res.status(400).json({ error: "Resend är inte konfigurerat (RESEND_API_KEY / RESEND_FROM_EMAIL)." })
  const pg = getPg(req.scope)
  if (!pg) return res.status(500).json({ error: "Databasen är inte tillgänglig." })
  await ensureTables(pg)
  let rows = await pending(pg)
  if (Array.isArray(body.ids) && body.ids.length) {
    const want = new Set(body.ids.map(String))
    rows = rows.filter((r: any) => want.has(r.id))
  }
  rows = rows.slice(0, MAX_PER_RUN)
  let sent = 0, failed = 0
  const errors: string[] = []
  for (const r of rows) {
    const url = storeUrl() + (r.page_url ? r.page_url : "/products/" + encodeURIComponent(r.product_handle || ""))
    const title = r.product_title || "Produkten"
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222">
<p>Hej!</p>
<p>Produkten du bevakar finns nu i lager igen:</p>
<p><a href="${esc(url)}" style="font-weight:bold;color:#0a58ca">${esc(title)}</a></p>
<p>Välkommen in och handla!</p>
<p>Vänliga hälsningar,<br>Teknikhouse</p>
<p style="font-size:11px;color:#888">Du får detta mejl eftersom du klickade på "Bevaka produkt" på teknikhouse.se.</p>
</div>`
    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: r.email, subject: `Nu finns ${title} i lager igen!`, html }),
      })
      if (!resp.ok) throw new Error("Resend " + resp.status)
      await q(pg, `UPDATE "stock_reminder" SET "notified_at" = now(), "updated_at" = now() WHERE "id" = ?`, [r.id])
      sent++
    } catch (e: any) {
      failed++
      if (errors.length < 5) errors.push(r.id + ": " + (e?.message || e))
    }
  }
  return res.json({ attempted: rows.length, sent, failed, errors })
}
