"use client"

import Link from "next/link"
import React from "react"

/**
 * Site URLs are clean (no /se country-code prefix) — the middleware serves the
 * localized tree internally and redirects any explicit /se URL to the clean one.
 * So this simply renders a Next.js <Link> with the href as-is. Kept as a wrapper
 * component so the many existing call sites don't need to change.
 */
const LocalizedClientLink = ({
  children,
  href,
  ...props
}: {
  children?: React.ReactNode
  href: string
  className?: string
  onClick?: () => void
  passHref?: true
  [x: string]: any
}) => {
  const clean = href && href.startsWith("/") ? href : `/${href || ""}`
  return (
    <Link href={clean} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink
