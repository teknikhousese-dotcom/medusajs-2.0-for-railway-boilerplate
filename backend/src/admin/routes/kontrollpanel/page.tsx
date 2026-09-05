import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useMemo, useState } from "react"

/**
 * Teknikhouse.se — Kontrollpanel
 * A 1:1 Swedish mirror of the Wikinggruppen "butikadmin" control panel, built
 * as a native Medusa admin route. The dashboard shows live store stats and the
 * same grouped section tiles. Every Wiki section opens a real Swedish page:
 * native features link into the live Medusa admin; custom features open an
 * in-hub Swedish page. All data is read same-origin with the session cookie.
 */

const ADMIN = "/app"
const PanelIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
)

async function count(path: string): Promise<number> {
  try {
    const r = await fetch(path, { credentials: "include" })
    const d = await r.json()
    return typeof d.count === "number" ? d.count : 0
  } catch { return 0 }
}

type Tile = { emo: string; lab: string; sub?: string; href?: string; section?: string; note?: string }
type Section = {
  key: string; emo: string; title: string; intro: string;
  status?: "live" | "planering"; bullets?: string[]; actions?: { lab: string; href: string }[]; wiki?: string;
}

function initialView(): string {
  try {
    const p = new URLSearchParams(window.location.search).get("s")
    return p || "home"
  } catch { return "home" }
}

function KontrollpanelPage() {
  const [view, setView] = useState<string>(initialView)
  const [s, setS] = useState({ orders: 0, ordersYear: 0, salesYear: 0, customers: 0, products: 0, categories: 0, loading: true })

  useEffect(() => {
    let alive = true
    ;(async () => {
      const year = new Date().getFullYear()
      const [orders, customers, products, categories] = await Promise.all([
        count("/admin/orders?limit=1"), count("/admin/customers?limit=1"),
        count("/admin/products?limit=1"), count("/admin/product-categories?limit=1"),
      ])
      let ordersYear = 0, salesYear = 0, offset = 0
      try {
        for (let i = 0; i < 50; i++) {
          const r = await fetch(`/admin/orders?limit=200&offset=${offset}&fields=id,total,created_at`, { credentials: "include" })
          const d = await r.json(); const list = d.orders || []
          for (const o of list) { if (o.created_at && new Date(o.created_at).getFullYear() === year) { ordersYear++; salesYear += Number(o.total || 0) } }
          if (list.length < 200) break; offset += 200
        }
      } catch { /* ignore */ }
      if (alive) setS({ orders, ordersYear, salesYear, customers, products, categories, loading: false })
    })()
    return () => { alive = false }
  }, [])

  const sek = (n: number) => new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(n)
  const aov = s.ordersYear > 0 ? s.salesYear / s.ordersYear : 0

  const go = (t: Tile) => {
    if (t.href) { window.location.href = t.href }
    else if (t.section) { setView(t.section); window.scrollTo(0, 0) }
  }

  const groups: { title: string; tiles: Tile[] }[] = useMemo(() => ([
    { title: "Ordrar och kunder", tiles: [
      { emo: "📋", lab: "Visa ordrar", href: `${ADMIN}/orders` },
      { emo: "📊", lab: "Statistik", section: "statistik" },
      { emo: "📦", lab: "Inköp / Lager", section: "lager" },
      { emo: "📇", lab: "Kunddatabas", href: `${ADMIN}/customers` },
      { emo: "🤝", lab: "Avtalskunder", href: `${ADMIN}/customer-groups` },
      { emo: "🛒", lab: "Kampanjutskick", section: "kampanjutskick" },
      { emo: "✉️", lab: "Nyhetsbrev", section: "nyhetsbrev", note: "36 968" },
      { emo: "📱", lab: "SMS-utskick", section: "sms" },
    ]},
    { title: "Produkter", tiles: [
      { emo: "➕", lab: "Lägg in ny produkt", sub: "Kopiera produkt", href: `${ADMIN}/products/create` },
      { emo: "🧰", lab: "Hantera produkter", href: `${ADMIN}/products` },
      { emo: "🗂️", lab: "Varugrupper", href: `${ADMIN}/categories` },
      { emo: "🔢", lab: "Produktsortering", sub: "Produktfiltrering", href: `${ADMIN}/categories` },
      { emo: "💡", lab: "Rekommendationer", section: "rekommendationer" },
      { emo: "🏷️", lab: "Rabattkoder", href: `${ADMIN}/promotions` },
      { emo: "🎁", lab: "Köp X betala för Y", href: `${ADMIN}/promotions` },
      { emo: "🚚", lab: "Fraktinställningar", href: `${ADMIN}/settings/locations` },
    ]},
    { title: "Innehåll och inställningar", tiles: [
      { emo: "📄", lab: "Redigerbara sidor", section: "sidor" },
      { emo: "📰", lab: "Nyheter", section: "nyheter" },
      { emo: "📝", lab: "Blogg", section: "blogg" },
      { emo: "🍪", lab: "Cookie control", section: "cookie" },
      { emo: "🔗", lab: "Länkar", section: "lankar" },
      { emo: "🔀", lab: "Import / Export", href: `${ADMIN}/products` },
      { emo: "⭐", lab: "Recensioner / Betyg", section: "recensioner" },
      { emo: "🖼️", lab: "Bildspel på 1:a sidan", section: "bildspel" },
      { emo: "↪️", lab: "Hantera gamla URLer (301)", section: "url301" },
      { emo: "🌐", lab: "Språk och valuta", href: `${ADMIN}/settings/store` },
      { emo: "💳", lab: "Betalningsalternativ", href: `${ADMIN}/settings` },
      { emo: "📧", lab: "E-postmallar", section: "epost" },
      { emo: "⚙️", lab: "Grundinställningar", href: `${ADMIN}/settings` },
      { emo: "↩️", lab: "Returmodul", href: `${ADMIN}/settings/return-reasons` },
    ]},
    { title: "Externa system", tiles: [
      { emo: "🛍️", lab: "Google Produktfeed", section: "googlefeed" },
      { emo: "📣", lab: "Annonsplattform", section: "annons" },
    ]},
    { title: "Information", tiles: [
      { emo: "🏢", lab: "Info - Affärssystem", section: "info-system" },
      { emo: "📈", lab: "Info - Besöksstatistik", section: "info-besok" },
      { emo: "🧩", lab: "Moduler", section: "moduler" },
    ]},
  ]), [])

  const sections: Record<string, Section> = {
    statistik: { key: "statistik", emo: "📊", title: "Statistik", status: "live",
      intro: "Försäljnings- och butiksstatistik. Siffrorna nedan läses live från butiken.",
      wiki: "Motsvarar Wikinggruppens Statistik-sektion." },
    lager: { key: "lager", emo: "📦", title: "Inköp / Lager", status: "live",
      intro: "Lagersaldo och inventering hanteras i Medusas lagermodul. Inköp och automatisk lagersynk (t.ex. mot G-SP) läggs till som egen modul senare.",
      actions: [{ lab: "Öppna Lager & Inventering", href: `${ADMIN}/inventory` }],
      wiki: "Motsvarar Inköp/Lager. G-SP-synk finns inte i Wiki och byggs senare." },
    kampanjutskick: { key: "kampanjutskick", emo: "🛒", title: "Kampanjutskick", status: "planering",
      intro: "Automatiska utskick till kunder med övergivna kundvagnar samt kampanjmejl.",
      bullets: ["Övergivna kundvagnar – påminnelse-mejl", "Riktade kampanjer till kundsegment", "Koppling till Klaviyo/Mailchimp för spårning"],
      wiki: "Motsvarar Wikinggruppens Kampanjutskick." },
    nyhetsbrev: { key: "nyhetsbrev", emo: "✉️", title: "Nyhetsbrev", status: "planering",
      intro: "Din nyhetsbrevslista med 36 968 prenumeranter flyttas hit. Vi rekommenderar att koppla Klaviyo eller Mailchimp för utskick och statistik.",
      bullets: ["Visa prenumeranter (36 968 st)", "Skriv nytt nyhetsbrev", "Hantera skickade nyhetsbrev", "Hantera HTML-mallar"],
      wiki: "Motsvarar Nyhetsbrev + underval. Listan exporteras i Fas 0 – en värdefull tillgång." },
    sms: { key: "sms", emo: "📱", title: "SMS-utskick", status: "planering",
      intro: "SMS-utskick till kunder – orderaviseringar och kampanjer via en SMS-leverantör.",
      wiki: "Motsvarar Wikinggruppens SMS-utskick." },
    rekommendationer: { key: "rekommendationer", emo: "💡", title: "Rekommendationer", status: "planering",
      intro: "Produktrekommendationer i butiken – \"Andra köpte också\", tillbehör till reservdelen, relaterade modeller.",
      wiki: "Motsvarar Rekommendationer." },
    sidor: { key: "sidor", emo: "📄", title: "Redigerbara sidor", status: "planering",
      intro: "CMS-sidor du kan redigera själv – t.ex. Om oss, Frakt & retur, och Sälj din enhet (trade-in-sidan).",
      wiki: "Motsvarar Redigerbara sidor. Trade-in-sidan (område 69) migreras hit." },
    nyheter: { key: "nyheter", emo: "📰", title: "Nyheter", status: "planering",
      intro: "Publicera nyheter och meddelanden på butiken (kampanjer, driftinfo, öppettider).",
      wiki: "Motsvarar Nyheter + Skapa ny nyhet." },
    blogg: { key: "blogg", emo: "📝", title: "Blogg", status: "planering",
      intro: "Bloggmodul för SEO-innehåll (guider: byta iPhone-skärm, sälj din mobil, m.m.).",
      wiki: "Motsvarar Blogg." },
    cookie: { key: "cookie", emo: "🍪", title: "Cookie control", status: "planering",
      intro: "Cookie-samtycke (GDPR) i butiken – banner och kategorier för spårning.",
      wiki: "Motsvarar Cookie control." },
    lankar: { key: "lankar", emo: "🔗", title: "Länkar", status: "planering",
      intro: "Hantera länkar i sidfot och menyer.",
      wiki: "Motsvarar Länkar." },
    recensioner: { key: "recensioner", emo: "⭐", title: "Recensioner / Betyg", status: "planering",
      intro: "Kundrecensioner och betyg. Dina 10+ år av organiska omdömen är en stor tillgång – vi kan visa dem i butiken eller via Trustpilot.",
      wiki: "Motsvarar Recensioner/Betyg." },
    bildspel: { key: "bildspel", emo: "🖼️", title: "Bildspel på 1:a sidan", status: "planering",
      intro: "Banners och bildspel på startsidan (reservdelar-kampanjer, säsong).",
      wiki: "Motsvarar Bildspel på 1:a sidan." },
    url301: { key: "url301", emo: "↪️", title: "Hantera gamla URLer (301)", status: "planering",
      intro: "301-omdirigeringar – kritiskt vid flytten. Alla 6 534 indexerade Wiki-URL:er bevaras exakt så att Google-rankningen följer med. Kartan är redan förberedd (url-redirect-map.csv).",
      wiki: "Motsvarar Hantera gamla URLer. Viktigast av allt vid migreringen." },
    epost: { key: "epost", emo: "📧", title: "E-postmallar", status: "live",
      intro: "Transaktionsmejl (orderbekräftelse, lösenordsåterställning) skickas via Resend och kan redigeras som mallar. Redan förkonfigurerat i plattformen.",
      wiki: "Motsvarar E-postmallar." },
    googlefeed: { key: "googlefeed", emo: "🛍️", title: "Google Produktfeed", status: "planering",
      intro: "Produktfeed till Google Shopping / Merchant Center. Vi genererar och styr feeden själva (titel, pris, EAN/GTIN, lager, bilder).",
      wiki: "Motsvarar Google Shopping / Google Produktfeed." },
    annons: { key: "annons", emo: "📣", title: "Annonsplattform", status: "planering",
      intro: "Annonsering – Google Ads hanteras externt; här samlar vi status och länkar.",
      wiki: "Motsvarar Annonsplattform." },
    "info-system": { key: "info-system", emo: "🏢", title: "Info - Affärssystem", status: "live",
      intro: "Nordic Teknik House AB · teknikhouse.se. Plattform: Medusa 2.0 (öppen källkod, egenägd) + Next.js på Railway. Valuta SEK, moms 25 % inkl. Vi äger koden – inga vendor-lås.",
      wiki: "Motsvarar Info - Affärssystem." },
    "info-besok": { key: "info-besok", emo: "📈", title: "Info - Besöksstatistik", status: "planering",
      intro: "Besöksstatistik via GA4 (249987285) och Search Console. Widgets för trafik och konvertering läggs in här.",
      wiki: "Motsvarar Info - Besöksstatistik." },
    moduler: { key: "moduler", emo: "🧩", title: "Moduler", status: "planering",
      intro: "Tilläggsmoduler och integrationer (betalningar Klarna/Swish, sök MeiliSearch, m.m.).",
      wiki: "Motsvarar Moduler." },
  }

  const kpis = [
    { k: "Sälj i år", v: s.loading ? "…" : sek(s.salesYear) },
    { k: "Ordrar i år", v: s.loading ? "…" : String(s.ordersYear) },
    { k: "Snittorder", v: s.loading ? "…" : sek(aov) },
    { k: "Kunder", v: s.loading ? "…" : String(s.customers) },
    { k: "Produkter", v: s.loading ? "…" : String(s.products) },
    { k: "Varugrupper", v: s.loading ? "…" : String(s.categories) },
  ]

  if (view !== "home" && sections[view]) {
    const sec = sections[view]
    return (
      <div className="bg-ui-bg-base rounded-lg border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none">{sec.emo}</span>
            <div>
              <h1 className="text-xl font-semibold">{sec.title}</h1>
              <p className="text-sm text-ui-fg-subtle">Kontrollpanelen · Teknikhouse.se</p>
            </div>
          </div>
          <button onClick={() => setView("home")} className="text-sm px-3 py-1.5 rounded-md border hover:bg-ui-bg-base-hover">← Tillbaka</button>
        </div>
        <div className="px-6 py-6 max-w-3xl">
          <div className="mb-4">
            {sec.status === "live"
              ? <span className="text-xs px-3 py-1 rounded-full bg-ui-tag-green-bg text-ui-tag-green-text border border-ui-tag-green-border">Aktiv</span>
              : <span className="text-xs px-3 py-1 rounded-full bg-ui-tag-orange-bg text-ui-tag-orange-text border border-ui-tag-orange-border">Under uppbyggnad</span>}
          </div>
          <p className="text-base leading-relaxed mb-5">{sec.intro}</p>

          {sec.key === "statistik" && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-ui-border-base rounded-lg overflow-hidden border mb-6">
              {[
                { k: "Försäljning i år", v: s.loading ? "…" : sek(s.salesYear) },
                { k: "Antal ordrar i år", v: s.loading ? "…" : String(s.ordersYear) },
                { k: "Snittordervärde", v: s.loading ? "…" : sek(aov) },
                { k: "Ordrar totalt", v: s.loading ? "…" : String(s.orders) },
                { k: "Kunder totalt", v: s.loading ? "…" : String(s.customers) },
                { k: "Produkter i katalog", v: s.loading ? "…" : String(s.products) },
              ].map((c) => (
                <div key={c.k} className="bg-ui-bg-base px-5 py-4">
                  <p className="text-xs text-ui-fg-subtle">{c.k}</p>
                  <div className="text-2xl font-semibold mt-1">{c.v}</div>
                </div>
              ))}
            </div>
          )}

          {sec.bullets && (
            <ul className="list-disc pl-5 space-y-1.5 mb-5 text-sm text-ui-fg-subtle">
              {sec.bullets.map((b) => <li key={b}>{b}</li>)}
            </ul>
          )}
          {sec.actions && (
            <div className="flex flex-wrap gap-2 mb-5">
              {sec.actions.map((a) => (
                <a key={a.lab} href={a.href} className="text-sm px-3 py-2 rounded-md bg-ui-button-inverted text-ui-fg-on-inverted hover:opacity-90 no-underline">{a.lab} ↗</a>
              ))}
            </div>
          )}
          {sec.wiki && <p className="text-xs text-ui-fg-muted border-t pt-4">{sec.wiki}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-ui-bg-base rounded-lg border overflow-hidden">
      {/* controls.php-style topbar: Till butiken · wordmark · Logga ut */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <a href="https://teknikhouse.se" target="_blank" rel="noopener" className="flex flex-col items-center gap-0.5 text-[11px] text-ui-fg-interactive no-underline">
          <span className="text-2xl leading-none">🌐</span>Till butiken
        </a>
        <div className="text-center">
          <div className="text-3xl font-extrabold tracking-tight leading-none">Teknik<span className="text-ui-fg-interactive">house</span>.se</div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-ui-fg-muted mt-1">Framgångsrik e-handel · Medusa</div>
        </div>
        <a href={`${ADMIN}/login`} className="flex flex-col items-center gap-0.5 text-[11px] text-ui-fg-error no-underline">
          <span className="text-2xl leading-none">⏻</span>Logga ut
        </a>
      </div>

      {/* Order alert, like Wiki's "Du har X olästa ordrar" */}
      <div className="px-6 pt-4">
        {s.orders > 0 ? (
          <button onClick={() => { window.location.href = `${ADMIN}/orders` }}
            className="w-full text-left text-sm font-semibold px-4 py-2.5 rounded-md border bg-ui-tag-orange-bg text-ui-tag-orange-text border-ui-tag-orange-border">
            Du har {s.orders} olästa ordrar! Klicka på orderknappen nedan.
          </button>
        ) : (
          <div className="w-full text-sm px-4 py-2.5 rounded-md border bg-ui-tag-green-bg text-ui-tag-green-text border-ui-tag-green-border">
            Butiken är uppe · SEK · Moms 25 % inkl. · {s.loading ? "…" : s.products} produkter · {s.loading ? "…" : s.categories} varugrupper
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-px bg-ui-border-base mt-4">
        {kpis.map((c) => (
          <div key={c.k} className="bg-ui-bg-base px-5 py-4">
            <p className="text-xs text-ui-fg-subtle">{c.k}</p>
            <div className="text-2xl font-semibold mt-1">{c.v}</div>
          </div>
        ))}
      </div>

      <div className="px-6 pb-8">
        {groups.map((g) => (
          <div key={g.title} className="mt-8">
            <h2 className="text-lg font-normal text-ui-fg-muted border-b pb-2 mb-5">{g.title}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {g.tiles.map((t) => (
                <button key={t.lab} onClick={() => go(t)}
                  className="flex flex-col items-center text-center rounded-lg border border-transparent hover:border-ui-border-base hover:bg-ui-bg-base-hover px-3 pt-5 pb-6 min-h-[150px]">
                  <span className="text-6xl leading-none mb-3">{t.emo}</span>
                  <span className="text-sm font-medium text-ui-fg-base leading-tight">{t.lab}</span>
                  {t.sub && <span className="text-[11px] text-ui-fg-muted mt-0.5">{t.sub}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
        <p className="text-xs text-ui-fg-muted mt-8 border-t pt-4">
          Speglad 1:1 från Wikinggruppens butikadmin. Blå kort öppnar den riktiga Medusa-adminen; övriga öppnar en svensk sektionssida.
        </p>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Kontrollpanel", icon: PanelIcon })
export default KontrollpanelPage
