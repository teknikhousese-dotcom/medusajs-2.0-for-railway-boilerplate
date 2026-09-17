import { useEffect, useRef, useState } from "react"

type Props = { value: string; onChange: (html: string) => void; minHeight?: number; placeholder?: string }

const CSS = ".rtei{outline:none;line-height:1.55;} .rtei:empty:before{content:attr(data-ph);color:#aaa;} .rtei h1{font-size:1.7em;font-weight:700;margin:.4em 0;} .rtei h2{font-size:1.35em;font-weight:700;margin:.4em 0;} .rtei h3{font-size:1.15em;font-weight:700;margin:.4em 0;} .rtei p{margin:.5em 0;} .rtei ul,.rtei ol{margin:.5em 0 .5em 1.5em;} .rtei blockquote{margin:.6em 0;padding:.35em .9em;border-left:3px solid #d0d7de;color:#555;background:#f8f9fb;border-radius:0 4px 4px 0;} .rtei a{color:#2b6cb0;text-decoration:underline;} .rtei img{max-width:100%;height:auto;border-radius:4px;}"

const WRAP: any = { border: "1px solid #cdd3da", borderRadius: 6, overflow: "hidden", background: "#fff" }
const BARW: any = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, padding: "5px 6px", background: "#f7f8fa", borderBottom: "1px solid #e3e7ec" }
const DIV: any = { width: 1, alignSelf: "stretch", background: "#e3e7ec", margin: "2px 5px" }

const COLORS = ["#111111", "#c00000", "#2b6cb0", "#127b12", "#777777"]

function TB(props: any) {
  const [h, setH] = useState(false)
  const st: any = { minWidth: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid transparent", borderRadius: 5, background: props.active ? "#e1e9f6" : (h ? "#ebeef2" : "transparent"), color: props.active ? "#1f4e8c" : "#3a4650", cursor: "pointer", fontSize: 13, padding: "0 7px", lineHeight: 1, fontStyle: props.i ? "italic" : "normal", fontWeight: props.b ? 800 : 600, textDecoration: props.u ? "underline" : (props.s ? "line-through" : "none"), fontFamily: "inherit" }
  return <button type="button" title={props.title} onMouseDown={(e: any) => e.preventDefault()} onClick={props.onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={st}>{props.children}</button>
}

const IC: any = {
  ul: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" /><circle cx="4" cy="6" r="1.4" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="4" cy="18" r="1.4" fill="currentColor" stroke="none" /></svg>),
  ol: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="10" y1="6" x2="20" y2="6" /><line x1="10" y1="12" x2="20" y2="12" /><line x1="10" y1="18" x2="20" y2="18" /><text x="1" y="9" fontSize="8" fill="currentColor" stroke="none">1</text><text x="1" y="15" fontSize="8" fill="currentColor" stroke="none">2</text><text x="1" y="21" fontSize="8" fill="currentColor" stroke="none">3</text></svg>),
  al: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="14" y2="12" /><line x1="3" y1="18" x2="18" y2="18" /></svg>),
  ac: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="5" y1="18" x2="19" y2="18" /></svg>),
  ar: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="6" y1="18" x2="21" y2="18" /></svg>),
  link: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>),
  unlink: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M5.17 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l1.71-1.71" /><line x1="2" y1="2" x2="22" y2="22" /></svg>),
}

const RichText = ({ value, onChange, minHeight = 300, placeholder }: Props) => {
  const ed = useRef<HTMLDivElement | null>(null)
  const [raw, setRaw] = useState(false)
  useEffect(() => { if (!raw && ed.current && ed.current.innerHTML !== (value || "")) ed.current.innerHTML = value || "" }, [value, raw])
  const emit = () => { if (ed.current) onChange(ed.current.innerHTML) }
  const exec = (c: string, a?: string) => { document.execCommand(c, false, a); emit() }
  const block = (t: string) => exec("formatBlock", t)
  const link = () => { const u = window.prompt("Länk-adress:", "https://"); if (u) exec("createLink", u) }

  return (
    <div style={WRAP}>
      <style>{CSS}</style>
      <div style={BARW}>
        <TB title="Ångra" onClick={() => exec("undo")}>↶</TB>
        <TB title="Gör om" onClick={() => exec("redo")}>↷</TB>
        <span style={DIV} />
        <TB title="Normal text" onClick={() => block("P")}>T</TB>
        <TB title="Rubrik" onClick={() => block("H1")} b>H1</TB>
        <TB title="Underrubrik" onClick={() => block("H2")} b>H2</TB>
        <TB title="Mindre rubrik" onClick={() => block("H3")} b>H3</TB>
        <span style={DIV} />
        <TB title="Fet" onClick={() => exec("bold")} b>B</TB>
        <TB title="Kursiv" onClick={() => exec("italic")} i>I</TB>
        <TB title="Understruken" onClick={() => exec("underline")} u>U</TB>
        <TB title="Genomstruken" onClick={() => exec("strikeThrough")} s>S</TB>
        <span style={DIV} />
        {COLORS.map((c) => <button key={c} type="button" title="Textfärg" onMouseDown={(e: any) => e.preventDefault()} onClick={() => exec("foreColor", c)} style={{ width: 17, height: 17, borderRadius: "50%", border: "1px solid rgba(0,0,0,.2)", background: c, cursor: "pointer", margin: "0 1px", padding: 0 }} />)}
        <span style={DIV} />
        <TB title="Punktlista" onClick={() => exec("insertUnorderedList")}>{IC.ul}</TB>
        <TB title="Numrerad lista" onClick={() => exec("insertOrderedList")}>{IC.ol}</TB>
        <TB title="Citat" onClick={() => block("BLOCKQUOTE")}>❝</TB>
        <span style={DIV} />
        <TB title="Vänsterjustera" onClick={() => exec("justifyLeft")}>{IC.al}</TB>
        <TB title="Centrera" onClick={() => exec("justifyCenter")}>{IC.ac}</TB>
        <TB title="Högerjustera" onClick={() => exec("justifyRight")}>{IC.ar}</TB>
        <span style={DIV} />
        <TB title="Infoga länk" onClick={link}>{IC.link}</TB>
        <TB title="Ta bort länk" onClick={() => exec("unlink")}>{IC.unlink}</TB>
        <span style={DIV} />
        <TB title="Rensa formatering" onClick={() => { exec("removeFormat"); block("P") }}>Rensa</TB>
        <TB title="Visa HTML-kod" active={raw} onClick={() => setRaw(!raw)}>&lt;/&gt;</TB>
      </div>
      {raw ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} style={{ width: "100%", minHeight, border: "none", outline: "none", padding: "10px 12px", fontFamily: "monospace", fontSize: 12, color: "#222", boxSizing: "border-box", resize: "vertical", display: "block" }} />
      ) : (
        <div ref={ed} className="rtei" contentEditable suppressContentEditableWarning data-ph={placeholder || "Skriv här..."} onInput={emit} onBlur={emit} style={{ minHeight, padding: "12px 14px", fontSize: 13, color: "#222", overflowY: "auto" }} />
      )}
    </div>
  )
}

export default RichText
