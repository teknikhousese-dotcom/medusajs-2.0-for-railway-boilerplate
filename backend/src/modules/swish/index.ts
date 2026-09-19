import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import SwishProviderService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [SwishProviderService],
})
