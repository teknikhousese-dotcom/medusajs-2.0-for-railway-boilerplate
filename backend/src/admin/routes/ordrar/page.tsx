import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useMemo, useState } from "react"

/**
 * Teknikhouse.se — Visa ordrar
 * Our own 1:1 mirror of Wikinggruppen's order_list.php + order_page.php,
 * built on top of Medusa's order engine. Reads live data from /admin/orders
 * with the logged-in session cookie. Replaces Medusa's native order screens.
 */

const ADMIN = "/app"

const OrdersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h6" />
  </svg>
)

const sek = (n: number) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", minimumFractionDigits: 2 }).format(Number(n || 0))

const dt = (s?: string) => {
  if (!s) return "—"
  try { return new Date(s).toLocaleString("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) } catch { return s }
}

const payLabel = (st?: string): { t: string; c: string } => {
  switch (st) {
    case "captured": case "paid": return { t: "Betald", c: "text-ui-tag-green-text" }
    case "partially_captured": return { t: "Delbetald", c: "text-ui-tag-orange-text" }
    case "refunded": case "partially_refunded": return { t: "Återbetald", c: "text-ui-tag-red-text" }
    case "canceled": return { t: "Makulerad", c: "text-ui-fg-muted" }
    default: return { t: "Ej betald", c: "text-ui-tag-red-text" }
  }
}

type MenuItem = { emo: string; lab: string; href?: string; s?: string; subs?: { lab: string; href?: string }[] }

// Wiki "Snabbmeny" — same order as controls.php, so the left menu matches the Kontrollpanel exactly.
const MENU: MenuItem[] = [
  { emo: "🏠", lab: "Start", href: `${ADMIN}/kontrollpanel` },
  { emo: "📋", lab: "Visa ordrar", href: `${ADMIN}/ordrar` },
  { emo: "📊", lab: "Statistik", href: `${ADMIN}/kontrollpanel?s=statistik` },
  { emo: "📦", lab: "Inköp / Lager", href: `${ADMIN}/kontrollpanel?s=lager` },
  { emo: "📇", lab: "Kunddatabas", href: `${ADMIN}/customers` },
  { emo: "🛒", lab: "Kampanjutskick", href: `${ADMIN}/kontrollpanel?s=kampanjutskick` },
  { emo: "✉️", lab: "Nyhetsbrev", href: `${ADMIN}/kontrollpanel?s=nyhetsbrev` },
  { emo: "📱", lab: "SMS-utskick", href: `${ADMIN}/kontrollpanel?s=sms` },
  { emo: "🤝", lab: "Avtalskunder", href: `${ADMIN}/customer-groups` },
  { emo: "🧰", lab: "Hantera produkter", href: `${ADMIN}/products` },
  { emo: "💡", lab: "Rekommendationer", href: `${ADMIN}/kontrollpanel?s=rekommendationer` },
  { emo: "🗂️", lab: "Hantera Varugrupper", href: `${ADMIN}/categories` },
  { emo: "🏷️", lab: "Rabattkoder", href: `${ADMIN}/promotions` },
  { emo: "🎁", lab: "Köp X betala för Y", href: `${ADMIN}/promotions` },
  { emo: "🚚", lab: "Fraktinställningar", href: `${ADMIN}/settings/locations` },
  { emo: "💳", lab: "Betalningsalternativ", href: `${ADMIN}/settings` },
  { emo: "📄", lab: "Redigerbara sidor", href: `${ADMIN}/kontrollpanel?s=sidor` },
  { emo: "📰", lab: "Nyheter", href: `${ADMIN}/kontrollpanel?s=nyheter` },
  { emo: "🔗", lab: "Länkar", href: `${ADMIN}/kontrollpanel?s=lankar` },
  { emo: "🔀", lab: "Import / Export", href: `${ADMIN}/products` },
  { emo: "⭐", lab: "Recensioner / Betyg", href: `${ADMIN}/kontrollpanel?s=recensioner` },
  { emo: "🖼️", lab: "Bildspel på 1:a sidan", href: `${ADMIN}/kontrollpanel?s=bildspel` },
  { emo: "📝", lab: "Blogg", href: `${ADMIN}/kontrollpanel?s=blogg` },
  { emo: "↪️", lab: "Hantera gamla URLer", href: `${ADMIN}/kontrollpanel?s=url301` },
  { emo: "🌐", lab: "Språk och valuta", href: `${ADMIN}/settings/store` },
  { emo: "🛍️", lab: "Google Shopping", href: `${ADMIN}/kontrollpanel?s=googlefeed` },
  { emo: "📧", lab: "E-postmallar", href: `${ADMIN}/kontrollpanel?s=epost` },
  { emo: "⚙️", lab: "Grundinställningar", href: `${ADMIN}/settings` },
]

function currentId(): string | null {
  try { return new URLSearchParams(window.location.search).get("id") } catch { return null }
}

function Snabbmeny({ unread, products }: { unread: number; products: number }) {
  return (
    <aside className="w-60 shrink-0 border-r bg-ui-bg-subtle rounded-l-lg overflow-hidden">
      <div className="px-4 py-3 border-b bg-ui-bg-base">
        <div className="text-sm font-semibold">Statistik</div>
        <div className="text-xs text-ui-fg-subtle mt-1">Olästa ordrar: <span className="font-semibold text-ui-fg-base">{unread} st</span></div>
        <div className="text-xs text-ui-fg-subtle">Produkter: <span className="font-semibold text-ui-fg-base">{products} st</span></div>
      </div>
      <nav className="py-1 text-[13px]">
        {MENU.map((m) => (
          <a key={m.lab} href={m.href}
            className={"w-full flex items-center gap-2 px-3 py-[7px] text-left no-underline hover:bg-ui-bg-base-hover border-b border-ui-border-base/40 " + (m.lab === "Visa ordrar" ? "bg-ui-bg-base-hover font-semibold" : "")}>
            <span className="text-base leading-none w-5 text-center">{m.emo}</span>
            <span className="text-ui-fg-base">{m.lab}</span>
          </a>
        ))}
        <a href={`${ADMIN}/login`} className="w-full flex items-center gap-2 px-3 py-[7px] text-left hover:bg-ui-bg-base-hover no-underline text-ui-fg-error border-b border-ui-border-base/40">
          <span className="text-base leading-none w-5 text-center">⏻</span>Logga ut
        </a>
      </nav>
    </aside>
  )
}

function OrderList({ onOpen }: { onOpen: (id: string) => void }) {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const r = await fetch(`${"/admin/orders"}?limit=100&order=-display_id&fields=id,display_id,email,total,currency_code,created_at,payment_status,*shipping_address,+metadata`, { credentials: "include" })
        const d = await r.json()
        if (alive) { setRows(d.orders || []); setLoading(false) }
      } catch { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return rows
    return rows.filter((o) => {
      const name = o.shipping_address ? `${o.shipping_address.first_name || ""} ${o.shipping_address.last_name || ""}` : ""
      return String(o.display_id).includes(t) || (o.email || "").toLowerCase().includes(t) || name.toLowerCase().includes(t) || String(o.metadata?.wiki_order_id || "").includes(t)
    })
  }, [rows, q])

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none">📋</span>
          <div>
            <h1 className="text-xl font-semibold">Visa ordrar</h1>
            <p className="text-sm text-ui-fg-subtle">Kontrollpanelen · Teknikhouse.se</p>
          </div>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sök ordernr, namn, e-post…"
          className="text-sm px-3 py-2 rounded-md border bg-ui-bg-field w-72" />
      </div>
      <div className="px-6 py-4">
        <div className="text-xs text-ui-fg-subtle mb-2">{loading ? "Laddar…" : `${filtered.length} ordrar`}</div>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-ui-bg-subtle text-left text-ui-fg-subtle border-b">
                <th className="px-3 py-2 font-normal">Ordernr</th>
                <th className="px-3 py-2 font-normal">Datum</th>
                <th className="px-3 py-2 font-normal">Kund</th>
                <th className="px-3 py-2 font-normal">Betalning</th>
                <th className="px-3 py-2 font-normal text-right">Summa</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const name = o.shipping_address ? `${o.shipping_address.first_name || ""} ${o.shipping_address.last_name || ""}`.trim() : ""
                const wid = o.metadata?.wiki_order_id
                const p = payLabel(o.payment_status)
                const when = o.metadata?.order_time || o.created_at
                return (
                  <tr key={o.id} onClick={() => onOpen(o.id)}
                    className="border-b border-ui-border-base/50 hover:bg-ui-bg-base-hover cursor-pointer">
                    <td className="px-3 py-2 font-medium">#{wid || o.display_id}</td>
                    <td className="px-3 py-2 text-ui-fg-subtle">{dt(when)}</td>
                    <td className="px-3 py-2">{name || o.email}</td>
                    <td className={"px-3 py-2 " + p.c}>{p.t}</td>
                    <td className="px-3 py-2 text-right font-medium">{sek(o.total)}</td>
                  </tr>
                )
              })}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-ui-fg-muted">Inga ordrar hittades.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Box({ title, children }: { title: string; children: any }) {
  return (
    <div className="bg-ui-bg-base border rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 font-semibold text-sm border-b bg-ui-bg-subtle">{title}</div>
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}
function Row({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex text-[13px] py-[3px]">
      <div className="w-40 shrink-0 text-ui-fg-subtle">{k}</div>
      <div className="text-ui-fg-base">{v}</div>
    </div>
  )
}

function OrderDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const [o, setO] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const f = "*items,*shipping_address,*billing_address,*shipping_methods,*payment_collections,+metadata,+display_id,+email,+currency_code,+total,+item_total,+item_subtotal,+shipping_total,+tax_total,+payment_status,+created_at"
        const r = await fetch(`/admin/orders/${id}?fields=${f}`, { credentials: "include" })
        const d = await r.json()
        if (alive) { setO(d.order); setLoading(false) }
      } catch { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [id])

  if (loading) return <div className="flex-1 px-6 py-10 text-ui-fg-muted text-sm">Laddar order…</div>
  if (!o) return <div className="flex-1 px-6 py-10 text-ui-fg-muted text-sm">Ordern kunde inte hämtas. <button onClick={onBack} className="underline">Tillbaka</button></div>

  const m = o.metadata || {}
  const sa = o.shipping_address || {}
  const ba = o.billing_address || {}
  const sm = (o.shipping_methods || [])[0]
  const p = payLabel(o.payment_status)
  const name = `${sa.first_name || ""} ${sa.last_name || ""}`.trim()
  const when = m.order_time || o.created_at
  const vat = m.vat_breakdown || {}
  const itemsSub = Number(o.item_subtotal ?? o.item_total ?? 0)
  const shipSub = Number(o.shipping_total ?? (sm ? sm.amount : 0))
  const taxTotal = Number(o.tax_total ?? 0)
  const grand = Number(o.total ?? 0)

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none">📋</span>
          <div>
            <h1 className="text-xl font-semibold">Order {m.wiki_order_id || o.display_id}</h1>
            <p className="text-sm text-ui-fg-subtle">{dt(when)} · <span className={p.c + " font-semibold"}>{p.t}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={`${ADMIN}/orders/${o.id}`} className="text-sm px-3 py-1.5 rounded-md border hover:bg-ui-bg-base-hover no-underline">Hantera / åtgärder ↗</a>
          <button onClick={onBack} className="text-sm px-3 py-1.5 rounded-md border hover:bg-ui-bg-base-hover">← Orderlistan</button>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-4">
          <Box title="Beställare">
            <Row k="Namn" v={name || "—"} />
            <Row k="Gatuadress" v={sa.address_1 || "—"} />
            <Row k="Postnr och Ort" v={`${sa.postal_code || ""} ${sa.city || ""}`.trim() || "—"} />
            <Row k="Land" v={(sa.country_code || "").toUpperCase() === "SE" ? "Sverige" : (sa.country_code || "—").toUpperCase()} />
            <Row k="Mobil" v={sa.phone || m.cell_phone || m.phone || "—"} />
            <Row k="E-mail" v={<span className="text-ui-fg-interactive">{o.email}</span>} />
          </Box>
          <Box title="Övrig information">
            <Row k="Leveransmetod" v={(sm && sm.name) || m.wiki_shipping_method || "—"} />
            <Row k="Totalvikt" v={`${m.order_weight_g ?? 0} g`} />
            <Row k="Betalsätt" v={m.payment_method || "—"} />
            <Row k="Tidpunkt" v={dt(when)} />
            <Row k="Språk / Valuta" v={`Svenska / ${(o.currency_code || "SEK").toUpperCase()}`} />
            <Row k="Ordernr (nytt)" v={`#${o.display_id}`} />
          </Box>
        </div>

        <Box title="Beställda varor">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-ui-fg-subtle border-b">
                <th className="py-1.5 pr-2 font-normal">Artikelnr</th>
                <th className="py-1.5 pr-2 font-normal">Produkt</th>
                <th className="py-1.5 px-2 font-normal text-right">Pris exkl.</th>
                <th className="py-1.5 px-2 font-normal text-center">Antal</th>
                <th className="py-1.5 pl-2 font-normal text-right">Summa</th>
              </tr>
            </thead>
            <tbody>
              {(o.items || []).map((it: any) => (
                <tr key={it.id} className="border-b border-ui-border-base/50">
                  <td className="py-1.5 pr-2 text-ui-fg-subtle">{it.variant_sku || (it.metadata && it.metadata.sku) || "—"}</td>
                  <td className="py-1.5 pr-2">{it.title}{it.subtitle ? <span className="text-ui-fg-muted"> · {it.subtitle}</span> : null}</td>
                  <td className="py-1.5 px-2 text-right">{sek(it.unit_price)}</td>
                  <td className="py-1.5 px-2 text-center">{it.quantity} st</td>
                  <td className="py-1.5 pl-2 text-right">{sek(Number(it.unit_price) * Number(it.quantity))}</td>
                </tr>
              ))}
              {sm && (
                <tr className="border-b border-ui-border-base/50">
                  <td className="py-1.5 pr-2 text-ui-fg-subtle">—</td>
                  <td className="py-1.5 pr-2">Frakt ({sm.name})</td>
                  <td className="py-1.5 px-2 text-right">{sek(sm.amount)}</td>
                  <td className="py-1.5 px-2 text-center">1 st</td>
                  <td className="py-1.5 pl-2 text-right">{sek(sm.amount)}</td>
                </tr>
              )}
            </tbody>
          </table>
          <table className="w-full text-[13px] mt-3">
            <tbody>
              <tr><td className="text-right text-ui-fg-subtle py-0.5">Summa varor exkl. moms:</td><td className="text-right w-40 py-0.5">{sek(itemsSub)}</td></tr>
              <tr><td className="text-right text-ui-fg-subtle py-0.5">Frakt exkl. moms:</td><td className="text-right py-0.5">{sek(shipSub)}</td></tr>
              <tr><td className="text-right text-ui-fg-subtle py-0.5">Varav moms (25%):</td><td className="text-right py-0.5">{sek(taxTotal)}</td></tr>
              <tr><td className="text-right font-semibold py-1 border-t">Totalt inkl. moms:</td><td className="text-right font-semibold py-1 border-t">{sek(grand)}</td></tr>
            </tbody>
          </table>
        </Box>

        <Box title="Meddelanden / loggar">
          <table className="w-full text-[13px]">
            <tbody>
              <tr><td className="text-ui-fg-subtle w-44 py-[3px]">{dt(when)}</td><td>Ordern lades.{m.payment_method ? ` Betalsätt: ${m.payment_method}.` : ""}</td></tr>
              {o.payment_status === "captured" && (
                <tr><td className="text-ui-fg-subtle py-[3px]">{dt(o.created_at)}</td><td>Betalning registrerad ({sek(grand)}).</td></tr>
              )}
              {m.wiki_order_id && (
                <tr><td className="text-ui-fg-subtle py-[3px]">—</td><td>Importerad från Wikinggruppen · Wiki-ordernr {m.wiki_order_id}.</td></tr>
              )}
            </tbody>
          </table>
        </Box>
      </div>
    </div>
  )
}

function OrdrarPage() {
  const [id, setId] = useState<string | null>(currentId)
  const [meta, setMeta] = useState({ unread: 0, products: 0 })

  // Hide Medusa's native left nav so only the Wiki Snabbmeny shows.
  useEffect(() => {
    const el = Array.from(document.querySelectorAll("div")).find((d) => {
      const c = typeof d.className === "string" ? d.className : ""
      return c.includes("w-[220px]") && c.includes("lg:flex") && c.includes("border-e")
    }) as HTMLElement | undefined
    const prev = el ? el.style.display : ""
    if (el) el.style.display = "none"
    return () => { if (el) el.style.display = prev }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const [o, p] = await Promise.all([
          fetch("/admin/orders?limit=1", { credentials: "include" }).then((r) => r.json()),
          fetch("/admin/products?limit=1", { credentials: "include" }).then((r) => r.json()),
        ])
        setMeta({ unread: o.count || 0, products: p.count || 0 })
      } catch { /* ignore */ }
    })()
  }, [])

  const open = (oid: string) => {
    setId(oid)
    try { const u = new URL(window.location.href); u.searchParams.set("id", oid); window.history.pushState({}, "", u.toString()) } catch { /* ignore */ }
    window.scrollTo(0, 0)
  }
  const back = () => {
    setId(null)
    try { const u = new URL(window.location.href); u.searchParams.delete("id"); window.history.pushState({}, "", u.toString()) } catch { /* ignore */ }
  }

  return (
    <div className="bg-ui-bg-base rounded-lg border overflow-hidden flex">
      <Snabbmeny unread={meta.unread} products={meta.products} />
      {id ? <OrderDetail id={id} onBack={back} /> : <OrderList onOpen={open} />}
    </div>
  )
}

export const config = defineRouteConfig({ label: "Visa ordrar", icon: OrdersIcon })
export default OrdrarPage
