import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

async function getStore(scope: any) {
  const svc = scope.resolve(Modules.STORE)
  const stores = await svc.listStores({}, { take: 1 })
  return stores && stores[0]
}

// Public read of the admin-managed 301 redirect rules (Wiki 301tool parity).
// The storefront middleware fetches this and issues real 301 redirects.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const store = await getStore(req.scope)
    const meta: any = (store && store.metadata) || {}
    const rules = Array.isArray(meta.url301) ? meta.url301 : []
    res.setHeader("Cache-Control", "public, max-age=60")
    res.json({ rules })
  } catch (e) {
    res.json({ rules: [] })
  }
}
