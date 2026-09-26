"use client"

import { Button } from "@medusajs/ui"
import { useRouter } from "next/navigation"
import { startTransition, useEffect, useState } from "react"

import InteractiveLink from "@modules/common/components/interactive-link"

// Most errors here are the backend restarting during a deploy (about 15 s of
// 502s). Retry quietly a couple of times before leaving it to the visitor.
// The counter lives at module level because the boundary remounts this
// component on every failed retry; it starts over after a quiet minute.
const AUTO_RETRY_DELAYS_MS = [4000, 10000]
let autoRetries = 0
let lastAutoRetryAt = 0

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  const [retrying, setRetrying] = useState(false)

  const retry = () => {
    setRetrying(true)
    startTransition(() => {
      router.refresh()
      reset()
    })
  }

  useEffect(() => {
    console.error(error)
    if (Date.now() - lastAutoRetryAt > 60000) autoRetries = 0
    const delay = AUTO_RETRY_DELAYS_MS[autoRetries]
    if (delay === undefined) return
    const t = setTimeout(() => {
      autoRetries += 1
      lastAutoRetryAt = Date.now()
      retry()
    }, delay)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error])

  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)] px-4">
      <h1 className="text-2xl-semi text-ui-fg-base text-center">
        Vi uppdaterar butiken
      </h1>
      <p className="text-small-regular text-ui-fg-base text-center max-w-md">
        Vi uppdaterar butiken, prova igen om en liten stund. Sidan försöker
        ladda om sig själv. Hör av dig till oss om det fortsätter.
      </p>
      {error.digest && (
        <p className="text-small-regular text-ui-fg-muted">
          Referens: {error.digest}
        </p>
      )}
      <Button onClick={retry} variant="secondary" isLoading={retrying}>
        Försök igen
      </Button>
      <InteractiveLink href="/">Till startsidan</InteractiveLink>
    </div>
  )
}
