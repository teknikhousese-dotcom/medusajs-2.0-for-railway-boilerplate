import { HttpTypes } from "@medusajs/types"
import { getProductsList } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { SearchResponse, SearchSort } from "@modules/search/actions"

type Props = {
  result: SearchResponse
  sort: SearchSort
  page: number
  countryCode: string
}

const SUGGEST: [string, string][] = [
  ["Mobilreservdelar", "/mobilreservdelar"],
  ["Mobiltillbehör", "/mobiltillbehor"],
  ["Batterier", "/batterier"],
  ["Kablar & Laddare", "/kablar-laddare"],
  ["Kampanjer", "/kampanjer"],
]

const SORTS: { v: SearchSort; n: string }[] = [
  { v: "relevance", n: "Mest relevant" },
  { v: "price_asc", n: "Lägst pris" },
  { v: "price_desc", n: "Högst pris" },
  { v: "newest", n: "Nyast" },
]

const FONT = '"Poppins",ui-rounded,system-ui,sans-serif'

const GRID =
  "grid grid-cols-2 min-[768px]:grid-cols-3 medium:grid-cols-4 large:grid-cols-5 gap-3 min-[768px]:gap-4 medium:gap-5"

function hrefFor(q: string, sort: SearchSort, page: number) {
  const params: string[] = []
  if (sort !== "relevance") params.push("sort=" + sort)
  if (page > 1) params.push("page=" + page)
  return "/results/" + encodeURIComponent(q) + (params.length ? "?" + params.join("&") : "")
}

function pageList(cur: number, total: number): (number | "gap")[] {
  const out: (number | "gap")[] = []
  const add = (n: number) => {
    if (n >= 1 && n <= total && !out.includes(n)) out.push(n)
  }
  add(1)
  if (cur - 2 > 2) out.push("gap")
  for (let n = cur - 2; n <= cur + 2; n++) add(n)
  if (cur + 2 < total - 1) out.push("gap")
  add(total)
  return out
}

export default async function SearchResultsTemplate({ result, sort, page, countryCode }: Props) {
  const q = result.q
  const total = result.count
  const pages = Math.max(1, Math.ceil(total / result.limit))
  const ids = result.hits.map((h) => h.id)

  let products: HttpTypes.StoreProduct[] = []
  let region: HttpTypes.StoreRegion | null = null
  if (ids.length) {
    region = (await getRegion(countryCode).catch(() => null)) || null
    const { response } = await getProductsList({
      queryParams: { id: ids, limit: ids.length } as any,
      countryCode,
    }).catch(() => ({ response: { products: [] as HttpTypes.StoreProduct[], count: 0 } }))
    const byId = new Map((response.products || []).map((p) => [p.id, p]))
    products = ids.map((id) => byId.get(id)).filter((p): p is HttpTypes.StoreProduct => !!p)
  }

  const from = total ? result.offset + 1 : 0
  const to = Math.min(total, result.offset + result.hits.length)
  const totalTxt = total.toLocaleString("sv-SE")

  return (
    <div className="content-container py-6" data-testid="search-results">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p style={{ fontSize: "13px", color: "#6f685f", margin: 0 }}>Sökresultat för</p>
          <h1
            className="break-words"
            style={{ fontFamily: FONT, fontWeight: 600, fontSize: "clamp(22px, 5.5vw, 27px)", color: "#1b1714", margin: "2px 0 0", lineHeight: 1.25 }}
          >
            &quot;{q}&quot;{" "}
            <span style={{ fontSize: "15px", fontWeight: 500, color: "#6f685f" }}>
              ({totalTxt} {total === 1 ? "träff" : "träffar"})
            </span>
          </h1>
          {result.partial && total > 0 ? (
            <p style={{ fontSize: "13.5px", color: "#6f685f", margin: "6px 0 0" }}>
              Inget matchade alla orden, så här är det som ligger närmast.
            </p>
          ) : null}
        </div>
        <LocalizedClientLink
          href="/store"
          className="text-sm text-ui-fg-subtle underline-offset-2 hover:text-ui-fg-base hover:underline"
        >
          Rensa sökningen
        </LocalizedClientLink>
      </div>

      {result.categories.length > 0 ? (
        <div className="mb-4">
          <p style={{ fontSize: "12px", fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: "#9a9187", margin: "0 0 8px" }}>
            Modeller och kategorier
          </p>
          <div className="flex flex-wrap gap-2">
            {result.categories.map((c) => (
              <LocalizedClientLink
                key={c.id}
                href={c.path}
                className="inline-flex items-center gap-1.5 rounded-full border border-ui-border-base bg-white px-3.5 py-2 text-sm font-medium text-ui-fg-base transition-colors hover:border-ui-fg-base"
              >
                {c.name}
                <span style={{ color: "#9a9187", fontWeight: 400 }}>{c.count}</span>
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      ) : null}

      {total > 0 ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-y border-ui-border-base py-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Sortera">
              {SORTS.map((s) => (
                <LocalizedClientLink
                  key={s.v}
                  href={hrefFor(q, s.v, 1)}
                  aria-current={sort === s.v ? "true" : undefined}
                  className={
                    "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors " +
                    (sort === s.v
                      ? "bg-neutral-900 text-white"
                      : "border border-ui-border-base bg-white text-ui-fg-base hover:border-ui-fg-base")
                  }
                >
                  {s.n}
                </LocalizedClientLink>
              ))}
            </div>
            <span className="text-sm text-ui-fg-subtle">
              {pages > 1 ? "Visar " + from + " till " + to + " av " + totalTxt : totalTxt + (total === 1 ? " produkt" : " produkter")}
            </span>
          </div>

          {region ? (
            <ul className={GRID} data-testid="products-list">
              {products.map((p) => (
                <li key={p.id}>
                  <ProductPreview product={p} region={region!} />
                </li>
              ))}
            </ul>
          ) : null}

          {pages > 1 ? (
            <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Sidor">
              {page > 1 ? (
                <LocalizedClientLink
                  href={hrefFor(q, sort, page - 1)}
                  className="rounded-full border border-ui-border-base bg-white px-4 py-2 text-sm font-medium hover:border-ui-fg-base"
                >
                  Föregående
                </LocalizedClientLink>
              ) : null}
              {pageList(page, pages).map((n, i) =>
                n === "gap" ? (
                  <span key={"g" + i} className="px-1 text-ui-fg-muted">
                    …
                  </span>
                ) : (
                  <LocalizedClientLink
                    key={n}
                    href={hrefFor(q, sort, n)}
                    aria-current={n === page ? "page" : undefined}
                    className={
                      "flex h-10 min-w-[40px] items-center justify-center rounded-full px-3 text-sm font-medium " +
                      (n === page ? "bg-neutral-900 text-white" : "border border-ui-border-base bg-white hover:border-ui-fg-base")
                    }
                  >
                    {n}
                  </LocalizedClientLink>
                )
              )}
              {page < pages ? (
                <LocalizedClientLink
                  href={hrefFor(q, sort, page + 1)}
                  className="rounded-full border border-ui-border-base bg-white px-4 py-2 text-sm font-medium hover:border-ui-fg-base"
                >
                  Nästa
                </LocalizedClientLink>
              ) : null}
            </nav>
          ) : null}
        </>
      ) : (
        <div
          className="mx-auto max-w-xl text-center"
          style={{ border: "1px solid #efeae5", borderRadius: "16px", background: "#faf8f6", padding: "32px 20px" }}
        >
          <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: "18px", color: "#1b1714", margin: "0 0 6px" }}>
            Vi hittade inget som matchar
          </p>
          <p style={{ fontSize: "14.5px", color: "#6f685f", margin: "0 0 18px", lineHeight: 1.55 }}>
            Kolla stavningen eller sök på modellen, till exempel &quot;iPhone 13 skärm&quot;. Du kan också bläddra i kategorierna.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGEST.map(([label, href]) => (
              <LocalizedClientLink
                key={href}
                href={href}
                className="rounded-full border border-ui-border-base bg-white px-4 py-2 text-sm font-medium text-ui-fg-base transition-colors hover:border-ui-fg-base"
              >
                {label}
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
