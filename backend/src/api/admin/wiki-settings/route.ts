import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// Wiki settings mirror (config.php / shipping.php / payment_options.php /
// languages.php). Each Wiki settings screen persists a JSON blob into the
// Medusa Store's metadata under a "wiki_<group>" key, so no extra table or
// migration is needed and the values survive deploys.

function storeSvc(scope: any) { return scope.resolve(Modules.STORE) }

async function getStore(scope: any) {
  const svc = storeSvc(scope)
  const stores = await svc.listStores({}, { take: 1 })
  return (stores && stores[0]) || null
}

const GROUPS = ["config", "shipping", "payment", "languages"]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const group = String(req.query.group || "")
    if (!GROUPS.includes(group)) return res.status(400).json({ error: "okänd grupp" })
    const store = await getStore(req.scope)
    const meta = (store && store.metadata) || {}
    const data = meta["wiki_" + group] || {}
    res.json({ group, data })
  } catch (e: any) { res.status(500).json({ error: String((e && e.message) || e) }) }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b: any = req.body || {}
  try {
    const group = String(b.group || "")
    if (!GROUPS.includes(group)) return res.status(400).json({ error: "okänd grupp" })
    const store = await getStore(req.scope)
    if (!store) return res.status(500).json({ error: "ingen butik hittades" })
    const meta = Object.assign({}, store.metadata || {})
    meta["wiki_" + group] = b.data || {}
    await storeSvc(req.scope).updateStores(store.id, { metadata: meta })
    res.json({ ok: true })
  } catch (e: any) { res.status(500).json({ error: String((e && e.message) || e) }) }
}
