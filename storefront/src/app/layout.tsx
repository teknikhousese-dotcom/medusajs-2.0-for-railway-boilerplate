import { Metadata, Viewport } from "next"
import "styles/globals.css"

import {
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  jsonLd,
  siteGraph,
} from "@lib/seo"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Teknikhouse – Mobilreservdelar, skärmar & tillbehör",
    template: "%s",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Nordic Teknik House AB", url: SITE_URL }],
  publisher: "Nordic Teknik House AB",
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/api/manifest",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "sv_SE",
  },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: "#F50000",
  colorScheme: "light",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="sv" data-mode="light">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(siteGraph()) }}
        />
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
