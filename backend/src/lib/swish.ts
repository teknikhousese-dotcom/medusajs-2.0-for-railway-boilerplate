import https from "https"
import { randomBytes } from "crypto"

/**
 * Shared Swish Handel (Commerce API v2) client for Teknikhouse.se.
 * Used by the payment provider service AND the storefront-facing store routes,
 * so there is exactly one place that speaks mTLS to Swish. Test (MSS) vs
 * production is selected purely by env (SWISH_API_BASE + SWISH_CERT/KEY).
 */

let agent: https.Agent | null = null

export function swishNumber(): string {
  return process.env.SWISH_NUMBER || ""
}
function apiBase(): string {
  return (process.env.SWISH_API_BASE || "https://mss.cpc.getswish.net").replace(/\/+$/, "")
}
function qrBase(): string {
  return (process.env.SWISH_QR_BASE || "https://mpc.getswish.net").replace(/\/+$/, "")
}
export function callbackUrl(): string {
  const base = (process.env.SWISH_CALLBACK_BASE || process.env.BACKEND_URL || "").replace(/\/+$/, "")
  return base ? base + "/swish/callback" : "https://example.com/swish/callback"
}
function getAgent(): https.Agent {
  if (agent) return agent
  const cert = (process.env.SWISH_CERT || "").replace(/\\n/g, "\n")
  const key = (process.env.SWISH_KEY || "").replace(/\\n/g, "\n")
  const ca = (process.env.SWISH_CA || "").replace(/\\n/g, "\n")
  agent = new https.Agent({
    cert: cert || undefined,
    key: key || undefined,
    ca: ca || undefined,
    rejectUnauthorized: ca ? true : process.env.SWISH_REJECT_UNAUTHORIZED !== "false",
    keepAlive: true,
  })
  return agent
}

export function uuid(): string {
  return randomBytes(16).toString("hex").toUpperCase()
}
export function amountStr(amount: any): string {
  return (Math.round(Number(amount || 0) * 100) / 100).toFixed(2)
}
function cpcPath(v: string, resource: string, id: string): string {
  return apiBase() + "/swish-cpcapi/api/" + v + "/" + resource + "/" + id
}

type Resp = { status: number; headers: any; json: any; text: string; body?: Buffer }

function req(fullUrl: string, method: string, body?: any, useCert = true, raw = false): Promise<Resp> {
  return new Promise((resolve) => {
    let u: URL
    try { u = new URL(fullUrl) } catch (e: any) { return resolve({ status: 0, headers: {}, json: null, text: String(e?.message || e) }) }
    const payload = body !== undefined ? JSON.stringify(body) : undefined
    const opts: https.RequestOptions = {
      method,
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      headers: {
        "Content-Type": "application/json",
        Accept: raw ? "image/png, application/json" : "application/json",
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    }
    if (useCert) opts.agent = getAgent()
    const r = https.request(opts, (res) => {
      const chunks: Buffer[] = []
      res.on("data", (c) => chunks.push(Buffer.from(c)))
      res.on("end", () => {
        const buf = Buffer.concat(chunks)
        const text = buf.toString("utf8")
        let json: any = null
        try { json = text ? JSON.parse(text) : null } catch { json = null }
        resolve({ status: res.statusCode || 0, headers: res.headers || {}, json, text, body: buf })
      })
    })
    r.on("error", (e: any) => resolve({ status: 0, headers: {}, json: null, text: String(e?.message || e) }))
    if (payload) r.write(payload)
    r.end()
  })
}

export async function createPaymentRequest(o: { amount: any; currency?: string; reference?: string; message?: string }) {
  const id = uuid()
  const ref = String(o.reference || id).replace(/[^A-Za-z0-9]/g, "").slice(0, 35) || id
  const body = {
    payeePaymentReference: ref,
    callbackUrl: callbackUrl(),
    payeeAlias: swishNumber(),
    amount: amountStr(o.amount),
    currency: String(o.currency || "sek").toUpperCase(),
    message: String(o.message || "Teknikhouse").slice(0, 50),
  }
  const r = await req(cpcPath("v2", "paymentrequests", id), "PUT", body)
  if (r.status === 201) {
    const token = (r.headers["paymentrequesttoken"] as string) || ""
    const location = (r.headers["location"] as string) || cpcPath("v1", "paymentrequests", id)
    return { ok: true, id, token, location, reference: ref }
  }
  const msg = Array.isArray(r.json) && r.json[0] ? (r.json[0].errorCode + ": " + r.json[0].errorMessage) : (r.text || "").slice(0, 300)
  return { ok: false, id, error: msg, status: r.status }
}

export async function getStatus(locationOrId: string) {
  const url = /^https?:\/\//.test(locationOrId) ? locationOrId : cpcPath("v1", "paymentrequests", locationOrId)
  const r = await req(url, "GET")
  return { status: (r.json?.status || "").toUpperCase(), paymentReference: r.json?.paymentReference || null, raw: r.json, httpStatus: r.status }
}

export async function cancel(id: string) {
  const r = await req(cpcPath("v1", "paymentrequests", id), "PATCH", [{ op: "replace", path: "/status", value: "cancelled" }])
  return { ok: r.status >= 200 && r.status < 300 }
}

export async function refund(o: { originalPaymentReference: string; amount: any; currency?: string; message?: string }) {
  const id = uuid()
  const body = {
    originalPaymentReference: o.originalPaymentReference,
    callbackUrl: callbackUrl(),
    payerAlias: swishNumber(),
    amount: amountStr(o.amount),
    currency: String(o.currency || "sek").toUpperCase(),
    message: String(o.message || "Aterbetalning Teknikhouse").slice(0, 50),
  }
  const r = await req(cpcPath("v2", "refunds", id), "PUT", body)
  return { ok: r.status === 201, id }
}

export async function qrPng(token: string, size = 300): Promise<Buffer | null> {
  const url = qrBase() + "/qrg-swish/api/v1/commerce"
  const r = await req(url, "POST", { token, size, format: "png", border: 0, transparent: false }, false, true)
  if (r.status >= 200 && r.status < 300 && r.body && r.body.length > 0) return r.body
  return null
}
