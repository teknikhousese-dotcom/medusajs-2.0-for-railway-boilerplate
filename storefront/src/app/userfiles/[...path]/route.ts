import { NextRequest } from "next/server"

/**
 * Teknikhouse.se — legacy /userfiles bridge.
 * Streams files the old Wikinggruppen site served at /userfiles/... (return
 * slips, price lists, manuals, etc.) so every old link keeps working on the
 * new domain. Repoint OLD_HOST to permanent storage (R2/public) once the old
 * site is decommissioned. Excluded from middleware via the matcher.
 */
export const dynamic = "force-dynamic"

const OLD_HOST = "https://teknikhouse.se"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const rel = (path || []).map((seg) => encodeURIComponent(seg)).join("/")
  const upstream = OLD_HOST + "/userfiles/" + rel
  try {
    const r = await fetch(upstream, { cache: "no-store" })
    if (!r.ok) return new Response("Not found", { status: r.status })
    const buf = await r.arrayBuffer()
    const ct = r.headers.get("content-type") || "application/octet-stream"
    return new Response(buf, {
      status: 200,
      headers: {
        "content-type": ct,
        "cache-control": "public, max-age=3600",
      },
    })
  } catch {
    return new Response("Upstream error", { status: 502 })
  }
}
