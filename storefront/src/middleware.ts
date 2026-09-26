import { HttpTypes } from "@medusajs/types"
import { notFound } from "next/navigation"
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
// Must be a country the backend actually has a region for. The seed script
// creates a single "Europe" region covering gb, de, dk, se, fr, es and it, so
// "gb" is the default that matches a freshly seeded store. Change this together
// with the regions in backend/src/scripts/seed.ts.
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "gb"

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

// httpOnly because nothing on the client ever reads this. lib/data/cookies.ts
// is "server-only", so the id is consumed exclusively during server rendering.
// sameSite is left at the default rather than "strict" on purpose: a visitor
// arriving from an external link would otherwise not send it, be issued a new
// one, and lose their warm cache on every inbound visit.
const CACHE_ID_COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
} as const

// --- Category handle cache: middleware resolves teknikhouse-style
// /dept[/brand[/model]][/produkt-slug] paths against the live category
// handles, refreshed hourly like the region map above. ---
const categoryHandleCache = {
  handles: new Set<string>(),
  updated: 0,
}

async function getCategoryHandleSet(): Promise<Set<string>> {
  if (
    categoryHandleCache.handles.size > 0 &&
    categoryHandleCache.updated > Date.now() - 3600 * 1000
  ) {
    return categoryHandleCache.handles
  }
  if (!BACKEND_URL) return categoryHandleCache.handles
  try {
    const data = await fetch(
      `${BACKEND_URL}/store/product-categories?limit=1000&fields=handle`,
      {
        headers: { "x-publishable-api-key": PUBLISHABLE_API_KEY! },
        next: { revalidate: 3600, tags: ["category-handles"] },
        cache: "force-cache",
      }
    ).then((r) => r.json())
    const next = new Set<string>()
    for (const c of data?.product_categories || []) {
      if (c?.handle) next.add(c.handle)
    }
    if (next.size > 0) {
      categoryHandleCache.handles = next
      categoryHandleCache.updated = Date.now()
    }
  } catch (e) {
    // keep whatever we had cached on failure
  }
  return categoryHandleCache.handles
}

async function getRegionMap() {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    // Fetch regions from Medusa. We can't use the JS client here because middleware is running on Edge and the client needs a Node environment.
    const { regions } = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY!,
      },
      next: {
        revalidate: 3600,
        tags: ["regions"],
      },
    }).then((res) => res.json())

    if (!regions?.length) {
      notFound()
    }

    // Create a map of country codes to regions.
    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region)
      })
    })

    regionMapCache.regionMapUpdated = Date.now()
  }

  return regionMapCache.regionMap
}

/**
 * Fetches regions from Medusa and sets the region cookie.
 * @param request
 * @param response
 */
async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  try {
    let countryCode

    const vercelCountryCode = request.headers
      .get("x-vercel-ip-country")
      ?.toLowerCase()

    const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      countryCode = urlCountryCode
    } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      countryCode = vercelCountryCode
    } else if (regionMap.has(DEFAULT_REGION)) {
      countryCode = DEFAULT_REGION
    } else if (regionMap.keys().next().value) {
      countryCode = regionMap.keys().next().value
      // Falling back here means NEXT_PUBLIC_DEFAULT_REGION names a country no
      // region covers, so shoppers land somewhere arbitrary with that region's
      // currency. Say so rather than failing over silently.
      console.warn(
        `Middleware.ts: no region covers NEXT_PUBLIC_DEFAULT_REGION "${DEFAULT_REGION}". Falling back to "${countryCode}". Add that country to a region in Medusa Admin, or set NEXT_PUBLIC_DEFAULT_REGION to one you already serve.`
      )
    }

    return countryCode
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Middleware.ts: Error getting the country code. Did you set up regions in your Medusa Admin and define a NEXT_PUBLIC_MEDUSA_BACKEND_URL environment variable?"
      )
    }
  }
}

/**
 * Middleware to handle region selection.
 */
// --- Admin-managed 301 redirects (Wiki 301tool parity). Rules edited in /app/url301. ---
let __u301Cache: { at: number; rules: any[] } = { at: 0, rules: [] }
async function getUrl301Rules(): Promise<any[]> {
  const now = Date.now()
  if (now - __u301Cache.at < 60000) return __u301Cache.rules
  try {
    const r = await fetch(BACKEND_URL + "/url301", { headers: { accept: "application/json" } })
    if (r.ok) {
      const d = await r.json()
      __u301Cache = { at: now, rules: Array.isArray(d.rules) ? d.rules : [] }
    } else {
      __u301Cache = { at: now, rules: __u301Cache.rules }
    }
  } catch (e) {
    __u301Cache = { at: now, rules: __u301Cache.rules }
  }
  return __u301Cache.rules
}
function __u301IsAbs(u: string): boolean {
  const l = (u || "").toLowerCase()
  return l.indexOf("http://") === 0 || l.indexOf("https://") === 0
}
// Relativa mal utan avslutande snedstreck, sa att en 301 inte foljs av en extra 308.
function __u301Clean(u: string): string {
  if (!u || __u301IsAbs(u) || u.indexOf("?") >= 0) return u
  let v = u
  while (v.length > 1 && v.charAt(v.length - 1) === "/") v = v.slice(0, -1)
  return v
}

// --- Gamla Wiki-adresser som inte langre finns: fraga backend (/url301/resolve) om
// narmaste nya sida. Svar cachas per adress i 10 min. Vid fel/timeout faller vi
// tillbaka till tidigare beteende (produktsidan, som visar 404 om den saknas). ---
type LegacyResolve = { kind: string; to?: string }
const __legacyCache = new Map<string, { at: number; r: LegacyResolve | null }>()
async function resolveLegacyPath(path: string): Promise<LegacyResolve | null> {
  const now = Date.now()
  const hit = __legacyCache.get(path)
  if (hit && now - hit.at < 600000) return hit.r
  if (!BACKEND_URL) return null
  let r: LegacyResolve | null = null
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 2500)
    const res = await fetch(BACKEND_URL + "/url301/resolve?p=" + encodeURIComponent(path), {
      headers: { accept: "application/json" },
      signal: ctrl.signal,
      cache: "no-store",
    })
    clearTimeout(timer)
    if (res.ok) {
      const d = await res.json()
      if (d && typeof d.kind === "string") r = { kind: d.kind, to: typeof d.to === "string" ? d.to : undefined }
    }
  } catch (e) {
    r = null
  }
  if (__legacyCache.size > 3000) __legacyCache.clear()
  // Lyckade svar sparas i 10 min, misslyckade i 1 min (sa att en seg backend inte bromsar varje sidvisning).
  __legacyCache.set(path, { at: r ? now : now - 540000, r })
  return r
}

// Avdelningar som alltid finns. Anvands bara om kategorilistan inte gick att hamta
// (t.ex. precis efter en omstart), sa att gamla lankar inte blir 404 av en slump.
const KNOWN_DEPTS = new Set([
  "mobilreservdelar", "mobiltillbehor", "batterier", "kablar-laddare", "powerbank",
  "horlurar-hogtalare", "dator-laptop", "datortillbehor", "gaming", "mobiler-surfplattor",
  "hem-fritid", "verktyg", "mobilreparation", "outlet-fyndvaror",
])

export async function middleware(request: NextRequest) {
  // Admin-managed 301 redirects run first so explicit rules win.
  try {
    let __p301 = request.nextUrl.pathname
    while (__p301.length > 1 && __p301.charAt(__p301.length - 1) === "/") __p301 = __p301.slice(0, -1)
    const __full301 = __p301 + (request.nextUrl.search || "")
    const __rules301 = await getUrl301Rules()
    for (const __r301 of __rules301) {
      if (__r301 && (__r301.from === __full301 || __r301.from === __p301)) {
        const __to301 = __u301Clean(__r301.to)
        if (__to301) {
          const __dest301 = __u301IsAbs(__to301) ? __to301 : new URL(__to301, request.url).toString()
          return NextResponse.redirect(__dest301, 301)
        }
      }
    }
  } catch (e301) {}
  {
    const lp = request.nextUrl.pathname
    const lsp = request.nextUrl.searchParams
    if (/^\/butikadmin\/googleshopping\.php$/i.test(lp) && BACKEND_URL) {
      const act = String(lsp.get("action") || "feed").toLowerCase()
      const feedPath = act.indexOf("inventory") >= 0 ? "/google-feed-inventory" : "/google-feed"
      return NextResponse.rewrite(new URL(BACKEND_URL.replace(/\/$/, "") + feedPath))
    }
    if (/^\/news(\/.*)?$/i.test(lp)) {
      return NextResponse.redirect(new URL("/blogg", request.url), 301)
    }
    const blogOld = lp.match(/^\/blogg\/\d{4}\/[a-z]{3}\/([^\/]+)\/?$/i)
    if (blogOld) {
      return NextResponse.redirect(new URL("/blogg/" + blogOld[1], request.url), 301)
    }
    if (/^\/search\/?$/i.test(lp)) {
      const q = String(lsp.get("q") || lsp.get("query") || "").trim()
      if (q) return NextResponse.redirect(new URL("/results/" + encodeURIComponent(q), request.url), 301)
    }
  }
  const searchParams = request.nextUrl.searchParams
  const cartId = searchParams.get("cart_id")
  const checkoutStep = searchParams.get("step")
  const cartIdCookie = request.cookies.get("_medusa_cart_id")
  const cacheIdCookie = request.cookies.get("_medusa_cache_id")

  // Every visitor gets an id that scopes their Next cache tags. Without it a
  // single shopper's revalidateTag("carts") would purge every shopper's
  // cached cart. See getCacheTag in lib/data/cookies.ts.
  const cacheId = cacheIdCookie?.value || crypto.randomUUID()

  // --- teknikhouse.se hierarchical URL resolution (SEO): resolve
  // /dept[/brand[/model]]/produkt-slug and /dept[/brand[/model]] against the
  // live category handles, so every old teknikhouse URL keeps working here. ---
  {
    const legacySegs = request.nextUrl.pathname.split("/").filter(Boolean)
    if (legacySegs.length >= 1) {
      const catHandles = await getCategoryHandleSet()
      const joined = legacySegs.join("-")
      // Preserve the query string (?page, ?sortBy, ...) through the rewrite —
      // otherwise category pages never receive their pagination / sort params.
      const legacySearch = request.nextUrl.search
      let target: string | null = null
      const isDept =
        catHandles.has(legacySegs[0]) ||
        (catHandles.size === 0 && KNOWN_DEPTS.has(legacySegs[0].toLowerCase()))
      if (catHandles.has(joined)) {
        target = `/se/categories/${joined}${legacySearch}`
      } else if (isDept) {
        // Inte en kategori: produkt, eller en gammal adress som ska 301:as.
        const resolved = await resolveLegacyPath(request.nextUrl.pathname)
        if (resolved && resolved.kind === "redirect" && resolved.to) {
          const dest = __u301Clean(resolved.to)
          let cur = request.nextUrl.pathname
          while (cur.length > 1 && cur.charAt(cur.length - 1) === "/") cur = cur.slice(0, -1)
          if (dest && dest.toLowerCase() !== cur.toLowerCase()) {
            const destUrl = __u301IsAbs(dest) ? dest : new URL(dest + legacySearch, request.url).toString()
            return NextResponse.redirect(destUrl, 301)
          }
        }
        if (resolved && resolved.kind === "category") {
          target = `/se/categories/${joined}${legacySearch}`
        } else {
          target = `/se/products/${legacySegs[legacySegs.length - 1]}${legacySearch}`
        }
      }
      if (target) {
        const legacyRes = NextResponse.rewrite(new URL(target, request.url))
        if (!cacheIdCookie) {
          legacyRes.cookies.set("_medusa_cache_id", cacheId, CACHE_ID_COOKIE_OPTIONS)
        }
        return legacyRes
      }
    }
  }

  const regionMap = await getRegionMap()

  const countryCode = regionMap && (await getCountryCode(request, regionMap))

  // Put the id on the request as well as the response, so the render that is
  // about to happen can already read it.
  //
  // Upstream's starter instead issues an extra 307 to the same URL on a
  // visitor's first request purely to plant this cookie. That costs a redirect
  // on every cold visit and loops forever for a client that refuses cookies.
  // Forwarding it on the request avoids both. If the forward ever stopped
  // working the only consequence would be that the first render goes uncached,
  // which is what happens today anyway.
  request.cookies.set("_medusa_cache_id", cacheId)

  // --- Clean URLs: no visible /se country-code prefix. Redirect any explicit
  // /<country>/... to the clean path, and otherwise serve the localized tree
  // internally via rewrite so the address bar stays clean. ---
  {
    const seg1 = request.nextUrl.pathname.split("/")[1]
    const search = request.nextUrl.search
    if (seg1 && regionMap.has(seg1)) {
      const stripped = request.nextUrl.pathname.slice(seg1.length + 1) || "/"
      return NextResponse.redirect(new URL(`${stripped}${search}`, request.url), 308)
    }
    const cc = countryCode || DEFAULT_REGION
    const p = request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname
    if (cartId) {
      const step = checkoutStep ? "" : `${search ? "&" : "?"}step=address`
      const res = NextResponse.rewrite(new URL(`/${cc}${p}${search}${step}`, request.url))
      if (!cacheIdCookie) res.cookies.set("_medusa_cache_id", cacheId, CACHE_ID_COOKIE_OPTIONS)
      res.cookies.set("_medusa_cart_id", cartId, { maxAge: 60 * 60 * 24 })
      return res
    }
    const res = NextResponse.rewrite(new URL(`/${cc}${p}${search}`, request.url))
    if (!cacheIdCookie) res.cookies.set("_medusa_cache_id", cacheId, CACHE_ID_COOKIE_OPTIONS)
    return res
  }

}

export const config = {
  // Prevents redirecting on static files.
  //
  // sitemap.xml, robots.txt and opengraph-image are excluded because they are
  // NOT region-prefixed: they are metadata routes at the app root, and without
  // this the middleware 307s a crawler from /sitemap.xml to /gb/sitemap.xml,
  // which does not exist. Generated by src/app/sitemap.ts, src/app/robots.ts
  // and src/app/opengraph-image.tsx.
  //
  // opengraph-image carries no file extension, so the image rules further down
  // this pattern do not cover it, and Next appends a cache-busting query string
  // to the URL it puts in the og:image tag. Matching the path prefix handles
  // both. Verified by fetching it: without this entry the route answers 307 to
  // /gb/opengraph-image and every shared link loses its preview card.
  matcher: [
    "/((?!api|_next/static|favicon.ico|sitemap.xml|robots.txt|opengraph-image|userfiles|.*\\.png|.*\\.jpg|.*\\.gif|.*\\.svg).*)",
  ],
}
