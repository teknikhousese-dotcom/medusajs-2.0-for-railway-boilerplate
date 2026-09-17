import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPg, ensureTables, q } from "../admin/editable/db"

const TOKEN = "thmigrate-2026-editable"

function cors(res: MedusaResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  cors(res)
  res.status(200).send("")
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  cors(res)
  const b: any = (req as any).body || {}
  if (b.token !== TOKEN) { res.status(401).json({ message: "bad token" }); return }
  const slug = String(b.slug || "")
  const content = String(b.content || "")
  if (!slug || !content) { res.status(400).json({ message: "slug and content required" }); return }
  const pg = getPg((req as any).scope)
  await ensureTables(pg)
  await q(pg, "UPDATE editable_page SET content = ?, updated_at = NOW() WHERE slug = ?", [content, slug])
  res.status(200).json({ ok: true, slug: slug, len: content.length })
}
