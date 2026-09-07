import ProductPreview from "@modules/products/components/product-preview"

// Teknikhouse 2027 homepage — self-contained section (scoped under .th).
// Rendered from app/[countryCode]/(main)/page.tsx in place of <Hero />.
// Server component, no client JS. Real copy from teknikhouse.se editable areas.
const CSS = `
.th{--red:#F50000;--red-d:#C90000;--red-t:#FFECEC;--ink:#14161C;--ink2:#2A2F3A;--muted:#6B7280;--dim:#9AA3B2;--bg:#F5F6F8;--card:#fff;--line:#E6E8EE;--dark:#0B0C10;--fit:#12B76A;--fit-t:#E7F8EF;--star:#FFB020;--shadow:0 10px 30px -12px rgba(20,22,28,.18)}
.th{color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,Helvetica,Arial,sans-serif;line-height:1.5}
.th *{box-sizing:border-box}
.th .wrap{max-width:1200px;margin:0 auto;padding:0 20px}
.th a{text-decoration:none;color:inherit}
.th h1,.th h2,.th h3{letter-spacing:-.02em;line-height:1.12;margin:0}
.th .qnav{background:#fff;border-bottom:1px solid var(--line)}
.th .qnav .wrap{display:flex;gap:20px;height:46px;align-items:center;font-size:13.5px;font-weight:700;overflow-x:auto}
.th .qnav a{color:var(--ink2);white-space:nowrap;display:flex;align-items:center;gap:6px}
.th .qnav a:hover{color:var(--red)} .th .qnav a.hot{color:var(--red)}
.th .hero{background:radial-gradient(900px 500px at 80% -10%,rgba(245,0,0,.28),transparent 55%),linear-gradient(180deg,#0B0C10,#14161D);color:#fff;overflow:hidden}
.th .hero .wrap{display:grid;grid-template-columns:1.15fr .85fr;gap:30px;align-items:center;padding:52px 20px 56px}
.th .ey{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:6px 13px;font-size:12px;font-weight:700;color:#fff}
.th .ey .d{width:7px;height:7px;border-radius:50%;background:var(--red);box-shadow:0 0 10px var(--red)}
.th .hero h1{font-size:clamp(29px,4.4vw,48px);font-weight:900;margin:18px 0 0}
.th .hero h1 .r{color:var(--red)}
.th .hero p.lead{color:#AEB6C4;font-size:clamp(15px,2vw,18px);margin:16px 0 0;max-width:520px}
.th .finder{margin-top:24px;background:#fff;border-radius:16px;padding:16px;box-shadow:0 24px 60px -20px rgba(245,0,0,.5);max-width:560px}
.th .finder .flab{font-size:12px;font-weight:800;color:var(--ink);text-transform:uppercase;display:flex;align-items:center;gap:8px}
.th .finder .flab .p{background:var(--red-t);color:var(--red);border-radius:6px;padding:2px 8px;font-size:11px}
.th .finder .row{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}
.th .finder .sel{flex:1;min-width:140px;background:var(--bg);border:1.5px solid var(--line);border-radius:11px;padding:13px 14px;font-size:14px;color:var(--ink);font-weight:600}
.th .finder .go{background:var(--red);color:#fff;border:0;border-radius:11px;padding:0 22px;font-weight:800;font-size:14.5px;white-space:nowrap;cursor:pointer}
.th .finder .hint{margin-top:11px;font-size:12.5px;color:var(--muted)} .th .finder .hint b{color:var(--fit)}
.th .trustrow{display:flex;gap:9px;flex-wrap:wrap;margin-top:20px}
.th .tchip{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:8px 13px;font-size:12.5px;color:#D6DBE4;font-weight:600}
.th .tchip b{color:#fff} .th .tchip .s{color:#00d68a}
.th .hv{position:relative;min-height:280px;display:flex;align-items:center;justify-content:center}
.th .device{width:210px;height:300px;border-radius:34px;background:linear-gradient(160deg,#1c2029,#0e1116);border:2px solid #2a2f3a;box-shadow:0 40px 80px -30px rgba(0,0,0,.8),inset 0 0 0 8px #0b0c10;position:relative}
.th .device:before{content:"";position:absolute;top:14px;left:50%;transform:translateX(-50%);width:56px;height:7px;border-radius:99px;background:#2a2f3a}
.th .device .scr{position:absolute;inset:16px;border-radius:24px;background:radial-gradient(circle at 50% 30%,rgba(245,0,0,.25),transparent 60%),#0e1014;display:flex;align-items:center;justify-content:center;color:#5a6270;font-size:12px}
.th .float{position:absolute;background:#fff;color:var(--ink);border-radius:12px;padding:10px 12px;font-size:12px;font-weight:700;box-shadow:0 16px 34px -14px rgba(0,0,0,.5)}
.th .float.a{top:8%;left:-6%} .th .float.b{bottom:14%;right:-8%} .th .float .fit{color:var(--fit);font-weight:800}
.th .usp{background:#fff;border-bottom:1px solid var(--line)}
.th .usp .wrap{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:14px 20px}
.th .usp .u{display:flex;gap:10px;align-items:center;font-size:13px}
.th .usp .u .g{font-size:20px}.th .usp .u b{display:block;font-weight:800;font-size:13.5px}.th .usp .u span{color:var(--muted);font-size:12px}
.th section.blk{padding:44px 0}
.th .shead{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:20px;gap:10px}
.th .shead h2{font-size:clamp(21px,3vw,28px);font-weight:900}
.th .shead a{color:var(--red);font-weight:800;font-size:14px;white-space:nowrap}
.th .cats{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}
.th .cat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px 14px;text-align:center;transition:.16s}
.th .cat:hover{border-color:var(--red);transform:translateY(-3px);box-shadow:var(--shadow)}
.th .cat .g{font-size:30px}.th .cat .t{font-weight:800;font-size:13.5px;margin-top:9px}.th .cat .s{color:var(--muted);font-size:11.5px;margin-top:2px}
.th .prods{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.th .p{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;transition:.16s;display:flex;flex-direction:column}
.th .p:hover{box-shadow:var(--shadow);transform:translateY(-3px)}
.th .p .imgw{aspect-ratio:1;background:linear-gradient(160deg,#f2f4f7,#e9edf2);display:flex;align-items:center;justify-content:center;font-size:52px;position:relative}
.th .p .fitb{position:absolute;top:10px;left:10px;background:var(--fit-t);color:var(--fit);font-size:11px;font-weight:800;border-radius:999px;padding:4px 9px}
.th .p .disc{position:absolute;top:10px;right:10px;background:var(--red);color:#fff;font-size:11px;font-weight:800;border-radius:8px;padding:3px 8px}
.th .p .b{padding:14px;display:flex;flex-direction:column;gap:6px;flex:1}
.th .p .brand{font-size:11px;color:var(--dim);font-weight:700;text-transform:uppercase}
.th .p .name{font-size:13.5px;font-weight:700;line-height:1.35;min-height:36px}
.th .p .stars{font-size:12px;color:var(--star)}.th .p .stars .c{color:var(--dim)}
.th .p .foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;padding-top:6px}
.th .p .price{font-weight:900;font-size:18px}.th .p .price .old{font-size:12px;color:var(--dim);text-decoration:line-through;font-weight:600;margin-left:6px}
.th .p .add{background:var(--ink);color:#fff;border:0;border-radius:10px;width:38px;height:38px;font-size:18px}.th .p .add:hover{background:var(--red)}
.th .p .stock{font-size:11.5px;color:var(--fit);font-weight:700}
.th .repair{background:linear-gradient(120deg,#0B0C10,#191b22);color:#fff;border-radius:22px;overflow:hidden;display:grid;grid-template-columns:1.1fr .9fr}
.th .repair .l{padding:38px}
.th .repair .rey{color:var(--red);font-weight:800;font-size:12px;letter-spacing:.14em;text-transform:uppercase}
.th .repair h3{font-size:clamp(22px,3.4vw,32px);font-weight:900;margin:12px 0 10px}
.th .repair p{color:#AEB6C4;max-width:430px;font-size:15px}
.th .steps{display:flex;gap:8px;margin-top:20px;flex-wrap:wrap}
.th .steps .st{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:11px;padding:11px 14px;font-size:13px;font-weight:700}
.th .steps .st span{display:block;color:var(--red);font-size:11px}
.th .repair .cta{margin-top:22px;display:inline-flex;background:var(--red);color:#fff;font-weight:800;border-radius:12px;padding:13px 22px;font-size:14px}
.th .repair .r{background:radial-gradient(circle at 60% 40%,rgba(245,0,0,.22),transparent 60%),#101218;display:flex;align-items:center;justify-content:center;min-height:220px}
.th .playbtn{width:66px;height:66px;border-radius:50%;background:var(--red);display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;box-shadow:0 0 0 10px rgba(245,0,0,.18)}
.th .split{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.th .promo{border-radius:18px;padding:30px;min-height:200px;display:flex;flex-direction:column;justify-content:center}
.th .promo.brand{background:linear-gradient(120deg,#1a1c22,#26120f);color:#fff;border:1px solid #34240f}
.th .promo.member{background:var(--red);color:#fff}
.th .promo .k{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.85}
.th .promo h4{font-size:24px;font-weight:900;margin:10px 0 8px}
.th .promo p{font-size:14px;opacity:.9;max-width:340px}
.th .promo .pill{margin-top:16px;display:inline-flex;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);border-radius:11px;padding:11px 18px;font-weight:800;font-size:13.5px;width:fit-content}
.th .promo.brand .pill{background:var(--red);border-color:var(--red)}
.th .intro{background:#fff;border:1px solid var(--line);border-radius:18px;padding:32px}
.th .intro h3{font-size:22px;font-weight:900;margin-bottom:6px}
.th .intro p{color:var(--ink2);font-size:14.5px;max-width:820px;margin-top:10px}
.th .trustband{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:24px}
.th .tb{background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:16px}
.th .tb .g{font-size:22px}.th .tb b{display:block;font-size:14px;margin-top:6px}.th .tb span{font-size:12px;color:var(--muted)}
@media(max-width:900px){.th .hero .wrap{grid-template-columns:1fr;padding:38px 20px 40px}.th .hv{display:none}.th .repair{grid-template-columns:1fr}.th .cats{grid-template-columns:repeat(3,1fr)}.th .prods{grid-template-columns:repeat(2,1fr)}}
@media(max-width:760px){.th .usp .wrap{grid-template-columns:repeat(2,1fr)}.th .split{grid-template-columns:1fr}.th .trustband{grid-template-columns:repeat(2,1fr)}}
@media(max-width:560px){.th .cats{grid-template-columns:repeat(2,1fr)}}
`

export default function ThHome({ region, products = [] }: { region?: any; products?: any[] }) {
  return (
    <div className="th">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="qnav"><div className="wrap">
        <a className="hot"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><path d="M15 6.5a3.5 3.5 0 0 0-4.6 4.6L4 17.5 6.5 20l6.4-6.4A3.5 3.5 0 0 0 17.5 9l-2.3 2.3-2-2z"/></svg> Mobilreservdelar</a>
        <a><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><path d="M12 3l7 3v5c0 4.2-2.9 7.3-7 8.9C7.9 18.3 5 15.2 5 11V6z"/><path d="M9 11.5l2 2 4-4"/></svg> Mobiltillbehör</a>
        <a><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><rect x="3" y="8" width="16" height="8" rx="2"/><line x1="21" y1="10.5" x2="21" y2="13.5"/><line x1="7" y1="12" x2="11" y2="12"/></svg> Batterier</a>
        <a><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><path d="M9 2v5M15 2v5"/><path d="M6.5 7h11v3.5a5.5 5.5 0 0 1-11 0z"/><line x1="12" y1="16" x2="12" y2="22"/></svg> Kablar &amp; Laddare</a>
        <a><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><path d="M5 15v-3a7 7 0 0 1 14 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></svg> Hörlurar &amp; Högtalare</a>
        <a><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><rect x="7" y="2.5" width="10" height="19" rx="2.2"/><line x1="10.5" y1="18.5" x2="13.5" y2="18.5"/></svg> Mobiler &amp; Surfplattor</a>
        <a><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><path d="M15 6.5a3.5 3.5 0 0 0-4.6 4.6L4 17.5 6.5 20l6.4-6.4A3.5 3.5 0 0 0 17.5 9l-2.3 2.3-2-2z"/></svg> Mobilreparation</a>
        <a><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><path d="M12 6.5C10.8 5.6 9 5 7 5H3v12h4c2 0 3.8.6 5 1.5M12 6.5C13.2 5.6 15 5 17 5h4v12h-4c-2 0-3.8.6-5 1.5M12 6.5v12"/></svg> Laga själv-guider</a>
        <a><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><path d="M4 9l1-4h14l1 4M5 9v10h14V9M4 9h16"/></svg> Phone Rep (Butik)</a>
      </div></div>

      <div className="hero"><div className="wrap">
        <div>
          <div className="ey"><span className="d" /> SVERIGES BREDASTE SORTIMENT — RESERVDELAR &amp; TILLBEHÖR</div>
          <h1>Rätt del till din modell.<br /><span className="r">Första gången, garanterat.</span></h1>
          <p className="lead">Skärmar, batterier, baksidor och tillbehör till iPhone, Samsung, iPad och fler. Välj din enhet — vi visar bara det som passar. Livstidsgaranti på skärmar, eget lager, snabb leverans.</p>
          <div className="finder">
            <div className="flab"><span className="p">Hitta rätt del</span> Välj din modell</div>
            <div className="row">
              <div className="sel">Märke: Apple</div>
              <div className="sel">Modell: iPhone 13 Pro</div>
              <button className="go">Visa delar →</button>
            </div>
            <div className="hint">✓ Varje del är märkt <b>&quot;Passar din enhet&quot;</b> — verifierad kompatibilitet, inte gissning.</div>
          </div>
          <div className="trustrow">
            <span className="tchip"><span className="s">★</span> <b>4,9</b> Trustpilot</span>
            <span className="tchip"><b>Garanti ingår alltid</b></span>
            <span className="tchip">Eget lager · <b>snabb</b> leverans</span>
            <span className="tchip">Fri frakt över <b>999 kr</b></span>
          </div>
        </div>
        <div className="hv">
          <div className="device"><div className="scr">iPhone 13 Pro</div></div>
          <div className="float a"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><path d="M15 6.5a3.5 3.5 0 0 0-4.6 4.6L4 17.5 6.5 20l6.4-6.4A3.5 3.5 0 0 0 17.5 9l-2.3 2.3-2-2z"/></svg> Skärm iPhone 13 Pro<br /><span className="fit">✓ Livstidsgaranti</span></div>
          <div className="float b"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><rect x="3" y="8" width="16" height="8" rx="2"/><line x1="21" y1="10.5" x2="21" y2="13.5"/><line x1="7" y1="12" x2="11" y2="12"/></svg> Batteri · 649 kr<br /><span className="fit">✓ Passar din enhet</span></div>
        </div>
      </div></div>

      <div className="usp"><div className="wrap">
        <div className="u"><span className="g"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg></span><div><b>Snabba leveranser</b><span>1–3 vardagar · Postnord &amp; DHL</span></div></div>
        <div className="u"><span className="g"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><path d="M3 12l8-8 9 9-8 8z"/><circle cx="8.5" cy="8.5" r="1.2"/></svg></span><div><b>Låga priser</b><span>Konkurrenskraftiga priser</span></div></div>
        <div className="u"><span className="g">↩️</span><div><b>Öppet köp i 30 dagar</b><span>Enkelt att returnera &amp; byta</span></div></div>
        <div className="u"><span className="g">✅</span><div><b>Garanti ingår alltid</b><span>Testat av experter</span></div></div>
      </div></div>

      <section className="blk"><div className="wrap">
        <div className="shead"><h2>Vad letar du efter?</h2><a>Alla kategorier →</a></div>
        <div className="cats">
          <div className="cat"><div className="g"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><rect x="7" y="2.5" width="10" height="19" rx="2.2"/><line x1="10.5" y1="18.5" x2="13.5" y2="18.5"/></svg></div><div className="t">Mobilreservdelar</div><div className="s">Skärm · batteri · baksida</div></div>
          <div className="cat"><div className="g"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><path d="M12 3l7 3v5c0 4.2-2.9 7.3-7 8.9C7.9 18.3 5 15.2 5 11V6z"/><path d="M9 11.5l2 2 4-4"/></svg></div><div className="t">Mobiltillbehör</div><div className="s">Skal · skärmskydd</div></div>
          <div className="cat"><div className="g"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><path d="M9 2v5M15 2v5"/><path d="M6.5 7h11v3.5a5.5 5.5 0 0 1-11 0z"/><line x1="12" y1="16" x2="12" y2="22"/></svg></div><div className="t">Kablar &amp; Laddare</div><div className="s">USB-C · MagSafe</div></div>
          <div className="cat"><div className="g"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><rect x="3" y="8" width="16" height="8" rx="2"/><line x1="21" y1="10.5" x2="21" y2="13.5"/><line x1="7" y1="12" x2="11" y2="12"/></svg></div><div className="t">Batterier &amp; Powerbank</div><div className="s">Ladda överallt</div></div>
          <div className="cat"><div className="g"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><path d="M5 15v-3a7 7 0 0 1 14 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></svg></div><div className="t">Hörlurar &amp; Högtalare</div><div className="s">Ljud &amp; bild</div></div>
          <div className="cat"><div className="g"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4h-4"/></svg></div><div className="t">Begagnade mobiler</div><div className="s">Testade · garanti</div></div>
        </div>
      </div></section>

      <section className="blk" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="shead"><h2>Populärt just nu <span style={{ color: "var(--fit)", fontSize: "15px" }}>✓</span></h2><a>Visa alla →</a></div>
        <div className="prods">
          {region && products && products.length
            ? products.slice(0, 4).map((p: any) => (
                <ProductPreview key={p.id} product={p} region={region} isFeatured />
              ))
            : null}
        </div>
      </div>
      </section>

      <section className="blk" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="repair">
          <div className="l">
            <div className="rey">Laga själv — eller lämna till oss</div>
            <h3>Byt skärmen på 12 minuter. Eller boka Phone Rep.</h3>
            <p>Steg-för-steg-guider och video för just din modell, med exakt rätt del och verktyg länkade. Vill du hellre slippa? Vår butik <b>Phone Rep</b> (Sveavägen 139, Stockholm) lagar mobil &amp; dator åt dig — samma delar vi säljer.</p>
            <div className="steps">
              <div className="st"><span>Steg 1</span>Välj modell</div>
              <div className="st"><span>Steg 2</span>Följ guiden</div>
              <div className="st"><span>Steg 3</span>Klart &amp; klart</div>
            </div>
            <a className="cta">Se guider för din modell →</a>
          </div>
          <div className="r"><div className="playbtn">▶</div></div>
        </div>
      </div></section>

      <section className="blk" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="split">
          <div className="promo brand">
            <div className="k">Teknikhouse Eget märke</div>
            <h4>Proffskvalitet, utan proffspriset</h4>
            <p>Våra egna laddare, kablar och skydd — testade av experter, garanti ingår alltid.</p>
            <span className="pill">Utforska Teknikhouse-serien →</span>
          </div>
          <div className="promo member">
            <div className="k">Sälj din enhet till oss</div>
            <h4>Vi köper iPhone, Samsung &amp; MacBook</h4>
            <p>Få ett prisförslag på din gamla enhet på under en minut — och handla nytt billigare.</p>
            <span className="pill">Få prisförslag →</span>
          </div>
        </div>
      </div></section>

      <section className="blk" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="intro">
          <h3>Mobilreservdelar &amp; mobiltillbehör – Sveriges bredaste sortiment</h3>
          <p>Hos Teknikhouse hittar du marknadens bredaste sortiment av mobilreservdelar och mobiltillbehör till iPhone, Samsung, iPad och fler. Vi lagerför iPhone-reservdelar och Samsung-reservdelar – skärmar, batterier, baksidor, kameror och smådelar – med livstidsgaranti på skärmar, fri frakt och snabb leverans från eget lager.</p>
          <p>Teknikhouse.se ägs och drivs av Nordic Teknik House AB med säte i Stockholm. Vi har lång erfarenhet i branschen och hjälper både privatpersoner och företag att reparera sina mobila enheter. Alla produkter testas av experter — och garanti ingår alltid.</p>
          <div className="trustband">
            <div className="tb"><div className="g"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><path d="M4 9l1-4h14l1 4M5 9v10h14V9M4 9h16"/></svg></div><b>Fysisk butik</b><span>Phone Rep — vi lagar på riktigt</span></div>
            <div className="tb"><div className="g"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><path d="M12 3l7 3v5c0 4.2-2.9 7.3-7 8.9C7.9 18.3 5 15.2 5 11V6z"/><path d="M9 11.5l2 2 4-4"/></svg></div><b>Garanti ingår alltid</b><span>Livstidsgaranti på skärmar</span></div>
            <div className="tb"><div className="g"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9"/></svg></div><b>Eget lager i Sverige</b><span>Snabb leverans, Postnord &amp; DHL</span></div>
            <div className="tb"><div className="g"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-.125em"}}><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div><b>Trygg e-handel</b><span>Svensk Digital Handel · Trustpilot 4,9</span></div>
          </div>
        </div>
      </div></section>
    </div>
  )
}
