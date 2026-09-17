import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createShippingOptionsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Teknikhouse.se — one-time setup for the free-shipping-over-1000 calculated option.
 * Links the "teknik" fulfillment provider to the stock location (bypasses the admin
 * endpoint that no-ops on an existing DB) and creates the calculated "Standard" option.
 * Token-guarded, idempotent-ish; safe to call more than once.
 */
const TOKEN = "thmigrate-2026-shipping"
const SLOC = "sloc_01M1QG8WKE5DEY8SHWMN2TT4W6"
const ZONE = "serzo_01M1QG8WMQ31DN828FKCFMQGPF"
const PROFILE = "sp_01M1QG8P5DQ1Y9A9YTTN33F70C"
const PROVIDER = "teknik_teknik"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const b: any = (req as any).body || {}
  if (b.token !== TOKEN) {
    return res.status(401).json({ error: "bad token" })
  }
  const steps: any = {}

  // 1. Link the fulfillment provider to the stock location via the Link module.
  try {
    const link: any = req.scope.resolve(ContainerRegistrationKeys.LINK)
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: SLOC },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: PROVIDER },
    })
    steps.link = "ok"
  } catch (e: any) {
    steps.link = "err: " + String((e && e.message) || e).slice(0, 120)
  }

  // 2. Create the calculated Standard option.
  try {
    await createShippingOptionsWorkflow(req.scope).run({
      input: [
        {
          name: "Standard",
          service_zone_id: ZONE,
          shipping_profile_id: PROFILE,
          provider_id: PROVIDER,
          price_type: "calculated",
          type: {
            label: "Standard",
            description: "Standard - fri frakt over 1000 kr",
            code: "standard-free",
          },
          data: { id: "teknik-standard" },
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        } as any,
      ],
    })
    steps.option = "ok"
  } catch (e: any) {
    steps.option = "err: " + String((e && e.message) || e).slice(0, 160)
  }

  return res.json({ ok: true, steps })
}
