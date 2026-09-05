import { model, Module, MedusaService } from "@medusajs/framework/utils"
import createPurchasingTables from "./loaders/create-tables"

export const Supplier = model.define("supplier", {
  id: model.id().primaryKey(),
  name: model.text(),
  email: model.text().nullable(),
  ref_first_name: model.text().nullable(),
  ref_last_name: model.text().nullable(),
})

export const PurchaseOrder = model.define("purchase_order", {
  id: model.id().primaryKey(),
  supplier_id: model.text(),
  supplier_name: model.text().nullable(),
  status: model.text().default("open"),
  reference: model.text().nullable(),
})

export const PurchaseOrderLine = model.define("purchase_order_line", {
  id: model.id().primaryKey(),
  purchase_order_id: model.text(),
  variant_id: model.text().nullable(),
  product_id: model.text().nullable(),
  inventory_item_id: model.text().nullable(),
  title: model.text(),
  sku: model.text().nullable(),
  qty_ordered: model.number().default(0),
  qty_delivered: model.number().default(0),
  min_stock: model.number().default(0),
  cost: model.number().nullable(),
})

class PurchasingModuleService extends MedusaService({
  Supplier,
  PurchaseOrder,
  PurchaseOrderLine,
}) {}

export const PURCHASING_MODULE = "purchasing"

export default Module(PURCHASING_MODULE, {
  service: PurchasingModuleService,
  loaders: [createPurchasingTables],
})
