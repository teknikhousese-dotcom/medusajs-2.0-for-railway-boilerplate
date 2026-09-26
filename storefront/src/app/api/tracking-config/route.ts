import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Same-origin proxy for the public tracking settings (Grundinställningar),
// read by the cookie-consent component after the visitor accepts cookies.
export async function GET() {
  const base = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "").replace(/\/$/, "")
  const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
  try {
    const r = await fetch(base + "/store/tracking-config", {
      headers: { "x-publishable-api-key": key },
      next: { revalidate: 300 },
    })
    const data = r.ok ? await r.json() : {}
    return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=300" } })
  } catch (e) {
    return NextResponse.json({})
  }
}
