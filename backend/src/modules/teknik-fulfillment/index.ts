import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import TeknikFulfillmentService from "./service"

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [TeknikFulfillmentService],
})
