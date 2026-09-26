import { NextResponse } from "next/server"

/**
 * Web app manifest. Served under /api because the middleware matcher rewrites
 * every other extension-less or .webmanifest path into the /se tree.
 */
export const dynamic = "force-static"

export function GET() {
  return NextResponse.json(
    {
      name: "Teknikhouse",
      short_name: "Teknikhouse",
      description:
        "Mobilreservdelar, skärmar, batterier och tillbehör. Fri frakt över 999 kr.",
      lang: "sv-SE",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#F50000",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      ],
    },
    {
      headers: {
        "content-type": "application/manifest+json; charset=utf-8",
        "cache-control": "public, max-age=86400",
      },
    }
  )
}
