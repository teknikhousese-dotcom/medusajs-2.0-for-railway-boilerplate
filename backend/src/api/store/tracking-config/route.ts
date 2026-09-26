import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// Public, read-only subset of the Wiki "Grundinställningar" (wiki_config) that
// the storefront needs to load tracking tags after cookie consent. Only
// tracking IDs and the head/counter code snippets are exposed.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const svc: any = req.scope.resolve(Modules.STORE)
    const stores = await svc.listStores({}, { take: 1 })
    const store = stores && stores[0]
    const meta: any = (store && store.metadata) || {}
    const c: any = meta.wiki_config || {}
    const s = (v: any) => (v == null ? "" : String(v))
    res.setHeader("Cache-Control", "public, max-age=300")
    res.json({
      googleTagManagerID: s(c.googleTagManagerID).trim(),
      googleAnalyticsID: s(c.googleAnalyticsID).trim(),
      facebookPixelID: s(c.facebookPixelID).trim(),
      counterCodeEarly: s(c.counterCodeEarly),
      counterCode: s(c.counterCode),
      extraHeadCode: s(c.extraHeadCode),
      cookieBannerActive: s(c.cookieBannerActive) !== "0",
    })
  } catch (e) {
    res.json({})
  }
}
