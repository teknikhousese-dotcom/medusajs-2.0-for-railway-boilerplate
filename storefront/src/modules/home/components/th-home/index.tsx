import ProductPreview from "@modules/products/components/product-preview"
import NewsletterSignup from "./newsletter-signup"

// Teknikhouse 2027 homepage — light, warm Swedish-retail styling
// (modelled on power.se / teknikdelar.se / 24.se). Scoped under .th.
// Server component. Real products via <ProductPreview>. Rendered from
// app/[countryCode]/(main)/page.tsx.
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
.th{--red:#F50000;--red-d:#D10000;--ink:#1b1714;--ink2:#2c2621;--sub:#6f685f;--faint:#a49c92;--bg:#faf8f6;--card:#fff;--line:#efeae5;--line2:#e6e0da;--green:#1a9d55;--amber:#ffb300;--star:#FFB020;
  --round:"Poppins",ui-rounded,"SF Pro Rounded","Segoe UI",system-ui,sans-serif;
  --shadow:0 14px 34px -14px rgba(27,23,20,.16)}
.th{color:var(--ink);font-family:system-ui,"SF Pro Text",Inter,"Segoe UI",Arial,sans-serif;line-height:1.5;background:#fff}
.th *{box-sizing:border-box}
.th .wrap{max-width:1280px;margin:0 auto;padding:0 24px}
.th a{text-decoration:none;color:inherit}
.th .r{font-family:var(--round)}
.th .dot{width:8px;height:8px;border-radius:50%;background:var(--green);display:inline-block}

/* hero */
.th .hero{background:linear-gradient(120deg,#fff5f2,#ffe9e4 58%,#ffdfd8)}
.th .hero .wrap{display:grid;grid-template-columns:1.05fr .95fr;gap:36px;align-items:center;padding:46px 24px}
.th .badge{display:inline-flex;align-items:center;gap:8px;background:#fff;border-radius:999px;padding:8px 15px;font-family:var(--round);font-weight:600;font-size:12.5px;color:var(--red-d);box-shadow:0 3px 12px rgba(27,23,20,.06)}
.th .hero h1{font-family:var(--round);font-weight:600;font-size:clamp(34px,5vw,58px);line-height:1.03;letter-spacing:-.02em;margin:16px 0}
.th .hero h1 .red{color:var(--red)}
.th .lead{color:#5f584f;font-size:17px;line-height:1.55;max-width:450px;margin-bottom:22px}
.th .finder{background:#fff;border-radius:20px;padding:18px;box-shadow:0 20px 50px rgba(27,23,20,.12);max-width:540px}
.th .finder .flab{font-family:var(--round);font-weight:600;font-size:13px;color:var(--ink);margin-bottom:12px;display:flex;gap:8px;align-items:center}
.th .finder .row{display:grid;grid-template-columns:1fr 1fr auto;gap:10px}
.th .finder .sel{font-family:var(--round);font-size:14.5px;font-weight:600;color:var(--ink);background:var(--bg);border:2px solid var(--line2);border-radius:13px;padding:13px 14px;display:flex;align-items:center;justify-content:space-between;gap:8px}
.th .finder .sel:after{content:"▾";color:var(--faint);font-size:12px}
.th .finder .go{background:var(--red);color:#fff;border:0;border-radius:13px;padding:0 22px;font-family:var(--round);font-weight:600;font-size:15px;white-space:nowrap;display:inline-flex;align-items:center}
.th .finder .go:hover{background:var(--red-d)}
.th .finder .fit{margin-top:12px;font-size:13px;color:var(--sub);display:flex;gap:7px;align-items:center}
.th .finder .fit b{color:var(--green)}
.th .herochips{display:flex;gap:9px;margin-top:18px;flex-wrap:wrap}
.th .herochips span{background:#fff;border-radius:999px;padding:8px 14px;font-size:12.5px;font-weight:600;color:var(--ink2);display:flex;gap:7px;align-items:center;box-shadow:0 2px 8px rgba(27,23,20,.05)}
.th .herochips .s{color:var(--star)}
.th .heroart{background:#fff;border-radius:24px;box-shadow:0 20px 50px rgba(27,23,20,.1);min-height:360px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.th .heroart .ph{width:150px;height:300px;border-radius:34px;background:linear-gradient(160deg,#2c2621,#4a423b);box-shadow:0 20px 50px rgba(0,0,0,.25);position:relative}
.th .heroart .ph:after{content:"";position:absolute;top:14px;left:50%;transform:translateX(-50%);width:46px;height:6px;border-radius:3px;background:rgba(255,255,255,.25)}
.th .heroart .fc{position:absolute;background:#fff;border-radius:14px;padding:11px 14px;box-shadow:0 12px 30px rgba(27,23,20,.12);font-size:12.5px}
.th .heroart .fc b{display:block;font-family:var(--round);font-weight:600;color:var(--ink)}
.th .heroart .fc .p{color:var(--red);font-weight:600}
.th .heroart .fc .ok{color:var(--green);font-weight:600;font-size:11.5px}

/* usp */
.th .usp{background:var(--bg);border-bottom:1px solid var(--line)}
.th .usp .wrap{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;padding:28px 24px}
.th .uspitem{display:flex;gap:13px;align-items:center}
.th .uspitem svg{width:28px;height:28px;stroke:var(--red);stroke-width:1.7;fill:none;flex:0 0 auto}
.th .uspitem b{font-family:var(--round);display:block;font-size:14.5px}
.th .uspitem span{font-size:12.5px;color:var(--sub)}

/* sections */
.th section.blk{padding:46px 0}
.th .shead{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:22px;gap:10px}
.th .shead h2{font-family:var(--round);font-weight:600;font-size:clamp(22px,3vw,28px);letter-spacing:-.02em}
.th .shead a{font-family:var(--round);color:var(--red);font-weight:600;font-size:14px;white-space:nowrap}

/* category tiles */
.th .cats{display:grid;grid-template-columns:repeat(6,1fr);gap:16px}
.th .cat{border-radius:18px;height:150px;position:relative;overflow:hidden;display:flex;align-items:flex-end;padding:16px;transition:.18s}
.th .cat:hover{transform:translateY(-4px);box-shadow:0 18px 40px rgba(27,23,20,.16)}
.th .cat b{font-family:var(--round);font-weight:600;font-size:15.5px;color:#fff;position:relative;z-index:2;letter-spacing:-.01em;text-shadow:0 1px 8px rgba(0,0,0,.28)}
.th .cat svg{position:absolute;top:14px;right:14px;width:38px;height:38px;stroke:rgba(255,255,255,.92);stroke-width:1.5;fill:none;z-index:2}
.th .cat.c1{background:linear-gradient(150deg,#ff5a4d,#f50000)}
.th .cat.c2{background:linear-gradient(150deg,#4f7cff,#2b52d6)}
.th .cat.c3{background:linear-gradient(150deg,#22b07a,#0e8a56)}
.th .cat.c4{background:linear-gradient(150deg,#ffb84d,#ff8f1f)}
.th .cat.c5{background:linear-gradient(150deg,#9d6bff,#6f3ce0)}
.th .cat.c6{background:linear-gradient(150deg,#2c2621,#0f0c0a)}

/* product grid (holds <ProductPreview>) */
.th .prods{display:grid;grid-template-columns:repeat(5,1fr);gap:16px}
.th .prods.four{grid-template-columns:repeat(4,1fr)}

/* deals */
.th .deals{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.th .deal{border-radius:20px;padding:34px;min-height:200px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden}
.th .deal.d1{background:linear-gradient(135deg,#fff0ee,#ffd9d2)}
.th .deal.d2{background:linear-gradient(135deg,#1b1714,#3a332d)}
.th .deal.d2 *{color:#fff}
.th .deal h3{font-family:var(--round);font-weight:600;font-size:28px;letter-spacing:-.02em;max-width:66%}
.th .deal p{color:#6f685f;margin:9px 0 18px;font-size:14.5px;max-width:66%}
.th .deal.d2 p{color:#c9c2ba}
.th .deal .db{align-self:flex-start;background:var(--red);color:#fff;font-family:var(--round);font-weight:600;padding:12px 22px;border-radius:12px;font-size:14px}
.th .deal .burst{position:absolute;right:24px;top:24px;width:72px;height:72px;border-radius:50%;background:var(--amber);color:#1b1714;font-family:var(--round);font-weight:600;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(6deg)}
.th .deal .burst small{font-size:10px;font-weight:600}

/* repair band */
.th .repair{background:linear-gradient(120deg,#1b1714,#332c26);color:#fff;border-radius:22px;overflow:hidden;display:grid;grid-template-columns:1.1fr .9fr}
.th .repair .l{padding:40px}
.th .repair .rey{font-family:var(--round);color:#ff7a6a;font-weight:600;font-size:12px;letter-spacing:.1em;text-transform:uppercase}
.th .repair h3{font-family:var(--round);font-size:clamp(22px,3.4vw,30px);font-weight:600;margin:12px 0 10px;letter-spacing:-.02em}
.th .repair p{color:#c9c2ba;max-width:440px;font-size:15px}
.th .steps{display:flex;gap:8px;margin-top:20px;flex-wrap:wrap}
.th .steps .st{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:11px 15px;font-family:var(--round);font-size:13px;font-weight:600}
.th .steps .st span{display:block;color:#ff7a6a;font-size:11px;font-weight:600}
.th .repair .cta{margin-top:22px;display:inline-flex;background:var(--red);color:#fff;font-family:var(--round);font-weight:600;border-radius:12px;padding:13px 22px;font-size:14px}
.th .repair .rr{background:radial-gradient(circle at 55% 40%,rgba(245,0,0,.28),transparent 60%);display:flex;align-items:center;justify-content:center;min-height:230px}
.th .repair .play{width:64px;height:64px;border-radius:50%;background:var(--red);display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;box-shadow:0 0 0 12px rgba(245,0,0,.16)}

/* brands */
.th .brands{display:grid;grid-template-columns:repeat(8,1fr);gap:12px}
.th .brand{display:flex;align-items:center;justify-content:center;height:66px;border:1px solid var(--line);border-radius:14px;background:var(--card);font-family:var(--round);font-weight:600;font-size:15px;color:var(--ink);transition:.15s}
.th .brand:hover{border-color:var(--red);color:var(--red);transform:translateY(-2px);box-shadow:var(--shadow)}

/* reviews */
.th .revs{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.th .rev{border:1px solid var(--line);border-radius:16px;padding:22px;background:var(--card)}
.th .rev .stars{color:var(--star);font-size:15px;letter-spacing:3px}
.th .rev p{margin:10px 0 14px;font-size:15px;line-height:1.55;color:var(--ink)}
.th .rev .who{font-family:var(--round);font-size:13px;color:var(--sub);font-weight:600}

/* intro */
.th .intro{background:var(--bg);border:1px solid var(--line);border-radius:18px;padding:34px}
.th .intro h3{font-family:var(--round);font-size:22px;font-weight:600;margin-bottom:6px;letter-spacing:-.01em}
.th .intro p{color:var(--ink2);font-size:14.5px;max-width:860px;margin-top:10px}

/* newsletter */
.th .news{background:linear-gradient(135deg,#1b1714,#332c26);border-radius:24px;padding:40px;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;color:#fff}
.th .news h2{font-family:var(--round);font-size:26px;margin:0 0 6px;color:#fff;letter-spacing:-.02em}
.th .news p{margin:0;color:#c9c2ba;font-size:15px;max-width:420px}

@media(max-width:1000px){
  .th .hero .wrap{grid-template-columns:1fr}
  .th .cats{grid-template-columns:repeat(3,1fr)}
  .th .prods,.th .prods.four{grid-template-columns:repeat(2,1fr)}
  .th .deals{grid-template-columns:1fr}
  .th .usp .wrap{grid-template-columns:repeat(2,1fr)}
  .th .repair{grid-template-columns:1fr}
  .th .brands{grid-template-columns:repeat(4,1fr)}
  .th .revs{grid-template-columns:1fr}
  .th .finder .row{grid-template-columns:1fr 1fr}
  .th .finder .go{grid-column:1/-1;justify-content:center;padding:13px}
}
@media(max-width:560px){.th .cats{grid-template-columns:repeat(2,1fr)}}`

export default function ThHome({ region, products = [] }: { region?: any; products?: any[] }) {
  const has = (n: number) => region && products && products.length > n
  return (
    <div className="th">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* HERO */}
      <div className="hero"><div className="wrap">
        <div>
          <span className="badge"><span className="dot" style={{ background: "var(--red)" }} /> Sveriges bredaste reservdelslager</span>
          <h1>Hitta rätt del<br />till <span className="red">din modell.</span></h1>
          <p className="lead">Skärmar, batterier och baksidor till 6&nbsp;000+ modeller — testade och garanterade att passa. Välj din enhet, så visar vi bara det som passar.</p>
          <div className="finder">
            <div className="flab"><span className="dot" style={{ background: "var(--red)" }} /> Vilken enhet har du?</div>
            <div className="row">
              <div className="sel">Märke: Apple</div>
              <div className="sel">Modell: iPhone 13</div>
              <a className="go" href="/mobilreservdelar">Visa delar</a>
            </div>
            <div className="fit">✓ Varje del är märkt <b>&quot;Passar din enhet&quot;</b> — verifierad kompatibilitet.</div>
          </div>
          <div className="herochips"><span><span className="s">★</span> 4,9 Trustpilot</span><span>Livstidsgaranti på delar</span><span>Skickas idag</span></div>
        </div>
        <div className="heroart">
          <div className="ph" />
          <div className="fc" style={{ top: "44px", left: "34px" }}><b>Skärm iPhone 13</b><span className="ok">✓ Passar din enhet</span></div>
          <div className="fc" style={{ bottom: "44px", right: "34px" }}><b>Batteri · 649 kr</b><span className="p">Livstidsgaranti</span></div>
        </div>
      </div></div>

      {/* USP */}
      <div className="usp"><div className="wrap">
        <div className="uspitem"><svg viewBox="0 0 24 24"><path d="M3 13h6l2-8 3 16 2-6h5" /></svg><div><b>Snabb leverans</b><span>Skickas idag · 1–3 dagar hem</span></div></div>
        <div className="uspitem"><svg viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg><div><b>Livstidsgaranti</b><span>Testade delar, trygg reparation</span></div></div>
        <div className="uspitem"><svg viewBox="0 0 24 24"><path d="M4 8a8 8 0 0116 0M20 4v4h-4" /><path d="M20 16a8 8 0 01-16 0M4 20v-4h4" /></svg><div><b>30 dagars öppet köp</b><span>Enkelt att returnera</span></div></div>
        <div className="uspitem"><svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></svg><div><b>Swish · Klarna · Kort</b><span>Trygg betalning</span></div></div>
      </div></div>

      {/* CATEGORY TILES */}
      <section className="blk"><div className="wrap">
        <div className="shead"><h2>Populära kategorier</h2><a href="/store">Alla kategorier →</a></div>
        <div className="cats">
          <a className="cat c1" href="/mobilreservdelar"><svg viewBox="0 0 24 24"><rect x="6" y="2.5" width="12" height="19" rx="3" /><path d="M9 6h6" /></svg><b>MOBILRESERVDELAR</b></a>
          <a className="cat c2" href="/batterier"><svg viewBox="0 0 24 24"><rect x="3" y="8" width="16" height="9" rx="2" /><path d="M19 11h2v3h-2" /></svg><b>BATTERIER</b></a>
          <a className="cat c3" href="/mobiltillbehor"><svg viewBox="0 0 24 24"><rect x="6" y="2.5" width="12" height="19" rx="3" /><circle cx="10" cy="7" r="1.4" /><circle cx="14" cy="7" r="1.4" /></svg><b>MOBILTILLBEHÖR</b></a>
          <a className="cat c4" href="/kablar-laddare"><svg viewBox="0 0 24 24"><path d="M9 2v5M15 2v5" /><path d="M6.5 7h11v3.5a5.5 5.5 0 01-11 0z" /><path d="M12 16v6" /></svg><b>KABLAR &amp; LADDARE</b></a>
          <a className="cat c5" href="/horlurar-hogtalare"><svg viewBox="0 0 24 24"><path d="M5 15v-3a7 7 0 0114 0v3" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /></svg><b>HÖRLURAR &amp; LJUD</b></a>
          <a className="cat c6" href="/mobiler-surfplattor"><svg viewBox="0 0 24 24"><path d="M4 8a8 8 0 0114-5M20 4v4h-4" /><path d="M20 16a8 8 0 01-14 5M4 20v-4h4" /></svg><b>BEGAGNAT</b></a>
        </div>
      </div></section>

      {/* BESTSELLERS */}
      {has(0) ? (
        <section className="blk" style={{ paddingTop: 0 }}><div className="wrap">
          <div className="shead"><h2>Bästsäljare</h2><a href="/store">Visa alla →</a></div>
          <div className="prods">
            {products.slice(0, 5).map((p: any) => (
              <ProductPreview key={p.id} product={p} region={region} isFeatured />
            ))}
          </div>
        </div></section>
      ) : null}

      {/* DEAL BANNERS */}
      <section className="blk" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="deals">
          <div className="deal d1">
            <div className="burst">−40%<small>upp till</small></div>
            <h3>Veckans kampanjer</h3>
            <p>Skärmar &amp; batterikit till grymma priser — så länge lagret räcker.</p>
            <a className="db" href="/outlet-fyndvaror">Handla kampanjer</a>
          </div>
          <div className="deal d2">
            <h3>Laga din teknik själv</h3>
            <p>Du fixar mobilen — vi har reservdelarna, verktygen och guiden.</p>
            <a className="db" href="/mobilreservdelar">Kom igång</a>
          </div>
        </div>
      </div></section>

      {/* ON SALE */}
      {has(5) ? (
        <section className="blk" style={{ paddingTop: 0 }}><div className="wrap">
          <div className="shead"><h2>Produkter på rea</h2><a href="/outlet-fyndvaror">Visa alla →</a></div>
          <div className="prods">
            {products.slice(5, 10).map((p: any) => (
              <ProductPreview key={"rea" + p.id} product={p} region={region} isFeatured />
            ))}
          </div>
        </div></section>
      ) : null}

      {/* REPAIR BAND */}
      <section className="blk" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="repair">
          <div className="l">
            <div className="rey">Laga själv — eller lämna till oss</div>
            <h3>Byt skärmen på 12 minuter.</h3>
            <p>Steg-för-steg-guider för just din modell, med exakt rätt del och verktyg länkade. Vill du hellre slippa? Vår butik Phone Rep (Sveavägen 139, Stockholm) lagar åt dig — med samma delar vi säljer.</p>
            <div className="steps">
              <div className="st"><span>Steg 1</span>Välj modell</div>
              <div className="st"><span>Steg 2</span>Följ guiden</div>
              <div className="st"><span>Steg 3</span>Klart!</div>
            </div>
            <a className="cta" href="/mobilreparation">Se guider för din modell →</a>
          </div>
          <div className="rr"><div className="play">▶</div></div>
        </div>
      </div></section>

      {/* BRANDS */}
      <section className="blk" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="shead"><h2>Handla efter märke</h2><a href="/store">Visa alla →</a></div>
        <div className="brands">
          <a className="brand" href="/mobilreservdelar/apple">Apple</a>
          <a className="brand" href="/mobilreservdelar/samsung">Samsung</a>
          <a className="brand" href="/mobilreservdelar/huawei">Huawei</a>
          <a className="brand" href="/mobilreservdelar/xiaomi">Xiaomi</a>
          <a className="brand" href="/mobilreservdelar/oneplus">OnePlus</a>
          <a className="brand" href="/mobilreservdelar/sony-xperia">Sony</a>
          <a className="brand" href="/mobilreservdelar">Motorola</a>
          <a className="brand" href="/mobilreservdelar/apple">iPad</a>
        </div>
      </div></section>

      {/* REVIEWS */}
      <section className="blk" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="shead"><h2>Vad våra kunder säger</h2><span className="r" style={{ color: "var(--star)", fontWeight: 600 }}>Trustpilot 4,9 ★</span></div>
        <div className="revs">
          <div className="rev"><div className="stars">★★★★★</div><p>Snabb leverans och exakt rätt skärm till min iPhone. Bytet tog 15 minuter med deras guide.</p><div className="who">Johan L. · Verifierad kund</div></div>
          <div className="rev"><div className="stars">★★★★★</div><p>Beställde batteri och verktyg — allt fungerade perfekt. Livstidsgaranti på skärmen kändes tryggt.</p><div className="who">Sara M. · Verifierad kund</div></div>
          <div className="rev"><div className="stars">★★★★★</div><p>Bäst i Sverige på reservdelar. Bra priser, snabb frakt och grymt kundtjänst när jag hade en fråga.</p><div className="who">Erik N. · Verifierad kund</div></div>
        </div>
      </div></section>

      {/* SEO INTRO */}
      <section className="blk" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="intro">
          <h3>Mobilreservdelar &amp; mobiltillbehör — Sveriges bredaste sortiment</h3>
          <p>Hos Teknikhouse hittar du marknadens bredaste sortiment av mobilreservdelar och mobiltillbehör till iPhone, Samsung, iPad och fler. Vi lagerför skärmar, batterier, baksidor, kameror och smådelar — med livstidsgaranti på skärmar, fri frakt och snabb leverans från eget lager.</p>
          <p>Teknikhouse.se ägs och drivs av Nordic Teknik House AB med säte i Stockholm. Vi hjälper både privatpersoner och företag att reparera sina enheter. Alla produkter testas av experter — och garanti ingår alltid.</p>
        </div>
      </div></section>

      {/* NEWSLETTER */}
      <section className="blk"><div className="wrap">
        <div className="news">
          <div><h2>Få 10% på din första order</h2><p>Anmäl dig till nyhetsbrevet för guider, nyheter och exklusiva erbjudanden.</p></div>
          <NewsletterSignup />
        </div>
      </div></section>
    </div>
  )
}
