/**
 * Städar HTML som följt med från gamla butiken (produkt- och kategoritexter)
 * innan den visas. Bara strängoperationer, så samma funktion fungerar både vid
 * serverrendering och i klienten.
 *
 * - tar bort JSON-LD (sidan skriver redan sin egen Product/BreadcrumbList) och
 *   övriga script- och style-taggar
 * - tar bort inline-stilar, färger, typsnitt och font-taggar så att texten får
 *   sajtens egen typografi
 * - bygger om layout-tabeller (role="presentation") till kort och lägger
 *   vanliga tabeller i en ram som går att scrolla i sidled på mobilen
 * - gör interna länkar till rena relativa adresser utan avslutande snedstreck
 * - byter gamla ikon-taggar mot en röd bock och tar bort &nbsp; i början av rader
 */

export type SanitizeLegacyOptions = {
  /** JSON-LD-typer som får vara kvar, till exempel ["FAQPage"]. Standard: inga. */
  keepLdTypes?: string[]
}

const SITE_PREFIX_RE = /^(?:https?:)?\/\/(?:www\.)?teknikhouse\.se(?=[\/?#]|$)/i

/** Gör https://teknikhouse.se/verktyg/ till /verktyg. Andra adresser lämnas orörda. */
export function cleanLegacyHref(href: string): string {
  const raw = (href || "").trim()
  if (!SITE_PREFIX_RE.test(raw)) return raw
  let path = raw.replace(SITE_PREFIX_RE, "")
  let tail = ""
  const cut = path.search(/[?#]/)
  if (cut >= 0) {
    tail = path.slice(cut)
    path = path.slice(0, cut)
  }
  while (path.length > 1 && path.charAt(path.length - 1) === "/") path = path.slice(0, -1)
  if (!path) path = "/"
  if (path.charAt(0) !== "/") path = "/" + path
  return path + tail
}

const DROP_ATTRS = new Set([
  "style", "color", "face", "size", "bgcolor", "background",
  "border", "cellpadding", "cellspacing", "lang", "dir",
])
const TABLE_TAGS = new Set(["table", "thead", "tbody", "tfoot", "tr", "td", "th", "col", "colgroup"])
const TABLE_DROP = new Set(["width", "height", "align", "valign"])
const ATTR_RE = /([^\s=\/"'<>]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'<>]+))?/g
const CHECK = '<span class="th-check" aria-hidden="true">&#10003;</span>'
const SPACE = "(?:\\s|&nbsp;|&#160;|\\u00a0)"

function cleanTag(name: string, attrs: string, selfClose: string): string {
  const tag = name.toLowerCase()
  const kept: string[] = []
  const re = new RegExp(ATTR_RE.source, "g")
  let m: RegExpExecArray | null
  while ((m = re.exec(attrs || "")) !== null) {
    const key = m[1].toLowerCase()
    if (key.indexOf("on") === 0) continue
    if (DROP_ATTRS.has(key)) continue
    if (TABLE_TAGS.has(tag) && TABLE_DROP.has(key)) continue
    const rawVal = m[2]
    if (rawVal === undefined) {
      kept.push(key)
      continue
    }
    const q = rawVal.charAt(0)
    let val = q === '"' || q === "'" ? rawVal.slice(1, -1) : rawVal
    if (key === "href" || key === "src") {
      if (/^\s*(?:javascript|vbscript|data):/i.test(val) && !(key === "src" && /^\s*data:image\//i.test(val))) continue
      if (key === "href") val = cleanLegacyHref(val)
    }
    kept.push(key + '="' + val.replace(/"/g, "&quot;") + '"')
  }
  return "<" + tag + (kept.length ? " " + kept.join(" ") : "") + (selfClose ? " /" : "") + ">"
}

function hasText(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;|&#160;| |\s/g, "").length > 0
}

export function sanitizeLegacyHtml(
  html: string | null | undefined,
  opts: SanitizeLegacyOptions = {}
): string {
  if (!html) return ""
  const keepTypes = (opts.keepLdTypes || []).map((t) => t.toLowerCase())
  const keptLd: string[] = []
  let s = String(html)

  s = s.replace(
    /<script\b[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script\s*>/gi,
    (tag: string, body: string) => {
      if (keepTypes.length) {
        try {
          const data = JSON.parse(body)
          const type = data && typeof data["@type"] === "string" ? String(data["@type"]).toLowerCase() : ""
          if (type && keepTypes.indexOf(type) >= 0) keptLd.push(tag)
        } catch {
          return ""
        }
      }
      return ""
    }
  )
  s = s.replace(/<script\b[\s\S]*?<\/script\s*>/gi, "")
  s = s.replace(/<style\b[\s\S]*?<\/style\s*>/gi, "")
  s = s.replace(/<!--[\s\S]*?-->/g, "")
  s = s.replace(/<\/?(?:font|o:p)\b[^>]*>/gi, "")
  s = s.replace(/<(\/?)h1\b/gi, "<$1h2")

  s = s.replace(/<i\b[^>]*icon-check[^>]*>\s*<\/i>/gi, CHECK)
  s = s.replace(/<i\b[^>]*wgr-icon[^>]*>\s*<\/i>/gi, "")

  s = s.replace(
    /<([a-zA-Z][a-zA-Z0-9-]*)(\s[^<>]*?)?(\/?)>/g,
    (_m: string, name: string, attrs: string, sc: string) => cleanTag(name, attrs, sc)
  )

  s = s.replace(
    /<table\b[^>]*role="presentation"[^>]*>([\s\S]*?)<\/table\s*>/gi,
    (_m: string, inner: string) => {
      const cells: string[] = []
      inner.replace(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]\s*>/gi, (_c: string, body: string) => {
        if (hasText(body)) cells.push('<div class="th-card">' + body.trim() + "</div>")
        return ""
      })
      return cells.length ? '<div class="th-cards">' + cells.join("") + "</div>" : ""
    }
  )
  s = s.replace(/<table\b/gi, '<div class="th-table"><table').replace(/<\/table\s*>/gi, "</table></div>")

  for (let i = 0; i < 3; i++) {
    s = s.replace(/<(span|strong|b|em|i|u)\b[^>]*>(?:\s|&nbsp;|&#160;)*<\/\1>/gi, "")
  }
  s = s.replace(
    new RegExp("(" + CHECK.replace(/[.*+?^$()|[\]\\\/]/g, "\\$&") + "(?:\\s*</(?:span|strong|b|em)>)*)" + SPACE + "+", "g"),
    "$1 "
  )
  s = s.replace(new RegExp("(<(?:p|li|td|th|h[2-6])\\b[^>]*>(?:\\s*<(?:strong|b|span|em)\\b[^>]*>)*)" + SPACE + "+", "gi"), "$1")
  s = s.replace(new RegExp("<p\\b[^>]*>(?:" + SPACE + "|<br\\s*/?>)*</p>", "gi"), "")

  return s.trim() + keptLd.join("")
}

/**
 * CSS för det som sanitizeLegacyHtml bygger (kort, tabellram, bock). Ange den
 * container som texten visas i, till exempel ".thc". tables=false hoppar över
 * tabellstilarna för sidor som redan har egna.
 */
export function legacyHtmlCss(scope: string, tables = true): string {
  const x = scope
  const rules = [
    x + "{min-width:0;overflow-wrap:break-word}",
    x + " img{max-width:100%;height:auto}",
    x + " iframe," + x + " video{max-width:100%}",
    x + " .th-check{color:#F50000;font-weight:700;margin-right:2px}",
    x + " .th-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin:14px 0 18px}",
    x + " .th-card{background:#faf8f6;border:1px solid #efeae5;border-radius:12px;padding:14px 16px;font-size:14px;line-height:1.55;min-width:0}",
    x + " .th-card>strong:first-child," + x + " .th-card>b:first-child{display:block;margin-bottom:4px;color:#1b1714;font-family:\"Poppins\",ui-rounded,system-ui,sans-serif;font-weight:600}",
    x + " .th-table{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin:14px 0}",
  ]
  if (tables) {
    rules.push(
      x + " .th-table table{border-collapse:collapse;width:100%;font-size:14px;line-height:1.5}",
      x + " .th-table th," + x + " .th-table td{border:1px solid #efeae5;padding:9px 12px;text-align:left;vertical-align:top}",
      x + " .th-table thead th{background:#faf8f6;color:#1b1714;font-weight:600}",
      x + " .th-table td:first-child{color:#1b1714;font-weight:600;min-width:120px}",
      "@media(max-width:640px){" + x + " .th-table table{font-size:13.5px}" + x + " .th-table th," + x + " .th-table td{padding:8px 10px}}"
    )
  }
  return rules.join("\n")
}
