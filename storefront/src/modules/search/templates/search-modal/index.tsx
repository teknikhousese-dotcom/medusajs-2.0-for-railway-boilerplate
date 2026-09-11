"use client"

import { useRouter } from "next/navigation"
import { MagnifyingGlassMini } from "@medusajs/icons"
import { useEffect, useRef, useState } from "react"

/**
 * Search overlay — a plain Swedish search form that submits to /results/<query>.
 *
 * Deliberately dependency-free: no MeiliSearch / InstantSearch. The results
 * page searches Medusa's own product index (see modules/search/actions.ts), so
 * search works without any extra service. Used both by the /search route and
 * (if present) the intercepting modal route.
 */
export default function SearchModal() {
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState("")

  const close = () => {
    if (window.history.length > 1) router.back()
    else router.push("/")
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    router.push(`/results/${encodeURIComponent(q)}`)
  }

  // focus the input on open
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // lock scroll + close on Escape
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") close()
    }
    window.addEventListener("keydown", handleEsc)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = "unset"
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative z-[75]">
      <div
        className="fixed inset-0 bg-opacity-75 backdrop-blur-md opacity-100 h-screen w-screen"
        onClick={close}
      />
      <div className="fixed inset-0 px-5 sm:p-0" ref={searchRef}>
        <div className="flex flex-col justify-start w-full h-fit transform p-5 items-center text-left align-middle transition-all max-h-[75vh] bg-transparent shadow-none">
          <div
            className="flex absolute flex-col h-fit w-full sm:w-[600px] max-w-full"
            data-testid="search-modal-container"
            role="dialog"
            aria-modal="true"
            aria-label="Sök produkter"
          >
            <form
              onSubmit={submit}
              className="w-full flex items-center gap-x-2 p-4 bg-[rgba(3,7,18,0.75)] text-ui-fg-on-color backdrop-blur-2xl rounded-rounded"
            >
              <MagnifyingGlassMini />
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Sök produkter…"
                className="flex-1 bg-transparent outline-none text-base text-ui-fg-on-color placeholder:text-ui-fg-on-color/60"
                aria-label="Sök"
              />
              <button
                type="submit"
                className="text-sm px-3 py-1 rounded-rounded bg-white/15 hover:bg-white/25 transition-colors"
              >
                Sök
              </button>
            </form>
            <p className="mt-3 text-center text-ui-fg-on-color/70 text-sm">
              Tryck Enter för att söka i hela sortimentet
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
