import ProductPreview from "@modules/products/components/product-preview"
import NewsletterSignup from "./newsletter-signup"
import RecentlyViewed from "./recently-viewed"
import DeviceFinder from "./device-finder"
import TrustindexReviews from "./trustindex-reviews"
import HeroDeviceVisual from "./hero-device-visual"

// Teknikhouse 2027 homepage: light, warm Swedish-retail styling
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
.th .badge.safe{color:var(--ink2)}
.th .badge.safe svg{width:16px;height:16px;stroke:var(--green);stroke-width:2;fill:none;flex:0 0 auto}

/* usp */
.th .usp{background:var(--bg);border-bottom:1px solid var(--line)}
.th .usp .wrap{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;padding:26px 24px}
.th .uspitem{display:flex;gap:13px;align-items:center;justify-content:center}
.th .uspitem svg{width:28px;height:28px;stroke:var(--red);stroke-width:1.7;fill:none;flex:0 0 auto}
.th .uspitem b{font-family:var(--round);display:block;font-size:14.5px;font-weight:600}
.th .uspitem span{font-size:12.5px;color:var(--sub)}

/* sections */
.th section.blk{padding:46px 0}
.th .shead{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:22px;gap:10px}
.th .shead h2{font-family:var(--round);font-weight:600;font-size:clamp(22px,3vw,28px);letter-spacing:-.02em}
.th .shead a{font-family:var(--round);color:var(--red);font-weight:600;font-size:14px;white-space:nowrap}

/* category tiles: icon centred, label centred under it */
.th .cats{display:grid;grid-template-columns:repeat(6,1fr);gap:16px}
.th .cat{border-radius:18px;min-height:150px;position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:18px 12px;text-align:center;transition:transform .18s,box-shadow .18s}
.th .cat:hover{transform:translateY(-4px);box-shadow:0 18px 40px rgba(27,23,20,.16)}
.th .cat svg{width:42px;height:42px;stroke:rgba(255,255,255,.95);stroke-width:1.5;fill:none;flex:0 0 auto;display:block}
.th .cat b{font-family:var(--round);font-weight:600;font-size:15px;line-height:1.25;color:#fff;letter-spacing:-.01em;text-shadow:0 1px 8px rgba(0,0,0,.2);overflow-wrap:anywhere;hyphens:auto;max-width:100%}
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
.th .repair p{color:#c9c2ba;max-width:460px;font-size:15px}
.th .steps{display:flex;gap:8px;margin-top:20px;flex-wrap:wrap}
.th .steps .st{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:11px 15px;font-family:var(--round);font-size:13px;font-weight:600}
.th .steps .st span{display:block;color:#ff7a6a;font-size:11px;font-weight:600}
.th .repair .cta{margin-top:22px;display:inline-flex;background:var(--red);color:#fff;font-family:var(--round);font-weight:600;border-radius:12px;padding:13px 22px;font-size:14px}
.th .repair .cta:hover{background:var(--red-d)}
.th .repair .rr{background:radial-gradient(circle at 55% 40%,rgba(245,0,0,.28),transparent 60%);display:flex;align-items:center;justify-content:center;min-height:230px;padding:24px}
.th .repair .pin{display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center}
.th .repair .pin i{width:64px;height:64px;border-radius:50%;background:var(--red);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 12px rgba(245,0,0,.16)}
.th .repair .pin svg{width:28px;height:28px;stroke:#fff;stroke-width:1.8;fill:none}
.th .repair .pin b{font-family:var(--round);font-weight:600;font-size:16px;margin-top:8px}
.th .repair .pin span{color:#c9c2ba;font-size:13.5px}

/* brands */
.th .brands{display:grid;grid-template-columns:repeat(8,1fr);gap:12px}
.th .brand{display:flex;align-items:center;justify-content:center;height:66px;border:1px solid var(--line);border-radius:14px;background:var(--card);font-family:var(--round);font-weight:600;font-size:15px;color:var(--ink);transition:.15s}
.th .brand:hover{border-color:var(--red);color:var(--red);transform:translateY(-2px);box-shadow:var(--shadow)}

/* reviews (Trustindex) */
.th .tirate{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.th .tirate b{color:var(--ink);font-weight:600}
.th .tirate .s{color:var(--star);font-size:16px;line-height:1}
.th .tiwrap{position:relative;margin:0 -24px}
.th .tiscroll{position:relative;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;padding:6px 24px 16px;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 28px,#000 calc(100% - 28px),transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 28px,#000 calc(100% - 28px),transparent 100%)}
.th .tiscroll::-webkit-scrollbar{display:none}
.th .tiscroll:focus-visible{outline:2px solid var(--red);outline-offset:-2px;border-radius:14px}
.th .titrack{display:flex;gap:16px;width:max-content}
.th .tiset{display:flex;gap:16px}
.th .ticard{flex:0 0 auto;width:300px;max-width:78vw;margin:0;border:1px solid var(--line);border-radius:16px;padding:20px;background:var(--card);display:flex;flex-direction:column;gap:10px;box-shadow:0 8px 22px -16px rgba(27,23,20,.25)}
.th .ticard .stars{color:var(--star);font-size:15px;letter-spacing:2px;line-height:1}
.th .ticard blockquote{margin:0;flex:1;font-size:14.5px;line-height:1.55;color:var(--ink)}
.th .ticard .who{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-family:var(--round);font-size:13px;font-weight:600;color:var(--ink2)}
.th .ticard .src{font-family:system-ui,Arial,sans-serif;font-weight:400;font-size:12px;color:var(--sub);white-space:nowrap}
.th .tinav{position:absolute;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:50%;border:0;background:#fff;color:var(--ink);font-size:22px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 18px rgba(27,23,20,.14);z-index:2}
.th .tinav:hover{color:var(--red)}
.th .tinav.prev{left:8px}
.th .tinav.next{right:8px}
.th .tinote{margin:4px 0 0;text-align:center;font-size:12.5px;color:var(--sub)}
@media(hover:none){.th .tinav{display:none}}
@media(prefers-reduced-motion:reduce){.th .tiscroll{scroll-snap-type:x mandatory}.th .ticard{scroll-snap-align:start}.th .tiset[data-set=b]{display:none}}

/* SEO text */
.th .intro{background:var(--bg);border:1px solid var(--line);border-radius:20px;padding:40px}
.th .intro .itx{max-width:760px;margin:0 auto}
.th .intro h2{font-family:var(--round);font-size:clamp(22px,2.8vw,28px);font-weight:600;line-height:1.2;letter-spacing:-.02em;margin:0 0 14px;color:var(--ink)}
.th .intro h3{font-family:var(--round);font-size:18px;font-weight:600;line-height:1.3;margin:26px 0 8px;color:var(--ink)}
.th .intro p{color:var(--ink2);font-size:15.5px;line-height:1.7;margin:0 0 12px}
.th .intro a{color:var(--red-d);font-weight:600;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}
.th .intro a:hover{color:var(--red)}
.th .intro .imore{display:none}
.th .intro .itoggle{display:none}


/* section subheading */
.th .shead .stext{display:flex;flex-direction:column;gap:3px}
.th .ssub{color:var(--sub);font-size:14.5px;font-weight:400;font-family:system-ui,"SF Pro Text",Inter,"Segoe UI",Arial,sans-serif}

/* recently viewed (Senast visade) */
.th .rvgrid{display:grid;grid-template-columns:repeat(6,1fr);gap:16px}
.th .rvcard{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:16px;overflow:hidden;background:var(--card);transition:.18s}
.th .rvcard:hover{transform:translateY(-3px);box-shadow:var(--shadow);border-color:var(--line2)}
.th .rvimg{aspect-ratio:1;background:var(--bg);display:flex;align-items:center;justify-content:center;overflow:hidden}
.th .rvimg img{width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply}
.th .rvt{font-size:13px;line-height:1.35;color:var(--ink);padding:11px 12px 14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}

/* guides banner (Guider och tips) */
.th .guide{background:linear-gradient(120deg,#fff5f2,#ffe4dd);border:1px solid var(--line);border-radius:22px;padding:40px;display:grid;grid-template-columns:1.15fr .85fr;gap:26px;align-items:center;overflow:hidden;position:relative}
.th .guide .ge{font-family:var(--round);color:var(--red-d);font-weight:600;font-size:12px;letter-spacing:.08em;text-transform:uppercase}
.th .guide h3{font-family:var(--round);font-weight:600;font-size:clamp(22px,3.2vw,30px);letter-spacing:-.02em;margin:10px 0 8px}
.th .guide p{color:#5f584f;font-size:15px;max-width:520px;margin-bottom:20px}
.th .guide .gcta{display:inline-flex;background:var(--red);color:#fff;font-family:var(--round);font-weight:600;border-radius:12px;padding:13px 24px;font-size:14px}
.th .guide .gcta:hover{background:var(--red-d)}
.th .gicons{display:flex;flex-direction:column;gap:11px}
.th .gtag{background:#fff;border-radius:14px;padding:14px 16px;box-shadow:0 8px 24px rgba(27,23,20,.08);display:flex;gap:12px;align-items:center;font-family:var(--round);font-weight:600;font-size:13.5px;color:var(--ink)}
.th .gtag svg{width:22px;height:22px;stroke:var(--red);stroke-width:1.7;fill:none;flex:0 0 auto}
.th .gtag span{display:block;font-weight:400;font-size:12px;color:var(--sub);font-family:system-ui,Arial,sans-serif}
.th a.gtag{transition:transform .15s,box-shadow .15s}
.th a.gtag:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(27,23,20,.12)}

@media(max-width:1000px){
  .th .rvgrid{grid-template-columns:repeat(3,1fr)}
  .th .guide{grid-template-columns:1fr}
  .th .hero .wrap{grid-template-columns:1fr}
  .th .cats{grid-template-columns:repeat(3,1fr)}
  .th .prods,.th .prods.four{grid-template-columns:repeat(2,1fr)}
  .th .deals{grid-template-columns:1fr}
  .th .usp .wrap{grid-template-columns:repeat(2,1fr)}
  .th .repair{grid-template-columns:1fr}
  .th .brands{grid-template-columns:repeat(4,1fr)}
    .th .finder .row{grid-template-columns:1fr 1fr}
  .th .finder .go{grid-column:1/-1;justify-content:center;padding:13px}
}
@media(max-width:560px){.th .cats{grid-template-columns:repeat(2,1fr)}.th .rvgrid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:1000px){
  .th .usp .wrap{gap:18px 14px}
  .th .uspitem{justify-content:flex-start}
}
@media(max-width:640px){
  .th .wrap{padding:0 16px}
  .th section.blk{padding:34px 0}
  .th .usp .wrap{padding:20px 16px}
  .th .uspitem{flex-direction:column;text-align:center;justify-content:flex-start;gap:8px}
  .th .cat{min-height:128px;gap:10px;padding:16px 8px}
  .th .cat svg{width:36px;height:36px}
  .th .cat b{font-size:14px}
  .th .intro{padding:26px 20px}
.th .tiwrap{margin:0 -16px}
.th .tiscroll{padding:6px 16px 16px}
  .th .intro .itoggle{display:block;position:absolute;opacity:0;width:1px;height:1px;margin:0}
  .th .intro .itx{position:relative}
  .th .intro .ibody{position:relative;max-height:300px;overflow:hidden}
  .th .intro .ibody:after{content:"";position:absolute;left:0;right:0;bottom:0;height:90px;background:linear-gradient(rgba(250,248,246,0),var(--bg))}
  .th .intro .itoggle:checked ~ .ibody{max-height:none}
  .th .intro .itoggle:checked ~ .ibody:after{display:none}
  .th .intro .imore{display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-family:var(--round);font-weight:600;font-size:14.5px;color:var(--red-d);cursor:pointer;padding:8px 0}
  .th .intro .imore .less{display:none}
  .th .intro .itoggle:checked ~ .imore .less{display:inline}
  .th .intro .itoggle:checked ~ .imore .more{display:none}
  .th .intro .itoggle:focus-visible ~ .imore{outline:2px solid var(--red);outline-offset:3px;border-radius:6px}
  .th .guide{padding:28px 22px}
  .th .repair .l{padding:28px 22px}
  .th .deal{padding:28px 24px}
  .th .deal h3,.th .deal p{max-width:100%}
}
@media(max-width:420px){
}`

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Hur mycket kostar frakten?", acceptedAnswer: { "@type": "Answer", text: "Frakten är gratis när du handlar för över 999 kr. Vi skickar med PostNord och DHL från Stockholm och normal leveranstid är ungefär tre dagar." } },
    { "@type": "Question", name: "Kan jag ångra mitt köp?", acceptedAnswer: { "@type": "Answer", text: "Ja, du har 30 dagars öppet köp från beställningsdatum. Varan ska vara oanvänd och ligga i sin förpackning. Reservdelar och andra plomberade varor går inte att ångra när förpackningen är bruten. Du anmäler returen på teknikhouse.se/return." } },
    { "@type": "Question", name: "Vilken garanti gäller?", acceptedAnswer: { "@type": "Answer", text: "Alla produkter säljs med garanti mot fabrikationsfel. För uppladdningsbara batterier och begagnade mobiler och surfplattor gäller tre månaders garanti. Garantin gäller inte vid tappskador, slitage eller felaktig montering. Fullständiga villkor finns i köpvillkoren." } },
    { "@type": "Question", name: "Hur kan jag betala?", acceptedAnswer: { "@type": "Answer", text: "Du kan betala med Swish, kort eller Klarna, där du kan välja faktura eller delbetalning." } },
    { "@type": "Question", name: "Kan jag hämta min order i butiken?", acceptedAnswer: { "@type": "Answer", text: "Ja, bor du i Stockholm kan du hämta din order hos oss på Sveavägen 139. Butiken har öppet måndag till fredag 10 till 18, lördag 11 till 17 och söndag 12 till 16." } },
    { "@type": "Question", name: "Kan vi handla som företag?", acceptedAnswer: { "@type": "Answer", text: "Ja. Ansök om ett företagskonto så får ni fakturaköp, offert på volym och en fast kontaktperson." } },
  ],
}

export default function ThHome({ region, products = [] }: { region?: any; products?: any[] }) {
  const has = (n: number) => region && products && products.length > n
  return (
    <div className="th">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* HERO */}
      <div className="hero"><div className="wrap">
        <div>
          <span className="badge safe"><svg viewBox="0 0 24 24" aria-hidden="true" style={{ fill: "#f5b301", stroke: "#f5b301" }}><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z" /></svg>4,6 av 5 i betyg från över 2 100 omdömen</span>
          <DeviceFinder regionId={region?.id} />
          <div className="herochips"><span>Fri frakt över 999 kr</span><span>Premiumtestade delar med garanti</span><span>Snabb leverans</span></div>
        </div>
        <HeroDeviceVisual />
      </div></div>

      {/* USP */}
      <div className="usp"><div className="wrap">
        <div className="uspitem"><svg viewBox="0 0 24 24"><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></svg><div><b>Fri frakt över 999 kr</b><span>Spårbart med PostNord och DHL</span></div></div>
        <div className="uspitem"><svg viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg><div><b>Handla tryggt och säkert hos oss</b><span>Säker betalning och garanti på alla varor</span></div></div>
        <div className="uspitem"><svg viewBox="0 0 24 24"><path d="M4 8a8 8 0 0116 0M20 4v4h-4" /><path d="M20 16a8 8 0 01-16 0M4 20v-4h4" /></svg><div><b>30 dagars öppet köp</b><span>Enkelt att returnera</span></div></div>
        <div className="uspitem"><svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></svg><div><b>Swish, Klarna och kort</b><span>Faktura eller delbetalning via Klarna</span></div></div>
      </div></div>

      {/* CATEGORY TILES */}
      <section className="blk"><div className="wrap">
        <div className="shead"><div className="stext"><h2>Populära kategorier</h2><span className="ssub">Det som flest letar efter hos oss</span></div><a href="/store">Alla kategorier →</a></div>
        <div className="cats">
          <a className="cat c1" href="/mobilreservdelar"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="3" /><path d="M9 6h6" /></svg><b>Mobilreservdelar</b></a>
          <a className="cat c2" href="/batterier"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="8" width="16" height="9" rx="2" /><path d="M19 11h2v3h-2" /></svg><b>Batterier</b></a>
          <a className="cat c3" href="/mobiltillbehor"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="3" /><circle cx="10" cy="7" r="1.4" /><circle cx="14" cy="7" r="1.4" /></svg><b>Mobiltillbehör</b></a>
          <a className="cat c4" href="/kablar-laddare"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 2v5M15 2v5" /><path d="M6.5 7h11v3.5a5.5 5.5 0 01-11 0z" /><path d="M12 16v6" /></svg><b>Kablar &amp; laddare</b></a>
          <a className="cat c5" href="/horlurar-hogtalare"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15v-3a7 7 0 0114 0v3" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /></svg><b>Hörlurar &amp; ljud</b></a>
          <a className="cat c6" href="/mobiler-surfplattor"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8a8 8 0 0114-5M20 4v4h-4" /><path d="M20 16a8 8 0 01-14 5M4 20v-4h4" /></svg><b>Begagnat</b></a>
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
            <h3>Fynd och outlet</h3>
            <p>Restlager, utgående modeller och kampanjpriser. När det är slut är det slut.</p>
            <a className="db" href="/outlet-fyndvaror">Se fynden</a>
          </div>
          <div className="deal d2">
            <h3>Laga mobilen själv</h3>
            <p>Vi har delarna och verktygen. Du står för tålamodet.</p>
            <a className="db" href="/mobilreservdelar">Hitta din del</a>
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

      {/* NYSS INKOMMET */}
      {has(10) ? (
        <section className="blk" style={{ paddingTop: 0 }}><div className="wrap">
          <div className="shead"><h2>Nyss inkommet</h2><a href="/store">Visa alla →</a></div>
          <div className="prods">
            {products.slice(10, 15).map((p: any) => (
              <ProductPreview key={"new" + p.id} product={p} region={region} isFeatured />
            ))}
          </div>
        </div></section>
      ) : null}

      {/* REPAIR BAND */}
      <section className="blk" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="repair">
          <div className="l">
            <div className="rey">Hellre att vi fixar det?</div>
            <h3>Lämna in mobilen hos Phone Rep</h3>
            <p>I vår verkstad på Sveavägen 139 i Stockholm byter vi skärmar, batterier och laddkontakter med samma delar som vi säljer här på sajten. Felsökningen är gratis och du får ett pris innan vi börjar.</p>
            <div className="steps">
              <div className="st"><span>Steg 1</span>Kom in eller skicka</div>
              <div className="st"><span>Steg 2</span>Gratis felsökning</div>
              <div className="st"><span>Steg 3</span>Vi lagar</div>
            </div>
            <a className="cta" href="/mobilreparation">Läs om mobilreparation →</a>
          </div>
          <div className="rr"><div className="pin"><i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg></i><b>Sveavägen 139</b><span>113 46 Stockholm</span></div></div>
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
          <a className="brand" href="/mobilreservdelar/motorola">Motorola</a>
          <a className="brand" href="/mobilreservdelar/apple">iPad</a>
        </div>
      </div></section>

      {/* SENAST VISADE (personalised, client-side) */}
      <RecentlyViewed regionId={region?.id} />

      {/* KUNDOMDÖMEN: riktiga omdömen från Trustindex, egen karusell */}
<section className="blk" style={{ paddingTop: 0 }}><div className="wrap">
<div className="shead"><div className="stext"><h2>Vad våra kunder säger</h2><span className="ssub tirate"><span className="s" aria-hidden="true">★</span><b>4,6 av 5</b> hos Trustindex, 2 100+ omdömen</span></div><a href="https://www.trustindex.io/reviews/teknikhouse.se" target="_blank" rel="noopener noreferrer">Läs fler omdömen →</a></div>
<TrustindexReviews />
<p className="tinote">Ett urval av omdömen från Trustindex, som samlar omdömen från bland annat Google och Trustpilot.</p>
</div></section>

{/* SEO TEXT */}
<section className="blk" style={{ paddingTop: 0 }}><div className="wrap">
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }} />
<div className="intro">
<div className="itx">
<h2>Reservdelar, tillbehör, elektronik och mycket mer hos Teknikhouse.se</h2>
<input type="checkbox" id="th-seo-more" className="itoggle" aria-label="Visa hela texten" />
<div className="ibody">
<p>Teknikhouse.se är en svensk webbutik för mobilreservdelar, tillbehör och elektronik, och vi skickar till hela Sverige. Bakom sajten står Nordic Teknik House AB, med lager och vår verkstad Phone Rep på Sveavägen 139 i Stockholm. Reservdelar till mobiler är hjärtat i sortimentet, men hos oss hittar du också skal, skärmskydd, laddare, hörlurar, datortillbehör, gaming och både nya och begagnade mobiler. Mycket av det vi säljer använder vi själva varje dag när vi lagar telefoner, så vi vet vad som håller och vad som inte gör det.</p>

<h3>Reservdelar till iPhone, Samsung, iPad och fler märken</h3>
<p>Skärmar och batterier är det vi säljer mest av, men sortimentet går djupare än så. Vi har baksidor, kameror, kameraglas, laddkontakter, högtalare, knappar och flexkablar. Börja med märket, till exempel <a href="/mobilreservdelar/apple">reservdelar till iPhone och iPad</a> eller <a href="/mobilreservdelar/samsung">reservdelar till Samsung</a>, och välj sedan din modell. Då ser du bara delar som passar just din telefon.</p>
<p>Vi har också delar till <a href="/mobilreservdelar/google">Google Pixel</a>, <a href="/mobilreservdelar/xiaomi">Xiaomi</a>, <a href="/mobilreservdelar/oneplus">OnePlus</a>, <a href="/mobilreservdelar/sony-xperia">Sony Xperia</a>, Huawei och flera andra märken. Allt finns samlat under <a href="/mobilreservdelar">mobilreservdelar</a>.</p>

<h3>Så väljer du rätt skärm</h3>
<p>Till många iPhone-modeller finns skärmen i flera kvaliteter, och skillnaden märks. En OLED-skärm i originalkvalitet ger samma djupa svärta, färger och ljusstyrka som telefonen hade från början, och den drar minst ström. En In-Cell eller LCD är ett billigare alternativ som fungerar bra i vardagen, men den är ofta något tjockare, har gråare svärta och kan dra lite mer batteri.</p>
<p>Tittar du mycket på film och bilder är OLED värt pengarna. Ska telefonen bara hålla ett tag till, eller gå vidare till ett barn, räcker en enklare skärm gott. Ett råd från verkstaden: testa alltid skärmen innan du limmar fast den. Koppla in flexkablarna, starta telefonen och kontrollera touch, färger och ljusstyrka. Låt skyddsfilmen sitta kvar tills allt fungerar, annars kan vi inte ta tillbaka delen.</p>

<h3>Batteriet: när är det dags att byta?</h3>
<p>Ett batteri tappar kapacitet med varje laddcykel. På iPhone ser du batterihälsan under Inställningar och Batteri. Ligger den runt 80 procent eller lägre, eller stänger telefonen av sig i kyla, är det dags för ett nytt. På Samsung hittar du batteriets skick i appen Samsung Members.</p>
<p>Du hittar <a href="/batterier/mobilbatterier">mobilbatterier</a> och batterier till surfplattor under <a href="/batterier">batterier</a>, och i vår <a href="/blogg/iphone-batteriguide-den-kompletta-guiden">batteriguide för iPhone</a> går vi igenom bytet steg för steg. Rätt <a href="/verktyg">verktyg</a> gör stor skillnad: en skruvmejsel som passar skruvarna, bändverktyg i plast och ny batteritejp.</p>

<h3>Laga själv eller lämna in hos Phone Rep</h3>
<p>Många byter batteri eller skärm hemma vid köksbordet, och det går bra med rätt verktyg och lite tålamod. Känns det för pilligt kan du lämna in telefonen hos Phone Rep, vår verkstad i samma lokal. Felsökningen är kostnadsfri, du får ett pris innan vi börjar och många reparationer görs medan du väntar. Bor du utanför Stockholm kan du skicka in enheten. Läs mer om vår <a href="/mobilreparation">mobilreparation i Stockholm</a>.</p>

<h3>Skal, skärmskydd, laddare och powerbanks</h3>
<p>Ett bra skal och ett skärmskydd kostar lite jämfört med en ny skärm. Under <a href="/mobiltillbehor">mobiltillbehör</a> hittar du skal, fodral och skärmskydd sorterade efter märke, till exempel <a href="/mobiltillbehor/apple">tillbehör till iPhone</a> och <a href="/mobiltillbehor/samsung">tillbehör till Samsung</a>. Härdat glas skyddar bäst mot sprickor, och ett skal med förhöjd kant runt kameran skyddar linserna när telefonen landar på baksidan.</p>
<p>När det gäller laddning är kontakten det första att kolla. iPhone 15 och senare har USB-C, äldre modeller har Lightning. För snabbladdning av iPhone behövs en USB-C-laddare på minst 20 W med Power Delivery. Nyare Samsung laddar snabbast med en laddare som klarar PPS, ofta på 25 eller 45 W. Har du en iPhone med MagSafe är en magnetisk trådlös laddare smidig på nattduksbordet. Allt detta hittar du under <a href="/kablar-laddare">kablar och laddare</a>. En <a href="/powerbank">powerbank</a> på 10 000 mAh räcker till ungefär två laddningar av en vanlig mobil. Tänk på att powerbanks ska ligga i handbagaget när du flyger.</p>

<h3>Hörlurar, högtalare och klockor</h3>
<p>Bland våra <a href="/horlurar-hogtalare">hörlurar och högtalare</a> finns bland annat Sony, JVC, Urbanista och Apple. Tre saker avgör om du blir nöjd med trådlösa hörlurar. Passformen påverkar både ljud och komfort, så välj gärna modeller med flera storlekar på öronsnäckorna. Aktiv brusreducering, ANC, gör stor skillnad på tunnelbanan och på flyget. Ska de med till gymmet räcker det oftast med IPX4, som klarar svett och regnstänk. Letar du klocka finns <a href="/mobiler-surfplattor/apple-watch">Apple Watch</a>, både ny och <a href="/mobiler-surfplattor/begagnad-apple-watch">begagnad</a>.</p>

<h3>Dator, gaming och hem</h3>
<p>Sortimentet slutar inte vid mobilen. Under <a href="/datortillbehor">datortillbehör</a> finns <a href="/datortillbehor/kablar-adaptrar">kablar och adaptrar</a>, <a href="/datortillbehor/lagring-media">lagring</a>, <a href="/datortillbehor/datorskarmar-bildskarmar">datorskärmar</a> och tillbehör till <a href="/datortillbehor/apple-macbook">MacBook</a>. Vi säljer också <a href="/dator-laptop">datorer och laptops</a>, bland annat <a href="/dator-laptop/begagnad-laptop">begagnade laptops</a> som är ett prisvärt val för skola och kontor. Spelar du hittar du headset, kontroller och skärmar under <a href="/gaming">gaming</a>, och under <a href="/hem-fritid">hem och fritid</a> finns bland annat biltillbehör, fläktar och personvård.</p>

<h3>Mobiler och surfplattor, nya och begagnade</h3>
<p>En begagnad telefon är ett smart sätt att spara både pengar och resurser. Alla begagnade mobiler och surfplattor vi säljer är testade, olåsta och utan abonnemang. Titta på <a href="/mobiler-surfplattor/begagnad-iphone">begagnad iPhone</a>, <a href="/mobiler-surfplattor/begagnad-samsung-galaxy">begagnad Samsung Galaxy</a> och <a href="/mobiler-surfplattor/begagnade-surfplattor">begagnade surfplattor</a>, eller välj bland <a href="/mobiler-surfplattor/nya-mobiler-surfplattor">nya mobiler och surfplattor</a>. Kolla batterihälsan och hur länge modellen får uppdateringar innan du bestämmer dig. Har du en gammal telefon i en låda kan du <a href="/info/salj-din-enhet">sälja din enhet</a> till oss, och restlager och fynd samlar vi under <a href="/outlet-fyndvaror">outlet</a>.</p>

<h3>Frakt, retur, betalning och företag</h3>
<p>Vi skickar med PostNord och DHL från Stockholm och normal leveranstid är ungefär tre dagar. Frakten är gratis när du handlar för över 999 kr. Bor du i Stockholm kan du hämta din order i butiken på Sveavägen 139, som har öppet alla dagar i veckan. Du betalar med Swish, kort eller Klarna, där du kan välja faktura eller delbetalning.</p>
<p>Du har 30 dagars öppet köp och garanti mot fabrikationsfel på det du köper. För uppladdningsbara batterier och begagnade enheter gäller tre månaders garanti. Reservdelar och andra plomberade varor går inte att ångra när förpackningen är bruten. Allt står i våra <a href="/info/villkor">köpvillkor</a> och <a href="/info/oppet-kop-retur">regler för öppet köp och retur</a>.</p>
<p>Handlar ni som företag kan ni <a href="/retail-application">ansöka om ett företagskonto</a> och få fakturaköp, offert på volym och en fast kontaktperson. Undrar du om en del passar din telefon? Mejla info@teknikhouse.se med modellen, så svarar någon av oss som jobbar med det här varje dag.</p>
</div>
<label htmlFor="th-seo-more" className="imore" aria-hidden="true"><span className="more">Läs mer ↓</span><span className="less">Visa mindre ↑</span></label>
</div>
</div>
</div></section>

{/* GUIDER OCH TIPS: links to the blog */}
      <section className="blk" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="guide">
          <div>
            <div className="ge">Från bloggen</div>
            <h3>Guider och tips</h3>
            <p>Vi skriver om sådant vi får frågor om i butiken varje vecka. Hur du ser vilken modell du har, när batteriet behöver bytas och vad du ska kolla innan du köper en begagnad iPhone.</p>
            <a className="gcta" href="/blogg">Till bloggen →</a>
          </div>
          <div className="gicons">
            <a className="gtag" href="/blogg/sa-har-lagar-du-din-mobil-sjalv-en-guide-till-iphone-och-samsung-reservdelar"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="3" /><path d="M9 6h6" /></svg><div>Laga mobilen själv<span>iPhone och Samsung</span></div></a>
            <a className="gtag" href="/blogg/iphone-batteriguide-den-kompletta-guiden"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="8" width="16" height="9" rx="2" /><path d="M19 11h2v3h-2" /><path d="M8 10l-2 3h3l-2 3" /></svg><div>Batteriguide för iPhone<span>När är det dags att byta?</span></div></a>
            <a className="gtag" href="/blogg/sa-har-identifierar-du-din-ipad-modell-en-komplett-guide-for-att-hitta-ratt-enhet"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg><div>Vilken iPad har jag?<span>Hitta modellnumret</span></div></a>
          </div>
        </div>
      </div></section>

      {/* NEWSLETTER */}
      <section className="blk" style={{ paddingTop: 0 }}><div className="wrap">
        <NewsletterSignup />
      </div></section>
    </div>
  )
}
