import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Buildings } from "@medusajs/icons"
import { Container, Heading, Text, Badge } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"

type Stats = {
  orders: number
  ordersYear: number
  salesYear: number
  customers: number
  products: number
  categories: number
  loading: boolean
}

const ADMIN = "/app"

async function count(path: string): Promise<number> {
  try {
    const r = await fetch(path, { credentials: "include" })
    const d = await r.json()
    return typeof d.count === "number" ? d.count : 0
  } catch {
    return 0
  }
}

function KontrollpanelPage() {
  const [s, setS] = useState<Stats>({
    orders: 0, ordersYear: 0, salesYear: 0, customers: 0,
    products: 0, categories: 0, loading: true,
  })

  useEffect(() => {
    let alive = true
    ;(async () => {
      const year = new Date().getFullYear()
      const [orders, customers, products, categories] = await Promise.all([
        count("/admin/orders?limit=1"),
        count("/admin/customers?limit=1"),
        count("/admin/products?limit=1"),
        count("/admin/product-categories?limit=1"),
      ])
      let ordersYear = 0, salesYear = 0, offset = 0
      try {
        for (let i = 0; i < 50; i++) {
          const r = await fetch(
            `/admin/orders?limit=200&offset=${offset}&fields=id,total,created_at`,
            { credentials: "include" }
          )
          const d = await r.json()
          const list = d.orders || []
          for (const o of list) {
            if (o.created_at && new Date(o.created_at).getFullYear() === year) {
              ordersYear++
              salesYear += Number(o.total || 0)
            }
          }
          if (list.length < 200) break
          offset += 200
        }
      } catch { /* ignore */ }
      if (alive) setS({ orders, ordersYear, salesYear, customers, products, categories, loading: false })
    })()
    return () => { alive = false }
  }, [])

  const sek = (n: number) =>
    new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(n)

  const groups = useMemo(() => ([
    {
      title: "Ordrar och kunder",
      tiles: [
        { emo: "📋", lab: "Visa ordrar", href: `${ADMIN}/orders`, live: true },
        { emo: "📊", lab: "Statistik", href: `${ADMIN}/kontrollpanel`, live: true },
        { emo: "📦", lab: "Inköp / Lager", href: `${ADMIN}/inventory`, live: true },
        { emo: "📇", lab: "Kunddatabas", href: `${ADMIN}/customers`, live: true },
        { emo: "👥", lab: "Avtalskunder", href: `${ADMIN}/customer-groups`, live: true },
        { emo: "🛒", lab: "Kampanjutskick", href: "#", live: false },
        { emo: "✉️", lab: "Nyhetsbrev", href: "#", live: false, note: "36 969" },
        { emo: "📱", lab: "SMS-utskick", href: "#", live: false },
      ],
    },
    {
      title: "Produkter",
      tiles: [
        { emo: "➕", lab: "Lägg in ny produkt", href: `${ADMIN}/products/create`, live: true },
        { emo: "🧰", lab: "Hantera produkter", href: `${ADMIN}/products`, live: true },
        { emo: "🗂️", lab: "Varugrupper", href: `${ADMIN}/categories`, live: true },
        { emo: "🔢", lab: "Produktsortering", href: `${ADMIN}/categories`, live: true },
        { emo: "💡", lab: "Rekommendationer", href: "#", live: false },
        { emo: "🏷️", lab: "Rabattkoder", href: `${ADMIN}/promotions`, live: true },
        { emo: "🎁", lab: "Köp X betala för Y", href: `${ADMIN}/promotions`, live: true },
        { emo: "🚚", lab: "Fraktinställningar", href: `${ADMIN}/settings/locations`, live: true },
      ],
    },
    {
      title: "Innehåll och inställningar",
      tiles: [
        { emo: "📄", lab: "Redigerbara sidor", href: "#", live: false },
        { emo: "📰", lab: "Nyheter", href: "#", live: false },
        { emo: "📝", lab: "Blogg", href: "#", live: false },
        { emo: "🍪", lab: "Cookie control", href: "#", live: false },
        { emo: "🔗", lab: "Länkar", href: "#", live: false },
        { emo: "🔀", lab: "Import / Export", href: `${ADMIN}/products`, live: true },
        { emo: "⭐", lab: "Recensioner / Betyg", href: "#", live: false },
        { emo: "🖼️", lab: "Bildspel på 1:a sidan", href: "#", live: false },
        { emo: "↪️", lab: "Hantera gamla URLer (301)", href: "#", live: false },
        { emo: "🌐", lab: "Språk och valuta", href: `${ADMIN}/settings/store`, live: true },
        { emo: "💳", lab: "Betalningsalternativ", href: `${ADMIN}/settings`, live: true },
        { emo: "📧", lab: "E-postmallar", href: "#", live: false },
        { emo: "⚙️", lab: "Grundinställningar", href: `${ADMIN}/settings`, live: true },
        { emo: "↩️", lab: "Returmodul", href: `${ADMIN}/settings/return-reasons`, live: true },
      ],
    },
    {
      title: "Externa system",
      tiles: [
        { emo: "🛍️", lab: "Google Produktfeed", href: "#", live: false },
        { emo: "📣", lab: "Annonsplattform", href: "#", live: false },
      ],
    },
    {
      title: "Information",
      tiles: [
        { emo: "🏢", lab: "Info - Affärssystem", href: "#", live: false },
        { emo: "📈", lab: "Info - Besöksstatistik", href: "#", live: false },
        { emo: "🧩", lab: "Moduler", href: "#", live: false },
      ],
    },
  ]), [])

  const kpis = [
    { k: "Sälj i år", v: s.loading ? "…" : sek(s.salesYear) },
    { k: "Ordrar i år", v: s.loading ? "…" : String(s.ordersYear) },
    { k: "Kunder", v: s.loading ? "…" : String(s.customers) },
    { k: "Produkter", v: s.loading ? "…" : String(s.products) },
    { k: "Varugrupper", v: s.loading ? "…" : String(s.categories) },
    { k: "Ordrar totalt", v: s.loading ? "…" : String(s.orders) },
  ]

  return (
    <Container className="p-0 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b">
        <div>
          <Heading level="h1">Kontrollpanelen</Heading>
          <Text size="small" className="text-ui-fg-subtle">Teknikhouse.se · Nordic Teknik House AB</Text>
        </div>
        <Badge color="green">SEK · Moms 25% inkl.</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-px bg-ui-border-base">
        {kpis.map((c) => (
          <div key={c.k} className="bg-ui-bg-base px-5 py-4">
            <Text size="xsmall" className="text-ui-fg-subtle">{c.k}</Text>
            <div className="text-2xl font-semibold mt-1">{c.v}</div>
          </div>
        ))}
      </div>

      <div className="px-6 pb-8">
        {groups.map((g) => (
          <div key={g.title} className="mt-8">
            <Heading level="h2" className="text-ui-fg-subtle border-b pb-2 mb-4">{g.title}</Heading>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {g.tiles.map((t) => (
                <a
                  key={t.lab}
                  href={t.href}
                  className="relative flex flex-col items-center text-center rounded-lg border border-transparent hover:border-ui-border-base hover:bg-ui-bg-base-hover px-3 pt-4 pb-5 min-h-[120px]"
                >
                  {!t.live && (
                    <span className="absolute top-2 right-2 text-[9px] px-2 py-[1px] rounded-full bg-ui-bg-subtle text-ui-fg-muted border">
                      {t.note || "snart"}
                    </span>
                  )}
                  <span className="text-4xl leading-none mb-3">{t.emo}</span>
                  <span className="text-xs font-medium text-ui-fg-base leading-tight">{t.lab}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Kontrollpanel",
  icon: Buildings,
})

export default KontrollpanelPage
