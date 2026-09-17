import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

async function getStore(scope: any) {
  const svc = scope.resolve(Modules.STORE)
  const stores = await svc.listStores({}, { take: 1 })
  return stores && stores[0]
}

function isAbs(u: string): boolean {
  const l = (u || "").toLowerCase()
  return l.indexOf("http://") === 0 || l.indexOf("https://") === 0
}

function normFrom(s: any): string {
  let v = String(s || "").trim()
  if (!v) return ""
  const i = v.indexOf("://")
  if (i >= 0) {
    const rest = v.slice(i + 3)
    const slash = rest.indexOf("/")
    v = slash >= 0 ? rest.slice(slash) : "/"
  }
  if (v.charAt(0) !== "/") v = "/" + v
  const hash = v.indexOf("#")
  if (hash >= 0) v = v.slice(0, hash)
  if (v.length > 1 && v.charAt(v.length - 1) === "/" && v.indexOf("?") < 0) v = v.slice(0, -1)
  return v
}

function cleanRules(input: any): any[] {
  if (!Array.isArray(input)) return []
  const seen: any = {}
  const out: any[] = []
  for (const r of input) {
    if (!r) continue
    const from = normFrom(r.from)
    let to = String((r && r.to) || "").trim()
    if (!from || !to) continue
    if (!isAbs(to) && to.charAt(0) !== "/") to = "/" + to
    if (seen[from]) continue
    seen[from] = true
    out.push({ from, to })
  }
  return out
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const store = await getStore(req.scope)
  const meta: any = (store && store.metadata) || {}
  const rules = Array.isArray(meta.url301) ? meta.url301 : []
  res.json({ rules })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(Modules.STORE)
  const store = await getStore(req.scope)
  const body: any = req.body || {}
  const rules = cleanRules(body.rules)
  const meta = Object.assign({}, (store && store.metadata) || {}, { url301: rules })
  await svc.updateStores(store.id, { metadata: meta })
  res.json({ ok: true, count: rules.length, rules })
}
