import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { getPg, q, genId } from "../../admin/editable/db"

/**
 * Teknikhouse.se — trade-in valuation request ("Sälj din enhet").
 * Records the customer's device + condition + contact so the shop can e-mail a
 * personal offer. Best-effort e-mail to info@teknikhouse.se (no-op if Resend
 * isn't configured — the request is still saved and shown in admin).
 */
export const AUTHENTICATE = false

async function ensure(pg: any) {
  await q(pg, `CREATE TABLE IF NOT EXISTS "valuation_request" (
    "id" text PRIMARY KEY,
    "reference" text,
    "device_type" text,
    "model" text,
    "storage" text,
    "condition" text,
    "issues" jsonb,
    "accessories" text,
    "name" text,
    "email" text,
    "phone" text,
    "message" text,
    "status" text DEFAULT 'ny',
    "created_at" timestamptz DEFAULT now(),
    "deleted_at" timestamptz
  )`, [])
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b: any = req.body || {}
  const email = String(b.email || "").trim().toLowerCase()
  const name = String(b.name || "").trim()
  const device_type = String(b.device_type || "").trim()
  const model = String(b.model || "").trim()
  res.setHeader("Cache-Control", "no-store")
  if (!email || !email.includes("@") || !device_type || !model) {
    return res.status(400).json({ error: "Fyll i enhet, modell, namn och en giltig e-postadress." })
  }
  const issues = Array.isArray(b.issues) ? b.issues.map((x: any) => String(x)).slice(0, 20) : []
  try {
    const pg = getPg(req.scope)
    if (!pg) return res.status(500).json({ error: "Databasen är inte tillgänglig just nu." })
    await ensure(pg)
    const id = genId("val")
    const reference = "VAL-" + new Date().getFullYear() + "-" + id.slice(-6).toUpperCase()
    await q(pg,
      `INSERT INTO "valuation_request" ("id","reference","device_type","model","storage","condition","issues","accessories","name","email","phone","message","status")
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, reference, device_type, model, String(b.storage || ""), String(b.condition || ""), JSON.stringify(issues), String(b.accessories || ""), name, email, String(b.phone || ""), String(b.message || "").slice(0, 2000), "ny"])
    try {
      const notif: any = req.scope.resolve(Modules.NOTIFICATION)
      const text = "Ny värderingsförfrågan " + reference + "\n" +
        "Enhet: " + device_type + " " + model + (b.storage ? " " + b.storage : "") + "\n" +
        "Skick: " + (b.condition || "-") + "\n" +
        (issues.length ? "Fel: " + issues.join(", ") + "\n" : "") +
        "Tillbehör: " + (b.accessories || "-") + "\n" +
        "Kund: " + name + " — " + email + (b.phone ? " — " + b.phone : "") +
        (b.message ? "\n\nMeddelande: " + b.message : "")
      await notif.createNotifications({ to: "info@teknikhouse.se", channel: "email", template: "valuation-request",
        content: { subject: "Ny värdering: " + device_type + " " + model, text }, data: { reference, ...b } })
    } catch { /* notification module not configured */ }
    return res.json({ ok: true, reference })
  } catch (e: any) {
    return res.status(500).json({ error: String((e && e.message) || e).slice(0, 160) })
  }
}
