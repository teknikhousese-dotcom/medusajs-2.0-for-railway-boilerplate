import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { getPg, q, ensureTables } from "../db"

const TERM = { 34: 1, 39: 1, 60: 1, 62: 1, 41: 1 } as any

function isImgUrl(u: string): boolean {
  const s = u.toLowerCase()
  if (s.indexOf("/userfiles/") >= 0) return true
  const ex = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]
  for (const e of ex) if (s.indexOf(e) >= 0) return true
  return false
}

function extractUrls(html: string): string[] {
  const out: string[] = []
  const markers = ["https://teknikhouse.se/", "http://teknikhouse.se/", "https://www.teknikhouse.se/", "http://www.teknikhouse.se/"]
  let i = 0
  while (i < html.length) {
    let found = -1
    for (const m of markers) { const idx = html.indexOf(m, i); if (idx >= 0 && (found < 0 || idx < found)) found = idx }
    if (found < 0) break
    let j = found
    while (j < html.length) { const c = html.charCodeAt(j); if (c <= 32 || TERM[c]) break; j++ }
    const url = html.slice(found, j)
    if (isImgUrl(url) && out.indexOf(url) < 0) out.push(url)
    i = j + 1
  }
  return out
}

function mimeOf(u: string): string {
  const s = u.toLowerCase()
  if (s.indexOf(".png") >= 0) return "image/png"
  if (s.indexOf(".gif") >= 0) return "image/gif"
  if (s.indexOf(".webp") >= 0) return "image/webp"
  if (s.indexOf(".svg") >= 0) return "image/svg+xml"
  return "image/jpeg"
}

function fnameOf(u: string, idx: number): string {
  let seg = u.split("/").pop() || ""
  seg = seg.split("?")[0].split("#")[0]
  seg = seg.replace(/[^A-Za-z0-9._-]/g, "-")
  if (!seg) seg = "img.jpg"
  return "blog-" + Date.now() + "-" + idx + "-" + seg
}

async function uploadOne(fileModule: any, filename: string, mimeType: string, buf: Buffer, mode: string) {
  const content = mode === "base64" ? buf.toString("base64") : buf.toString("binary")
  const res = await fileModule.createFiles([{ filename, mimeType, content }])
  return Array.isArray(res) ? res[0] : res
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const report: any = { postsScanned: 0, uniqueImages: 0, uploaded: 0, failed: 0, postsUpdated: 0, mode: "binary", verify: {}, errors: [] }
  try {
    const fileModule: any = req.scope.resolve(Modules.FILE)
    const pg = getPg(req.scope)
    await ensureTables(pg)
    const posts: any[] = await q(pg, 'SELECT "id","body_html" FROM "blog_post"')
    report.postsScanned = posts.length

    const all: string[] = []
    for (const p of posts) { const urls = extractUrls(String(p.body_html || "")); for (const u of urls) if (all.indexOf(u) < 0) all.push(u) }
    report.uniqueImages = all.length
    if (all.length === 0) { res.json(report); return }

    const map: any = {}
    let mode = "binary"
    let modeDecided = false

    for (let k = 0; k < all.length; k++) {
      const oldUrl = all[k]
      try {
        const r = await fetch(oldUrl)
        if (!r.ok) { report.failed++; report.errors.push("fetch " + r.status + " " + oldUrl.slice(-40)); continue }
        const ab = await r.arrayBuffer()
        const buf = Buffer.from(ab)
        const fn = fnameOf(oldUrl, k)
        const mime = mimeOf(oldUrl)
        if (!modeDecided) {
          const a = await uploadOne(fileModule, fn, mime, buf, "binary")
          let okLen = -1
          try { const cr = await fetch(a.url); okLen = (await cr.arrayBuffer()).byteLength } catch (e) {}
          if (okLen === buf.length) { mode = "binary"; map[oldUrl] = a.url; report.verify = { origLen: buf.length, binLen: okLen } }
          else {
            const b = await uploadOne(fileModule, "b64-" + fn, mime, buf, "base64")
            let okLen2 = -1
            try { const cr2 = await fetch(b.url); okLen2 = (await cr2.arrayBuffer()).byteLength } catch (e) {}
            mode = "base64"; map[oldUrl] = b.url; report.verify = { origLen: buf.length, binLen: okLen, b64Len: okLen2 }
          }
          modeDecided = true
          report.mode = mode
          report.uploaded++
        } else {
          const up = await uploadOne(fileModule, fn, mime, buf, mode)
          map[oldUrl] = up.url
          report.uploaded++
        }
      } catch (e: any) { report.failed++; report.errors.push(String(e && e.message).slice(0, 80)) }
    }

    for (const p of posts) {
      let html = String(p.body_html || "")
      let changed = false
      for (const oldUrl of Object.keys(map)) {
        if (html.indexOf(oldUrl) >= 0) { html = html.split(oldUrl).join(map[oldUrl]); changed = true }
      }
      if (changed) { await q(pg, 'UPDATE "blog_post" SET "body_html"=?, "updated_at"=now() WHERE "id"=?', [html, p.id]); report.postsUpdated++ }
    }

    res.json(report)
  } catch (e: any) {
    report.fatal = String(e && e.message)
    res.status(500).json(report)
  }
}
