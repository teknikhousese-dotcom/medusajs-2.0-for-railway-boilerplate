import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

let ensured = false

export function getPg(scope: any): any {
  try { return scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) }
  catch { try { return scope.resolve("__pg_connection__") } catch { return null } }
}
export function genId(prefix: string) { return prefix + "_" + randomUUID().replace(/-/g, "") }
export async function q(pg: any, sql: string, bindings: any[] = []) {
  const r = await pg.raw(sql, bindings)
  return (r && r.rows) || []
}

const SYSTEM = [
  "Följesedel", "Glömt lösenord", "Kampanjutskick", "Lagerbevakning",
  "Leveransnotis", "Nytt inloggningskonto", "Returbekräftelse (kund)",
  "Returnotis (butik)", "Uppföljningsmail", "Uppföljningsmail - Belöning",
]

const sysId = (name: string) => "etpl_sys_" + name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()

// Delad, varumärkesanpassad HTML-ram (matchar e-postmallen base.tsx).
function wrap(inner: string): string {
  return `<div style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
  <div style="max-width:600px;margin:0 auto;background:#ffffff">
    <div style="background:#111114;padding:22px 28px">
      <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:.5px">teknik<span style="color:#F50000">house</span>.se</span>
    </div>
    <div style="padding:28px">
${inner}
    </div>
    <div style="background:#111114;padding:20px 28px;color:#c9c9cf;font-size:12px;line-height:1.7">
      <div style="color:#ffffff;font-weight:700;margin-bottom:4px">Nordic Teknik House AB</div>
      Sveavägen 139, 113 46 Stockholm · <a href="mailto:info@teknikhouse.se" style="color:#9db8ff;text-decoration:none">info@teknikhouse.se</a><br/>
      <span style="color:#8f8f98">Fri frakt över 999 kr · Öppet köp 30 dagar · Garanti ingår alltid</span>
    </div>
  </div>
</div>`
}
const h1 = (t: string) => `      <h1 style="font-size:20px;margin:0 0 14px;color:#111114">${t}</h1>`
const p = (t: string) => `      <p style="font-size:14px;line-height:1.7;margin:0 0 14px">${t}</p>`
const cta = (label: string, href = "{{lank}}") =>
  `      <p style="margin:22px 0"><a href="${href}" style="display:inline-block;background:#F50000;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 26px;border-radius:6px">${label}</a></p>`

// Standardinnehåll per systemmall. Fyller bara TOMMA mallar – skriver aldrig över
// innehåll som butiken själv redigerat.
const DEFAULTS: Record<string, { subject: string; body_html: string }> = {
  "Följesedel": {
    subject: "Följesedel för order {{ordernummer}} – Teknikhouse.se",
    body_html: wrap(
      h1("Följesedel") +
      p("Hej {{kundnamn}},") +
      p("Här är följesedeln för din order <strong>{{ordernummer}}</strong> hos Teknikhouse.se.") +
      p("<strong>Beställda varor:</strong><br/>{{orderrader}}") +
      p("<strong>Totalt:</strong> {{ordertotal}}") +
      p("<strong>Leveransadress:</strong><br/>{{leveransadress}}") +
      p("Tack för att du handlar hos oss!")
    ),
  },
  "Glömt lösenord": {
    subject: "Återställ ditt lösenord – Teknikhouse.se",
    body_html: wrap(
      h1("Återställ ditt lösenord") +
      p("Hej {{kundnamn}},") +
      p("Vi har tagit emot en begäran om att återställa lösenordet till ditt konto på Teknikhouse.se. Klicka på knappen nedan för att välja ett nytt lösenord.") +
      cta("Välj nytt lösenord", "{{aterstall_lank}}") +
      p("Om du inte har begärt en återställning kan du bortse från detta mejl – ditt lösenord förblir oförändrat.")
    ),
  },
  "Kampanjutskick": {
    subject: "{{amne}} – Teknikhouse.se",
    body_html: wrap(
      h1("{{rubrik}}") +
      p("Hej {{kundnamn}},") +
      p("{{innehall}}") +
      cta("Handla nu", "https://teknikhouse.se") +
      p("Vänliga hälsningar,<br/>Teknikhouse.se")
    ),
  },
  "Lagerbevakning": {
    subject: "{{produktnamn}} finns åter i lager – Teknikhouse.se",
    body_html: wrap(
      h1("Nu finns varan i lager igen!") +
      p("Hej,") +
      p("Produkten du bevakat finns nu åter i lager:") +
      p("<strong>{{produktnamn}}</strong>") +
      cta("Till produkten", "{{produktlank}}") +
      p("Passa på – lagersaldot kan snabbt ta slut igen.")
    ),
  },
  "Leveransnotis": {
    subject: "Din order {{ordernummer}} har skickats – Teknikhouse.se",
    body_html: wrap(
      h1("Din order är på väg! 📦") +
      p("Hej {{kundnamn}},") +
      p("Vi har skickat din order <strong>{{ordernummer}}</strong>. Du kan följa paketet med länken nedan.") +
      p("<strong>Kolli-ID:</strong> {{sparnummer}}") +
      cta("Spåra ditt paket", "{{sparlank}}") +
      p("<strong>Skickade varor:</strong><br/>{{orderrader}}") +
      p("Tack för att du handlar hos Teknikhouse.se!")
    ),
  },
  "Nytt inloggningskonto": {
    subject: "Välkommen till Teknikhouse.se!",
    body_html: wrap(
      h1("Välkommen till Teknikhouse.se!") +
      p("Hej {{kundnamn}},") +
      p("Tack för att du skapat ett konto hos oss. Med ditt konto kan du enkelt följa dina ordrar, se din orderhistorik och handla snabbare nästa gång.") +
      p("<strong>Din inloggning:</strong> {{epost}}") +
      cta("Logga in på mitt konto", "https://teknikhouse.se/account") +
      p("Har du frågor? Svara på detta mejl så hjälper vi dig.")
    ),
  },
  "Returbekräftelse (kund)": {
    subject: "Vi har tagit emot din returbegäran – order {{ordernummer}}",
    body_html: wrap(
      h1("Din returbegäran är mottagen") +
      p("Hej {{kundnamn}},") +
      p("Vi har tagit emot din returbegäran för order <strong>{{ordernummer}}</strong> och behandlar den så snart som möjligt.") +
      p("<strong>Varor som returneras:</strong><br/>{{orderrader}}") +
      p("Så snart returen registrerats hos oss återkommer vi med bekräftelse och eventuell återbetalning. Återbetalning sker till samma betalsätt som vid köpet.") +
      p("Tack för ditt tålamod!")
    ),
  },
  "Returnotis (butik)": {
    subject: "Ny retur registrerad – order {{ordernummer}}",
    body_html: wrap(
      h1("Ny retur att hantera") +
      p("En kund har begärt retur.") +
      p("<strong>Order:</strong> {{ordernummer}}<br/><strong>Kund:</strong> {{kundnamn}} ({{epost}})") +
      p("<strong>Varor:</strong><br/>{{orderrader}}") +
      p("<strong>Anledning:</strong> {{anledning}}") +
      p("Hantera returen i butiksadmin.")
    ),
  },
  "Uppföljningsmail": {
    subject: "Vad tyckte du om ditt köp? – Teknikhouse.se",
    body_html: wrap(
      h1("Hur blev det med din order?") +
      p("Hej {{kundnamn}},") +
      p("Vi hoppas att allt är till belåtenhet med din beställning från Teknikhouse.se. Vi blir jätteglada om du vill dela med dig av din upplevelse och lämna ett omdöme – det hjälper både oss och andra kunder.") +
      cta("Lämna ett omdöme", "{{omdome_lank}}") +
      p("Tack för att du valde Teknikhouse.se!")
    ),
  },
  "Uppföljningsmail - Belöning": {
    subject: "Lämna ett omdöme – få 10% rabatt hos Teknikhouse.se",
    body_html: wrap(
      h1("Lämna ett omdöme – få 10% rabatt 🎁") +
      p("Hej {{kundnamn}},") +
      p("Tack för ditt köp hos Teknikhouse.se! Som tack vill vi bjuda på <strong>10% rabatt</strong> på ditt nästa köp när du lämnar ett omdöme om din upplevelse.") +
      cta("Lämna omdöme &amp; hämta rabatt", "{{omdome_lank}}") +
      p("Använd rabattkoden <strong>{{rabattkod}}</strong> i kassan vid nästa beställning.") +
      p("Vi ser fram emot att höra vad du tycker!")
    ),
  },
}

export async function ensureTables(pg: any) {
  if (ensured || !pg || typeof pg.raw !== "function") return
  await pg.raw(`CREATE TABLE IF NOT EXISTS "email_template" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "subject" text DEFAULT '',
    "body_html" text DEFAULT '',
    "is_system" boolean DEFAULT false,
    "updated_at" timestamptz DEFAULT now()
  )`)
  for (const name of SYSTEM) {
    const id = sysId(name)
    const def = DEFAULTS[name] || { subject: "", body_html: "" }
    // Skapa mallen om den saknas, med standardinnehåll.
    await pg.raw(
      `INSERT INTO "email_template" ("id","name","subject","body_html","is_system") VALUES (?, ?, ?, ?, true) ON CONFLICT ("id") DO NOTHING`,
      [id, name, def.subject, def.body_html]
    )
    // Fyll standardinnehåll i mallar som fortfarande är tomma (skriver aldrig över redigerat innehåll).
    await pg.raw(
      `UPDATE "email_template" SET "subject"=?, "body_html"=?, "updated_at"=now()
       WHERE "id"=? AND (COALESCE("subject",'')='' AND COALESCE("body_html",'')='')`,
      [def.subject, def.body_html, id]
    )
  }
  ensured = true
}
