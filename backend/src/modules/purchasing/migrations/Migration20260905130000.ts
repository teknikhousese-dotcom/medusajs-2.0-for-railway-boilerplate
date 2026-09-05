// @ts-nocheck
import { Migration } from "@mikro-orm/migrations"

export class Migration20260905130000 extends Migration {
  async up() {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "supplier" (
        "id" text NOT NULL,
        "name" text NOT NULL,
        "email" text NULL,
        "ref_first_name" text NULL,
        "ref_last_name" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_deleted_at" ON "supplier" ("deleted_at") WHERE "deleted_at" IS NULL;`)

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "purchase_order" (
        "id" text NOT NULL,
        "supplier_id" text NOT NULL,
        "supplier_name" text NULL,
        "status" text NOT NULL DEFAULT 'open',
        "reference" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "purchase_order_pkey" PRIMARY KEY ("id")
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_purchase_order_deleted_at" ON "purchase_order" ("deleted_at") WHERE "deleted_at" IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_purchase_order_supplier_id" ON "purchase_order" ("supplier_id");`)

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "purchase_order_line" (
        "id" text NOT NULL,
        "purchase_order_id" text NOT NULL,
        "variant_id" text NULL,
        "product_id" text NULL,
        "inventory_item_id" text NULL,
        "title" text NOT NULL,
        "sku" text NULL,
        "qty_ordered" integer NOT NULL DEFAULT 0,
        "qty_delivered" integer NOT NULL DEFAULT 0,
        "min_stock" integer NOT NULL DEFAULT 0,
        "cost" numeric NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "purchase_order_line_pkey" PRIMARY KEY ("id")
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_purchase_order_line_deleted_at" ON "purchase_order_line" ("deleted_at") WHERE "deleted_at" IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_purchase_order_line_po_id" ON "purchase_order_line" ("purchase_order_id");`)
  }

  async down() {
    this.addSql(`DROP TABLE IF EXISTS "purchase_order_line" CASCADE;`)
    this.addSql(`DROP TABLE IF EXISTS "purchase_order" CASCADE;`)
    this.addSql(`DROP TABLE IF EXISTS "supplier" CASCADE;`)
  }
}
