import { useEffect, useRef, useState } from "react"

/**
 * Teknikhouse.se — RichText: a self-contained visual (WYSIWYG) editor.
 * No external deps, no CDN. contentEditable + a Swedish toolbar, plus a
 * Visuellt/HTML toggle so power users can still edit raw HTML.
 * Used for editable-page content (Innehall) and product descriptions.
 */
const WF = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

type Props = { value: string; onChange: (html: string) => void; minHeight?: number }

export default function RichText({ value, onChange, minHeight = 300 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<"visual" | "html">("visual")
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (mode !== "visual") return
    const el = ref.current
    if (!el) return
    if (!focused && el.innerHTML !== (value || "")) el.innerHTML = value || ""
  }, [value, mode, focused])

  const push = () => { if (ref.current) onChange(ref.current.innerHTML) }
  const exec = (cmd: string, arg?: string) => { document.execCommand(cmd, false, arg); push() }
  const block = (tag: string) => exec("formatBlock", tag)
  const addLink = () => { const url = window.prompt("Lank-URL (https://...):", "https://"); if (url) exec("createLink", url) }

  const tbtn: any = { fontFamily: WF, fontSize: "12px", padding: "4px 9px", border: "1px solid #bbb", borderRadius: "3px", background: "#f7f7f7", cursor: "pointer", lineHeight: 1.1 }
  const Sep = () => <span style={{ width: "1px", height: "18px", background: "#ccc", margin: "0 3px" }} />
  const md = (fn: () => void) => (e: any) => { e.preventDefault(); fn() }

  return (
    <div style={{ border: "1px solid #bbb", borderRadius: "3px", overflow: "hidden" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center", padding: "6px", background: "#eee", borderBottom: "1px solid #ccc" }}>
        <button type="button" style={{ ...tbtn, fontWeight: 700 }} onMouseDown={md(() => exec("bold"))} title="Fet">F</button>
        <button type="button" style={{ ...tbtn, fontStyle: "italic" }} onMouseDown={md(() => exec("italic"))} title="Kursiv">K</button>
        <Sep />
        <button type="button" style={tbtn} onMouseDown={md(() => block("<h2>"))} title="Rubrik">Rubrik</button>
        <button type="button" style={tbtn} onMouseDown={md(() => block("<h3>"))} title="Underrubrik">Underrubrik</button>
        <button type="button" style={tbtn} onMouseDown={md(() => block("<p>"))} title="Brodtext">Brodtext</button>
        <Sep />
        <button type="button" style={tbtn} onMouseDown={md(() => exec("insertUnorderedList"))} title="Punktlista">&bull; Lista</button>
        <button type="button" style={tbtn} onMouseDown={md(() => exec("insertOrderedList"))} title="Numrerad lista">1. Lista</button>
        <Sep />
        <button type="button" style={tbtn} onMouseDown={md(addLink)} title="Lank">Lank</button>
        <button type="button" style={tbtn} onMouseDown={md(() => exec("unlink"))} title="Ta bort lank">Ta bort lank</button>
        <button type="button" style={tbtn} onMouseDown={md(() => exec("removeFormat"))} title="Rensa formatering">Rensa</button>
        <div style={{ marginLeft: "auto" }}>
          <button type="button" style={{ ...tbtn, background: mode === "html" ? "#ddd" : "#f7f7f7" }} onClick={() => setMode(mode === "visual" ? "html" : "visual")}>
            {mode === "visual" ? "HTML" : "Visuellt"}
          </button>
        </div>
      </div>
      {mode === "visual" ? (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={push}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); push() }}
          style={{ minHeight: minHeight + "px", padding: "12px 14px", fontFamily: WF, fontSize: "14px", lineHeight: 1.6, outline: "none", background: "#fff", color: "#222" }}
        />
      ) : (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          style={{ display: "block", width: "100%", minHeight: minHeight + "px", boxSizing: "border-box", padding: "12px 14px", border: "none", outline: "none", fontFamily: "Menlo, Consolas, monospace", fontSize: "12px", lineHeight: 1.5, background: "#fbfbfb", resize: "vertical" }}
        />
      )}
    </div>
  )
}
