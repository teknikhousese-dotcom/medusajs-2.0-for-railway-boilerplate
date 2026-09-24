import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import KustomProviderService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [KustomProviderService],
})
