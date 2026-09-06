import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { ADMIN, WF, Snabbmeny } from "../../lib/butikadmin"

const CardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)

function BetalPage() {
  const [f, setF] = useState<any>({})
  const [msg, setMsg] = useState("")
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }))

  useEffect(() => {
    fetch("/admin/wiki-settings?group=payment", { credentials: "include" }).then((r) => r.json()).then((j) => setF(j.data || {})).catch(() => {})
  }, [])
  const save = async () => {
    setMsg("Sparar…")
    const r = await fetch("/admin/wiki-settings", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ group: "payment", data: f }) })
    const j = await r.json(); setMsg(j.ok ? "✔ Betalningsalternativ sparade." : "Fel: " + (j.error || ""))
  }

  const lbl: any = { fontSize: "12px", fontWeight: 700, display: "block", margin: "8px 0 3px" }
  const inp: any = { padding: "6px 8px", border: "1px solid #bbb", borderRadius: "3px", fontSize: "12px", fontFamily: WF, boxSizing: "border-box" }
  const btn: any = { padding: "8px 20px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "13px", fontWeight: 700 }
  const card: any = { background: "#fff", border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden", margin: "0 0 12px" }
  const head: any = { background: "#f4f4f4", borderBottom: "1px solid #ddd", padding: "9px 14px", fontWeight: 700, fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }
  const txt = (name: string, w = "220px") => <input style={{ ...inp, width: w }} value={f[name] || ""} onChange={(e) => set(name, e.target.value)} />
  const active = (name: string) => (
    <label style={{ fontSize: "12px", fontWeight: 400 }}>
      <input type="radio" checked={f[name] === "1"} onChange={() => set(name, "1")} /> På
      <input type="radio" style={{ marginLeft: "8px" }} checked={f[name] !== "1"} onChange={() => set(name, "0")} /> Av
    </label>
  )
  const body: any = { padding: "12px 14px" }

  return (
    <div style={{ display: "flex", fontFamily: WF }}>
      <Snabbmeny active="Betalningsalternativ" />
      <div style={{ flex: 1, minWidth: 0, maxWidth: "780px" }}>
        <div style={card}>
          <div style={{ ...head }}>💳 Betalningsalternativ</div>
          <div style={{ ...body, fontSize: "12px", color: "#444" }}>
            Aktivera och konfigurera de betalsätt som ska erbjudas i kassan.
            {msg && <div style={{ padding: "8px 10px", marginTop: "10px", borderRadius: "3px", background: msg.startsWith("Fel") ? "#fdecea" : "#e8f5e9", color: msg.startsWith("Fel") ? "#a00" : "#256029" }}>{msg}</div>}
          </div>
        </div>

        <div style={card}>
          <div style={head}><span>Klarna Checkout</span>{active("klarnaCheckoutActive")}</div>
          <div style={body}>
            <label style={{ fontSize: "12px", fontWeight: 400, display: "block", marginBottom: "8px" }}><input type="checkbox" checked={f.klarnaCheckoutSwitchToOldActive === "1"} onChange={(e) => set("klarnaCheckoutSwitchToOldActive", e.target.checked ? "1" : "0")} /> Visa länk till gamla kassan</label>
            <label style={lbl}>Länktext till gamla kassan</label>{txt("klarnaCheckoutSwitchToOld_sv", "260px")}
            <div style={{ fontSize: "11px", color: "#888", marginBottom: "6px" }}>Anpassa färger (hex, t.ex. #4a90d9).</div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div><label style={lbl}>Knapp</label>{txt("kco_color_button", "110px")}</div>
              <div><label style={lbl}>Knapptext</label>{txt("kco_color_button_text", "110px")}</div>
              <div><label style={lbl}>Kryssruta</label>{txt("kco_color_checkbox", "110px")}</div>
              <div><label style={lbl}>Bock</label>{txt("kco_color_checkbox_checkmark", "110px")}</div>
              <div><label style={lbl}>Rubrik</label>{txt("kco_color_header", "110px")}</div>
              <div><label style={lbl}>Länk</label>{txt("kco_color_link", "110px")}</div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={head}><span>Faktura</span>{active("invoiceActive")}</div>
          <div style={body}><label style={lbl}>Fakturaavgift (kr)</label>{txt("invoiceFee_SEK", "120px")}</div>
        </div>

        <div style={card}>
          <div style={head}><span>Swish</span>{active("swishActive")}</div>
          <div style={body}>
            <label style={lbl}>Swish-nummer</label>{txt("swishNumber", "200px")}
            <label style={lbl}>Swish-avgift (kr)</label>{txt("swishFee_SEK", "120px")}
          </div>
        </div>

        <div style={card}>
          <div style={head}><span>Förskottsbetalning</span>{active("prePayActive")}</div>
          <div style={body}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div><label style={lbl}>Plusgiro</label>{txt("prePayPlusgiro", "160px")}</div>
              <div><label style={lbl}>Bankgiro</label>{txt("prePayBankgiro", "160px")}</div>
              <div><label style={lbl}>Bankkonto</label>{txt("prePayBankkonto", "160px")}</div>
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div><label style={lbl}>IBAN</label>{txt("prePayIBAN", "200px")}</div>
              <div><label style={lbl}>BIC</label>{txt("prePayBIC", "140px")}</div>
              <div><label style={lbl}>Avgift (kr)</label>{txt("prePayFee_SEK", "120px")}</div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={head}><span>Postförskott</span>{active("CODActive")}</div>
          <div style={body}><label style={lbl}>Expeditionsavgift (kr)</label>{txt("CODFee_SEK", "120px")}</div>
        </div>

        <div style={{ marginBottom: "14px" }}><button style={btn} onClick={save}>Spara betalningsalternativ</button></div>
        <div style={{ textAlign: "center", fontSize: "12px" }}><a href={`${ADMIN}/kontrollpanel`} style={{ color: "#06c" }}>◄ Till kontrollpanelen</a></div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Betalningsalternativ (Wiki)", icon: CardIcon })
export default BetalPage
