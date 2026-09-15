import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Switch, Badge } from "@medusajs/ui"
import { useEffect, useState } from "react"

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
    } catch (e: any) { setErr(String(e?.message || e)) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

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
    } catch (e) { load() }
    setSaving(null)
  }

  return (
    <Container className="p-0">
      <div className="px-6 py-4 border-b border-ui-border-base">
        <Heading level="h1">Toppmeny</Heading>
        <Text size="small" className="text-ui-fg-subtle mt-1">
          Välj vilka huvudkategorier som ska visas i toppmenyn (menyraden). De du stänger av
          visas fortfarande i sidomenyn. Ändringar syns på sajten inom ca 10 minuter.
        </Text>
      </div>
      {err ? <div className="px-6 py-3 text-ui-fg-error">{err}</div> : null}
      {loading ? (
        <div className="px-6 py-6 text-ui-fg-subtle">Laddar…</div>
      ) : (
        <div className="divide-y divide-ui-border-base">
          {cats.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <Text weight="plus">{c.name}</Text>
                {c.hide_top ? (
                  <Badge size="2xsmall" color="grey">Endast sidomeny</Badge>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Text size="small" className="text-ui-fg-subtle">Visa i toppmeny</Text>
                <Switch
                  checked={!c.hide_top}
                  onCheckedChange={(v) => toggle(c, !!v)}
                  disabled={saving === c.id}
                />
              </div>
            </div>
          ))}
          {cats.length === 0 ? (
            <div className="px-6 py-6 text-ui-fg-subtle">Inga huvudkategorier hittades.</div>
          ) : null}
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Toppmeny" })

export default ToppmenyPage
