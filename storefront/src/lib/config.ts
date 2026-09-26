import Medusa from "@medusajs/js-sdk"

// Defaults to standard port for Medusa server
let MEDUSA_BACKEND_URL = "http://localhost:9000"

if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
  MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
}

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})

/**
 * Retry idempotent reads on transient backend failures.
 *
 * While the backend redeploys, Railway answers 502 ("connection dial timeout")
 * for roughly 15 seconds, and a page render that hits that window would show
 * an error page. GET and HEAD requests are retried twice with a short backoff;
 * anything that writes (POST, DELETE) is passed through untouched so a cart or
 * an order can never be submitted twice. Every sdk.store.* helper goes through
 * sdk.client.fetch, so they all get this.
 */
const RETRY_STATUSES = new Set([502, 503, 504])
const RETRY_DELAYS_MS = [500, 1500]

const isIdempotent = (init?: { method?: string }) => {
  const method = (init?.method || "GET").toUpperCase()
  return method === "GET" || method === "HEAD"
}

const isTransient = (err: unknown) => {
  const status = (err as { status?: unknown } | null)?.status
  if (typeof status === "number") return RETRY_STATUSES.has(status)
  // Network-level failures (connection refused or reset) surface as TypeError.
  return err instanceof TypeError
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const baseFetch = sdk.client.fetch.bind(sdk.client)

sdk.client.fetch = (async (input: any, init?: any) => {
  if (!isIdempotent(init)) return baseFetch(input, init)
  for (let attempt = 0; ; attempt++) {
    try {
      return await baseFetch(input, init)
    } catch (err) {
      if (attempt >= RETRY_DELAYS_MS.length || !isTransient(err)) throw err
      await sleep(RETRY_DELAYS_MS[attempt])
    }
  }
}) as typeof sdk.client.fetch
