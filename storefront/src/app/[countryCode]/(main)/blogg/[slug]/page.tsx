import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://backend-production-c278d.up.railway.app"
const PUBKEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_59ff167578b5ec25a84af9a76d15c105da93e6f06e6b49a88a9bba24f9e02b85"

export const revalidate = 300

type Post = { id: string; title: string; slug: string; body_html?: string; excerpt?: string; cover_image?: string; meta_title?: string; meta_desc?: string; published_at?: string }
type More = { title: string; slug: string; excerpt?: string; cover_image?: string; published_at?: string }

async function getPost(slug: string): Promise<{ post: Post | null; more: More[] }> {
  try {
    const r = await fetch(`${BACKEND}/store/blog/${encodeURIComponent(slug)}`, { headers: { "x-publishable-api-key": PUBKEY }, next: { revalidate: 300 } })
    if (!r.ok) return { post: null, more: [] }
    const j = await r.json()
    return { post: j?.post || null, more: Array.isArray(j?.more) ? j.more : [] }
  } catch { return { post: null, more: [] } }
}

function svDate(d?: string) {
  if (!d) return ""
  try { return new Date(d).toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" }) } catch { return "" }
}
function readMins(html?: string) {
  const words = (html || "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { post } = await getPost(slug)
  if (!post) return { title: "Inlägget hittades inte | Teknikhouse" }
  const canonical = `https://www.teknikhouse.se/blogg/${post.slug}`
  const title = post.meta_title || `${post.title} | Teknikhouse`
  const desc = post.meta_desc || post.excerpt || ""
  return {
    title, description: desc,
    alternates: { canonical },
    openGraph: { title, description: desc, url: canonical, type: "article", siteName: "Teknikhouse", locale: "sv_SE", images: post.cover_image ? [{ url: post.cover_image }] : undefined },
    robots: { index: true, follow: true },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { post, more } = await getPost(slug)
  if (!post) notFound()

  const jsonLd = {
    "@context": "https://schema.org", "@type": "BlogPosting",
    headline: post.title, datePublished: post.published_at, dateModified: post.published_at,
    image: post.cover_image || undefined, author: { "@type": "Organization", name: "Teknikhouse" },
    publisher: { "@type": "Organization", name: "Nordic Teknik House AB" },
    mainEntityOfPage: `https://www.teknikhouse.se/blogg/${post.slug}`,
  }

  return (
    <div className="py-8 lg:py-12">
      <style>{`
        .article-body{color:#2C2F38;font-size:16px;line-height:1.75;overflow-wrap:break-word}
        @media (min-width:640px){.article-body{font-size:17px}}
        .article-body table{display:block;max-width:100%;overflow-x:auto;border-collapse:collapse;margin:1.4em 0;font-size:15px}
        .article-body th,.article-body td{border:1px solid #ECECEF;padding:8px 12px;text-align:left;vertical-align:top}
        .article-body iframe,.article-body video{max-width:100%}
        .article-body pre{max-width:100%;overflow-x:auto}
        .article-body p{margin:0 0 1.15em}
        .article-body h2{font-size:1.45rem;line-height:1.3;font-weight:600;letter-spacing:-.01em;color:#14161C;margin:2em 0 .6em}
        .article-body h3{font-size:1.25rem;font-weight:600;color:#14161C;margin:1.6em 0 .5em}
        .article-body a{color:#F50000;font-weight:500;text-decoration:underline;text-underline-offset:2px}
        .article-body ul,.article-body ol{margin:0 0 1.2em;padding-left:1.3em}
        .article-body li{margin:0 0 .5em}
        .article-body img{border-radius:16px;margin:1.6em 0;max-width:100%;height:auto}
        .article-body blockquote{border-left:3px solid #F50000;margin:1.4em 0;padding:.2em 0 .2em 1.1em;color:#5B5F6B;font-style:italic}
        .article-body h1{display:none}
      `}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="content-container">
        <nav className="flex min-w-0 text-sm text-ui-fg-muted"><Link href="/blogg" className="flex-none hover:text-[#F50000]">Blogg</Link><span className="mx-2 flex-none">/</span><span className="truncate text-ui-fg-subtle">{post.title}</span></nav>
      </div>

      <article className="content-container mt-6 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#F50000]">Guide</p>
        <h1 className="mt-2 text-[1.75rem] sm:text-4xl font-semibold tracking-tight text-[#14161C] leading-[1.15] break-words">{post.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ui-fg-muted">
          <span>{svDate(post.published_at)}</span><span>·</span><span>{readMins(post.body_html)} min läsning</span><span>·</span><span>Teknikhouse</span>
        </div>
        {post.cover_image && (
          <div className="mt-7 overflow-hidden rounded-3xl">
            <img src={post.cover_image} alt={post.title} className="w-full object-cover" />
          </div>
        )}
        <div className="article-body mt-8" dangerouslySetInnerHTML={{ __html: post.body_html || "" }} />

        <div className="mt-12 rounded-3xl bg-gradient-to-br from-[#14161C] to-[#232733] p-6 sm:p-10 text-white">
          <h2 className="text-2xl font-semibold">Behöver du delar eller hjälp?</h2>
          <p className="mt-2 text-white/75 leading-relaxed max-w-xl">Skärmar, batterier, verktyg och tillbehör finns i butiken. Vill du hellre att vi lagar enheten åt dig? Lämna in den hos Phone Rep på Sveavägen 139.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/store" className="rounded-xl bg-[#F50000] px-5 py-3 text-sm font-semibold hover:bg-[#C90000] transition-colors">Till butiken</Link>
            <Link href="/info/salj-din-enhet" className="rounded-xl border border-white/30 px-5 py-3 text-sm font-medium hover:border-white transition-colors">Sälj din enhet</Link>
          </div>
        </div>
      </article>

      {more.length > 0 && (
        <div className="content-container mt-14">
          <h2 className="text-xl font-semibold tracking-tight text-[#14161C]">Fler guider</h2>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {more.map((m) => (
              <Link key={m.slug} href={`/blogg/${m.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-ui-border-base bg-white hover:shadow-[0_14px_38px_rgba(20,22,28,0.09)] hover:-translate-y-0.5 transition-all">
                <div className="aspect-[16/10] overflow-hidden bg-[#F7F7FA]">
                  {m.cover_image ? <img src={m.cover_image} alt={m.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" /> : <div className="flex h-full items-center justify-center text-2xl">✎</div>}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[11px] font-medium text-ui-fg-muted">{svDate(m.published_at)}</p>
                  <h3 className="mt-1.5 text-base font-semibold leading-snug text-[#14161C] group-hover:text-[#F50000] transition-colors line-clamp-2">{m.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
