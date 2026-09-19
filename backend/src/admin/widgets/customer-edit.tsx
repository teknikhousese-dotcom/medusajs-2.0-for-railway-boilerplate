import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"

/**
 * Teknikhouse.se — KUNDDATABAS · REDIGERA
 * 1:1 mirror of Wikinggruppen customers.php?action=customer-edit, rendered on
 * the native Medusa customer detail page. Split Fakturaadress / Leveransadress,
 * Övriga uppgifter, GDPR XML-export and the Wiki back-links. Saves to REAL
 * Medusa via the native admin API (customer + default billing/shipping
 * addresses); Wiki-only fields (orgnr, adressrad 3, kundtyp, födelsedatum, kön,
 * telefon vs mobil) are persisted in metadata so nothing is lost.
 */

const WF = "Verdana, Tahoma, Arial, sans-serif"
const CODES = "af ax al dz ad ao ai aq ag ar am aw au at az bs bh bd bb by be bz bj bm bt bo ba bw bv br bn bg bf bi kh cm ca cv ky cf td cl cn cx cc co km cg cd ck cr ci hr cu cy cz dk dj dm do ec eg sv gq er ee et fk fo fj fi fr gf pf ga gm ge de gh gi gr gl gd gp gu gt gn gw gy ht hn hk hu is in id ir iq ie il it jm jp jo kz ke ki kw kg la lv lb ls lr ly li lt lu mo mk mg mw my mv ml mt mh mq mr mu yt mx fm md mc mn me ms ma mz mm na nr np nl nc nz ni ne ng nu nf kp no om pk pw ps pa pg py pe ph pn pl pt pr qa re ro ru rw ws sm st sa sn rs sc sl sg sk si sb so za kr es lk sh kn lc pm vc sd sr sj sz se ch sy tw tj tz th tl tg tk to tt tn tr tm tc tv ug ua ae gb us uy uz vu va ve vn vg vi wf eh ye zm zw".split(" ")
const RDN: any = typeof Intl !== "undefined" && (Intl as any).DisplayNames ? new (Intl as any).DisplayNames(["sv"], { type: "region" }) : null
const COUNTRIES: [string, string][] = ([["", "Välj land…"]] as [string, string][]).concat(
  CODES.map((c) => [c, RDN ? RDN.of(c.toUpperCase()) || c.toUpperCase() : c.toUpperCase()] as [string, string])
    .sort((a, b) => a[1].localeCompare(b[1], "sv"))
)

async function jget(u: string) { return fetch(u, { credentials: "include" }).then((r) => r.json()) }
async function jsend(u: string, m: string, b?: any) {
  return fetch(u, { method: m, credentials: "include", headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined })
    .then(async (r) => ({ ok: r.ok, status: r.status, json: await r.json().catch(() => ({})) }))
}

type Addr = {
  id?: string; orgnr: string; company: string; first_name: string; last_name: string
  address_1: string; address_2: string; address_3: string; postal_code: string; city: string; province: string; country_code: string
}
const emptyAddr = (): Addr => ({ id: undefined, orgnr: "", company: "", first_name: "", last_name: "", address_1: "", address_2: "", address_3: "", postal_code: "", city: "", province: "", country_code: "" })

const lbl: any = { display: "block", fontSize: "11px", color: "#555", margin: "0 0 3px" }
const inp: any = { width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "13px", fontFamily: WF, background: "#fff" }
const card: any = { border: "1px solid #ddd", borderRadius: "6px", background: "#fafafa", padding: "14px 16px" }
const cardH: any = { fontWeight: 700, fontSize: "14px", margin: "0 0 10px", color: "#14161c" }
const row2: any = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }
const btn: any = { padding: "8px 18px", borderRadius: "6px", border: "1px solid #2e7d32", background: "#2e7d32", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: WF }
const link: any = { color: "#0060cc", textDecoration: "underline", fontSize: "12px", cursor: "pointer", background: "none", border: "none", padding: 0, fontFamily: WF }

function AddrCard({ title, a, set }: { title: string; a: Addr; set: (k: keyof Addr, v: string) => void }) {
  const F = (k: keyof Addr, label: string, span2 = false) => (
    <div style={span2 ? { gridColumn: "1 / span 2" } : undefined}>
      <label style={lbl}>{label}</label>
      <input style={inp} value={(a[k] as string) || ""} onChange={(e) => set(k, e.target.value)} />
    </div>
  )
  return (
    <div style={card}>
      <div style={cardH}>{title}</div>
      <div style={row2}>
        {F("orgnr", "Orgnr/Personnr", true)}
        {F("company", "Företagsnamn/Namn", true)}
        {F("first_name", "Förnamn")}
        {F("last_name", "Efternamn")}
        {F("address_1", "Gatuadress", true)}
        {F("address_2", "Gatuadress rad 2", true)}
        {F("address_3", "Gatuadress rad 3", true)}
        {F("postal_code", "Postnr")}
        {F("city", "Ort")}
        {F("province", "Region/delstat")}
        <div>
          <label style={lbl}>Land</label>
          <select style={inp} value={a.country_code || ""} onChange={(e) => set("country_code", e.target.value)}>
            {COUNTRIES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

const CustomerEditWidget = ({ data }: { data: any }) => {
  const id: string = data?.id
  const [bill, setBill] = useState<Addr>(emptyAddr())
  const [ship, setShip] = useState<Addr>(emptyAddr())
  const [meta, setMeta] = useState<any>({})
  const [kundtyp, setKundtyp] = useState("privat")
  const [email, setEmail] = useState("")
  const [telefon, setTelefon] = useState("")
  const [mobil, setMobil] = useState("")
  const [fodelse, setFodelse] = useState("")
  const [kon, setKon] = useState("")
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const [full, setFull] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const j = await jget("/admin/customers/" + id + "?fields=id,email,first_name,last_name,company_name,phone,metadata,*addresses")
        const c = j.customer || {}
        setFull(c)
        const m = c.metadata || {}
        setMeta(m)
        setEmail(c.email || "")
        setKundtyp(m.kundtyp || (c.company_name ? "foretag" : "privat"))
        setTelefon(m.telefon || "")
        setMobil(c.phone || "")
        setFodelse(m.fodelsedatum || "")
        setKon(m.kon || "")
        const addrs: any[] = Array.isArray(c.addresses) ? c.addresses : []
        const toAddr = (x: any): Addr => ({
          id: x.id, orgnr: (x.metadata && x.metadata.orgnr) || "", company: x.company || "", first_name: x.first_name || "", last_name: x.last_name || "",
          address_1: x.address_1 || "", address_2: x.address_2 || "", address_3: (x.metadata && x.metadata.address_3) || "",
          postal_code: x.postal_code || "", city: x.city || "", province: x.province || "", country_code: (x.country_code || "").toLowerCase(),
        })
        const b = addrs.find((x) => x.is_default_billing) || addrs[0]
        const s = addrs.find((x) => x.is_default_shipping) || addrs.find((x) => x.id !== (b && b.id)) || addrs[0]
        if (b) setBill(toAddr(b)); else setBill((p) => ({ ...p, first_name: c.first_name || "", last_name: c.last_name || "", company: c.company_name || "" }))
        if (s) setShip(toAddr(s))
      } catch (e) { /* leave blank */ }
      setLoaded(true)
    })()
  }, [id])

  const saveAddr = async (a: Addr, kind: "billing" | "shipping") => {
    const has = ["company", "first_name", "last_name", "address_1", "postal_code", "city"].some((k) => String(a(as any)[k] || "").trim() !== "")
    if (!has && !a.id) return
    const body: any = {
      company: a.company || undefined, first_name: a.first_name || undefined, last_name: a.last_name || undefined,
      address_1: a.address_1 || undefined, address_2: a.address_2 || undefined, city: a.city || undefined,
      postal_code: a.postal_code || undefined, province: a.province || undefined, country_code: a.country_code || undefined,
      metadata: { orgnr: a.orgnr || "", address_3: a.address_3 || "" },
    }
    body[kind === "billing" ? "is_default_billing" : "is_default_shipping"] = true
    if (a.id) return jsend("/admin/customers/" + id + "/addresses/" + a.id, "POST", body)
    return jsend("/admin/customers/" + id + "/addresses", "POST", body)
  }

  const save = async () => {
    if (!id) return
    setSaving(true); setStatus(null)
    try {
      const nextMeta = { ...(meta || {}), kundtyp, telefon, fodelsedatum: fodelse, kon }
      const cust: any = {
        first_name: bill.first_name || undefined, last_name: bill.last_name || undefined,
        company_name: kundtyp === "foretag" ? (bill.company || undefined) : "",
        phone: mobil || undefined, metadata: nextMeta,
      }
      const r1 = await jsend("/admin/customers/" + id, "POST", cust)
      const r2 = await saveAddr(bill, "billing")
      const r3 = await saveAddr(ship, "shipping")
      let emailNote = ""
      if (email && full && email !== full.email) {
        const re = await jsend("/admin/customers/" + id, "POST", { email })
        if (re && re.ok === false) emailNote = " E-postadressen kunde inte ändras (hanteras av inloggningen)."
      }
      const bad = [r1, r2, r3].find((r) => r && (r as any).ok === false)
      if (bad) setStatus({ ok: false, msg: "Något kunde inte sparas (" + (bad as any).status + "). Kontrollera fälten och försök igen." })
      else setStatus({ ok: true, msg: "Kundens uppgifter har sparats." + emailNote })
    } catch (e: any) {
      setStatus({ ok: false, msg: "Ett fel uppstod: " + (e?.message || "okänt fel") })
    }
    setSaving(false)
  }

  const exportXml = () => {
    const esc = (s: any) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    const addrXml = (a: Addr, tag: string) =>
      "  <" + tag + ">\n" +
      ["orgnr", "company", "first_name", "last_name", "address_1", "address_2", "address_3", "postal_code", "city", "province", "country_code"]
        .map((k) => "    <" + k + ">" + esc((a as any)[k]) + "</" + k + ">").join("\n") +
      "\n  </" + tag + ">"
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n<kund id="' + esc(id) + '">\n' +
      "  <epost>" + esc(email) + "</epost>\n  <kundtyp>" + esc(kundtyp) + "</kundtyp>\n" +
      "  <telefon>" + esc(telefon) + "</telefon>\n  <mobil>" + esc(mobil) + "</mobil>\n" +
      "  <fodelsedatum>" + esc(fodelse) + "</fodelsedatum>\n  <kon>" + esc(kon) + "</kon>\n" +
      addrXml(bill, "fakturaadress") + "\n" + addrXml(ship, "leveransadress") + "\n</kund>\n"
    const blob = new Blob([xml], { type: "application/xml" })
    const url = URL.createObjectURL(blob)
    const el = document.createElement("a"); el.href = url; el.download = "kund-" + id + ".xml"; el.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  if (!id) return null

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "18px 20px", marginBottom: "12px", fontFamily: WF, color: "#222" }}>
      <div style={{ fontWeight: 700, fontSize: "18px", color: "#14161c" }}>KUNDDATABAS · REDIGERA</div>
      <div style={{ fontSize: "12px", color: "#666", margin: "4px 0 16px" }}>
        Här redigerar du uppgifterna för kunden. Längre ner på sidan finns fler åtgärder.
      </div>

      {!loaded ? (
        <div style={{ color: "#666", fontSize: "13px" }}>Laddar kunduppgifter…</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <AddrCard title="Fakturaadress" a={bill} set={(k, v) => setBill((p) => ({ ...p, [k]: v }))} />
            <AddrCard title="Leveransadress" a={ship} set={(k, v) => setShip((p) => ({ ...p, [k]: v }))} />
          </div>

          <div style={{ ...card, marginTop: "16px" }}>
            <div style={cardH}>Övriga uppgifter</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 12px" }}>
              <div>
                <label style={lbl}>Kundtyp</label>
                <select style={inp} value={kundtyp} onChange={(e) => setKundtyp(e.target.value)}>
                  <option value="privat">Privatperson</option>
                  <option value="foretag">Företag</option>
                </select>
              </div>
              <div><label style={lbl}>E-postadress</label><input style={inp} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><label style={lbl}>Telefonnr</label><input style={inp} value={telefon} onChange={(e) => setTelefon(e.target.value)} /></div>
              <div><label style={lbl}>Mobiltelefonnr</label><input style={inp} value={mobil} onChange={(e) => setMobil(e.target.value)} /></div>
              <div><label style={lbl}>Födelsedatum</label><input style={inp} placeholder="ÅÅÅÅ-MM-DD" value={fodelse} onChange={(e) => setFodelse(e.target.value)} /></div>
              <div>
                <label style={lbl}>Kön</label>
                <select style={inp} value={kon} onChange={(e) => setKon(e.target.value)}>
                  <option value="">Okänt</option>
                  <option value="kvinna">Kvinna</option>
                  <option value="man">Man</option>
                </select>
              </div>
              <div style={{ gridColumn: "1 / span 3" }}>
                <label style={lbl}>Lösenord</label>
                <input style={{ ...inp, background: "#f3f4f6", color: "#9ca3af" }} disabled placeholder="Hanteras via kundens 'Glömt lösenord'-återställning" />
                <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "3px" }}>Av säkerhetsskäl sätts lösenord av kunden själv via återställningslänk.</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "16px", flexWrap: "wrap" }}>
            <button style={{ ...btn, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={save}>{saving ? "Sparar…" : "Spara ändringar"}</button>
            {status && <span style={{ fontSize: "13px", color: status.ok ? "#2e7d32" : "#c00", fontWeight: 600 }}>{status.msg}</span>}
          </div>

          <div style={{ borderTop: "1px solid #eee", marginTop: "16px", paddingTop: "12px", display: "flex", gap: "18px", flexWrap: "wrap" }}>
            <button style={link} onClick={exportXml}>Exportera kunddata (XML)</button>
            <span style={{ color: "#bbb" }}>·</span>
            <a style={link as any} href="/app/kunddatabas">◄ Tillbaka till kunddatabasen</a>
            <a style={link as any} href="/app/kontrollpanel">Till kontrollpanelen</a>
          </div>
          <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "6px" }}>XML-filen innehåller de uppgifter vi sparat om kunden (GDPR-utdrag).</div>
        </>
      )}
    </div>
  )
}

export const config = defineWidgetConfig({ zone: "customer.details.before" })
export default CustomerEditWidget
