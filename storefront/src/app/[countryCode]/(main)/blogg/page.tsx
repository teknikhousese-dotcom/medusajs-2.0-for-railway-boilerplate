import { Metadata } from "next"
import Link from "next/link"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://backend-production-c278d.up.railway.app"
const PUBKEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_59ff167578b5ec25a84af9a76d15c105da93e6f06e6b49a88a9bba24f9e02b85"
const CANONICAL = "https://www.teknikhouse.se/blogg"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Teknikhouse Blogg | Mobilreservdelar, reparation & sälj din mobil",
  description:
    "Eget lager och grossist. Guider om mobilreparation och reservdelar, och hur du säljer din iPhone, Samsung eller MacBook till oss, tryggt och till ett rättvist pris.",
  alternates: { canonical: CANONICAL },
  openGraph: { title: "Teknikhouse Blogg", description: "Guider om mobilreparation, reservdelar och att sälja din enhet.", url: CANONICAL, type: "website", siteName: "Teknikhouse", locale: "sv_SE" },
  robots: { index: true, follow: true },
}

type Post = { id: string; title: string; slug: string; excerpt?: string; cover_image?: string; published_at?: string }

async function getPosts(): Promise<Post[]> {
  try {
    const r = await fetch(`${BACKEND}/store/blog`, { headers: { "x-publishable-api-key": PUBKEY }, next: { revalidate: 300 } })
    if (!r.ok) return []
    const j = await r.json()
    return Array.isArray(j?.posts) ? j.posts : []
  } catch { return [] }
}

function svDate(d?: string) {
  if (!d) return ""
  try { return new Date(d).toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" }) } catch { return "" }
}

function Cover({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  if (src) return <img src={src} alt={alt} loading="lazy" className={className} />
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-[#FFECEC] to-[#F7F7FA] ${className || ""}`}>
      <span className="text-3xl">✎</span>
    </div>
  )
}

const PILL = "rounded-full border border-ui-border-base bg-white px-4 py-2 text-sm font-medium text-[#14161C] hover:border-[#F50000] hover:text-[#F50000] transition-colors"

export default async function BloggPage() {
  const posts = await getPosts()
  const featured = posts[0]
  const rest = posts.slice(1)

  return (
    <div className="content-container py-10 lg:py-14">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#F50000] mb-3">Teknikhouse Blogg</p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#14161C] break-words">Störst i Sverige på mobilreservdelar, tillbehör &amp; verktyg</h1>
        <p className="mt-4 text-ui-fg-subtle text-base sm:text-lg leading-relaxed">
          Eget lager och grossist. Här delar vi guider om mobilreparation och reservdelar och visar hur du säljer din iPhone, Samsung eller MacBook till oss, tryggt och till ett rättvist pris.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link href="/mobilreservdelar" className={PILL}>Mobilreservdelar</Link>
          <Link href="/mobiltillbehor" className={PILL}>Mobiltillbehör</Link>
          <Link href="/verktyg" className={PILL}>Verktyg</Link>
          <Link href="/mobiler-surfplattor" className={PILL}>Mobiltelefoner</Link>
          <Link href="/info/salj-din-enhet" className="rounded-full bg-[#F50000] px-4 py-2 text-sm font-semibold text-white hover:bg-[#C90000] transition-colors">Sälj din enhet →</Link>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-ui-border-base p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFECEC] text-[#F50000] text-xl">✎</div>
          <h2 className="text-lg font-semibold">Inga inlägg publicerade än</h2>
          <p className="mt-2 text-ui-fg-subtle text-sm max-w-md mx-auto">Vi arbetar på guider för skärmbyte, batteribyte och mer. Under tiden hittar du delar, verktyg och steg-för-steg-hjälp i butiken.</p>
          <div className="mt-6"><Link href="/store" className="rounded-xl bg-[#F50000] px-5 py-3 text-white text-sm font-semibold hover:bg-[#C90000] transition-colors">Till butiken</Link></div>
        </div>
      ) : (
        <>
          {featured && (
            <Link href={`/blogg/${featured.slug}`} className="group mt-10 block overflow-hidden rounded-3xl border border-ui-border-base bg-white hover:shadow-[0_18px_50px_rgba(20,22,28,0.10)] transition-shadow">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="relative aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[320px] overflow-hidden">
                  <Cover src={featured.cover_image} alt={featured.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  <span className="absolute left-4 top-4 rounded-full bg-[#F50000] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">Senaste</span>
                </div>
                <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                  <p className="text-xs font-medium text-ui-fg-muted">{svDate(featured.published_at)}</p>
                  <h2 className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight text-[#14161C] group-hover:text-[#F50000] transition-colors">{featured.title}</h2>
                  {featured.excerpt && <p className="mt-3 text-ui-fg-subtle leading-relaxed line-clamp-3">{featured.excerpt}</p>}
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#F50000]">Läs guiden →</span>
                </div>
              </div>
            </Link>
          )}

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {rest.map((p) => (
              <Link key={p.id} href={`/blogg/${p.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-ui-border-base bg-white hover:shadow-[0_14px_38px_rgba(20,22,28,0.09)] hover:-translate-y-0.5 transition-all">
                <div className="aspect-[16/10] overflow-hidden">
                  <Cover src={p.cover_image} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[11px] font-medium text-ui-fg-muted">{svDate(p.published_at)}</p>
                  <h3 className="mt-1.5 text-lg font-semibold leading-snug tracking-tight text-[#14161C] group-hover:text-[#F50000] transition-colors line-clamp-2">{p.title}</h3>
                  {p.excerpt && <p className="mt-2 text-sm text-ui-fg-subtle leading-relaxed line-clamp-3">{p.excerpt}</p>}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#F50000]">Läs mer →</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
