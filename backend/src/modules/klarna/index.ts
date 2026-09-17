import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import KlarnaProviderService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [KlarnaProviderService],
})
