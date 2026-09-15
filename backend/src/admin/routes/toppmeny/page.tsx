import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import type { CSSProperties } from "react"

type Cat = { id: string; name: string; rank: number; hide_top: boolean }

const ToppmenyPage = () => {
  const [cats, setCats] = useState<Cat[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [err, setErr] = useState<string>("")

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch("/admin/top-menu", { credentials: "include" })
      const j = await r.json()
      setCats(Array.isArray(j?.categories) ? j.categories : [])
    } catch (e: any) {
      setErr(String(e?.message || e))
    }
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  const toggle = async (c: Cat, show: boolean) => {
    setSaving(c.id)
    setCats((prev) => prev.map((x) => (x.id === c.id ? { ...x, hide_top: !show } : x)))
    try {
      await fetch("/admin/top-menu", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, hide_top: !show }),
      })
    } catch (e) {
      load()
    }
    setSaving(null)
  }

  const card: CSSProperties = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
  }
  const row: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px",
    borderTop: "1px solid #f1f1f4",
  }

  return (
    <div style={{ padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 6px", color: "#14161C" }}>Toppmeny</h1>
        <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.5, margin: "0 0 18px" }}>
          Välj vilka huvudkategorier som ska visas i toppmenyn (menyraden). De du stänger av
          visas fortfarande i sidomenyn. Ändringar syns på sajten inom ca 10 minuter.
        </p>
        {err ? (
          <p style={{ color: "#b91c1c", fontSize: 14 }}>{err}</p>
        ) : null}
        <div style={card}>
          {loading ? (
            <div style={{ padding: 24, color: "#6b7280" }}>Laddar…</div>
          ) : cats.length === 0 ? (
            <div style={{ padding: 24, color: "#6b7280" }}>Inga huvudkategorier hittades.</div>
          ) : (
            cats.map((c, i) => (
              <label key={c.id} style={{ ...row, borderTop: i === 0 ? "none" : row.borderTop, cursor: "pointer" }}>
                <span style={{ fontWeight: 500, color: "#14161C" }}>
                  {c.name}
                  {c.hide_top ? (
                    <span style={{ marginLeft: 10, fontSize: 12, color: "#9ca3af", fontWeight: 400 }}>
                      (endast sidomeny)
                    </span>
                  ) : null}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>Visa i toppmeny</span>
                  <input
                    type="checkbox"
                    checked={!c.hide_top}
                    disabled={saving === c.id}
                    onChange={(e) => toggle(c, e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: "#F50000", cursor: "pointer" }}
                  />
                </span>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Toppmeny" })

export default ToppmenyPage
