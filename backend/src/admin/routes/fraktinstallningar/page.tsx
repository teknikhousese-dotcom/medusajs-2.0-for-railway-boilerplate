import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

const TruckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
)

function FraktPage() {
  const [f, setF] = useState<any>({ levels: [{ weight: "", price: "" }], overweightPrice: "", freeShipping: "", freeShippingRetail: "", bulky: "", method: "weight" })
  const [msg, setMsg] = useState("")
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }))

  useEffect(() => {
    fetch("/admin/wiki-settings?group=shipping", { credentials: "include" }).then((r) => r.json()).then((j) => {
      const d = j.data || {}
      setF({
        levels: Array.isArray(d.levels) && d.levels.length ? d.levels : [{ weight: "", price: "" }],
        overweightPrice: d.overweightPrice || "", freeShipping: d.freeShipping || "",
        freeShippingRetail: d.freeShippingRetail || "", bulky: d.bulky || "", method: d.method || "weight",
      })
    }).catch(() => {})
  }, [])
  const save = async () => {
    setMsg("Sparar…")
    const r = await fetch("/admin/wiki-settings", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ group: "shipping", data: f }) })
    const j = await r.json(); setMsg(j.ok ? "✔ Fraktinställningar sparade." : "Fel: " + (j.error || ""))
  }
  const setLevel = (i: number, k: string, v: string) => setF((p: any) => ({ ...p, levels: p.levels.map((l: any, idx: number) => idx === i ? { ...l, [k]: v } : l) }))
  const addLevel = () => setF((p: any) => ({ ...p, levels: [...p.levels, { weight: "", price: "" }] }))
  const delLevel = (i: number) => setF((p: any) => ({ ...p, levels: p.levels.filter((_: any, idx: number) => idx !== i) }))

  const lbl: any = { fontSize: "12px", fontWeight: 700, display: "block", margin: "10px 0 3px" }
  const inp: any = { padding: "6px 8px", border: "1px solid #bbb", borderRadius: "3px", fontSize: "12px", fontFamily: WF, boxSizing: "border-box" }
  const sect: any = { fontSize: "13px", fontWeight: 700, margin: "20px 0 6px", borderBottom: "2px solid #ccc", paddingBottom: "4px" }
  const btn: any = { padding: "8px 20px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "13px", fontWeight: 700 }
  const card: any = { background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", margin: "0 0 12px" }
  const th: any = { textAlign: "left", padding: "6px 8px", borderBottom: "2px solid #ccc", fontSize: "11px", background: "#eee" }
  const td: any = { padding: "5px 8px", borderBottom: "1px solid #eee", fontSize: "12px" }

  return (
    <div style={{ display: "flex", fontFamily: WF }}>
      <Snabbmeny active="Fraktinställningar" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={card}>
          <div style={{ background: "#f4f4f4", borderBottom: "1px solid #ddd", padding: "10px 16px", fontWeight: 700, fontSize: "14px" }}>🚚 Fraktinställningar</div>
          <div style={{ padding: "16px", maxWidth: "760px" }}>
            {msg && <div style={{ padding: "8px 10px", marginBottom: "10px", borderRadius: "3px", background: msg.startsWith("Fel") ? "#fdecea" : "#e8f5e9", color: msg.startsWith("Fel") ? "#a00" : "#256029", fontSize: "12px" }}>{msg}</div>}

            <div style={sect}>Fraktkostnad per vikt</div>
            <div style={{ fontSize: "11px", color: "#888", marginBottom: "6px" }}>Kostnad per viktnivå. Frakten beräknas utifrån den totala vikten i kundvagnen.</div>
            <table style={{ borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Vikt (upp till, gram)</th><th style={th}>Pris (kr)</th><th style={th}></th></tr></thead>
              <tbody>
                {f.levels.map((l: any, i: number) => (
                  <tr key={i}>
                    <td style={td}><input style={{ ...inp, width: "150px" }} value={l.weight} onChange={(e) => setLevel(i, "weight", e.target.value)} /></td>
                    <td style={td}><input style={{ ...inp, width: "110px" }} value={l.price} onChange={(e) => setLevel(i, "price", e.target.value)} /></td>
                    <td style={td}>{f.levels.length > 1 && <a style={{ color: "#a00", cursor: "pointer" }} onClick={() => delLevel(i)}>Ta bort</a>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ margin: "8px 0" }}><button style={{ ...btn, background: "#4a90d9", padding: "5px 12px" }} onClick={addLevel}>+ Lägg till viktnivå</button></div>
            <label style={lbl}>Om vikten överstiger alla nivåer, använd följande fraktkostnad (kr)</label>
            <input style={{ ...inp, width: "150px" }} value={f.overweightPrice} onChange={(e) => set("overweightPrice", e.target.value)} />

            <div style={sect}>Övriga inställningar</div>
            <label style={lbl}>Fraktfritt över värde (kr) — 0 = av</label>
            <input style={{ ...inp, width: "150px" }} value={f.freeShipping} onChange={(e) => set("freeShipping", e.target.value)} />
            <label style={lbl}>Fraktfritt för avtalskunder över värde (kr)</label>
            <input style={{ ...inp, width: "150px" }} value={f.freeShippingRetail} onChange={(e) => set("freeShippingRetail", e.target.value)} />
            <label style={lbl}>Extra avgift per skrymmande produkt (kr)</label>
            <input style={{ ...inp, width: "150px" }} value={f.bulky} onChange={(e) => set("bulky", e.target.value)} />

            <div style={{ marginTop: "16px" }}><button style={btn} onClick={save}>Spara fraktinställningar</button></div>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: "12px" }}><a href={`${ADMIN}/kontrollpanel`} style={{ color: "#06c" }}>◄ Till kontrollpanelen</a></div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Fraktinställningar (Wiki)", icon: TruckIcon })
export default FraktPage
