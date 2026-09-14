"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { SortOptions } from "./sort-products"

type RefinementListProps = {
  sortBy: SortOptions
  search?: boolean
  "data-testid"?: string
}

const OPTIONS: { value: SortOptions; label: string }[] = [
  { value: "recommended", label: "Rekommenderad" },
  { value: "title", label: "Namn" },
  { value: "price_asc", label: "Pris: Lågt till högt" },
  { value: "price_desc", label: "Pris: Högt till lågt" },
  { value: "created_at", label: "Senast inlagd" },
]

const FONT = '"Poppins",ui-rounded,system-ui,sans-serif'

const RefinementList = ({ sortBy, "data-testid": dataTestId }: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const activeValue = (searchParams.get("sortBy") as SortOptions) || sortBy || "recommended"
  const current = OPTIONS.find((o) => o.value === activeValue) || OPTIONS[0]

  const setSort = useCallback(
    (value: SortOptions) => {
      const params = new URLSearchParams(searchParams)
      params.set("sortBy", value)
      router.push(pathname + "?" + params.toString())
      setOpen(false)
    },
    [router, pathname, searchParams]
  )

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      document.removeEventListener("keydown", onKey)
    }
  }, [])

  return (
    <div
      className="flex items-center justify-end"
      style={{ borderBottom: "1px solid #efeae5", paddingBottom: "14px", marginBottom: "22px" }}
      data-testid={dataTestId}
    >
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#fff",
            border: "1px solid " + (open ? "#d9d2ca" : "#efeae5"),
            borderRadius: "10px",
            padding: "9px 14px",
            fontFamily: FONT,
            fontSize: "14px",
            color: "#1b1714",
            cursor: "pointer",
            transition: "border-color .15s ease",
          }}
        >
          <span style={{ color: "#6f685f" }}>Sortera:</span>
          <span style={{ fontWeight: 600 }}>{current.label}</span>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            style={{ color: "#a49c92", transform: open ? "rotate(180deg)" : "none", transition: "transform .18s ease" }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {open && (
          <ul
            role="listbox"
            style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)", minWidth: "232px",
              background: "#fff", border: "1px solid #efeae5", borderRadius: "14px",
              boxShadow: "0 16px 40px rgba(27,23,20,.14)", padding: "6px", zIndex: 40,
              listStyle: "none", margin: 0,
            }}
          >
            {OPTIONS.map((o) => {
              const active = o.value === current.value
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => setSort(o.value)}
                    onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "#faf8f6" }}
                    onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: "12px", textAlign: "left", padding: "10px 12px", borderRadius: "9px", border: 0,
                      background: active ? "#fef2f2" : "transparent", fontFamily: FONT, fontSize: "14px",
                      fontWeight: active ? 600 : 500, color: active ? "#D10000" : "#4a4640", cursor: "pointer",
                    }}
                  >
                    <span>{o.label}</span>
                    {active && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default RefinementList
