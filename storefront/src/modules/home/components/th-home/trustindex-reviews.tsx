"use client"

import { useEffect, useRef } from "react"

// Omdömen om Teknikhouse.se från Trustindex. De senaste omdömena med 4 eller
// 5 stjärnor hämtas live på servern av trustindex-data.ts (cache 6 timmar).
// REVIEWS nedan är reservlistan som visas om hämtningen misslyckas. Källa:
// (https://www.trustindex.io/reviews/teknikhouse.se). Texterna är ordagranna,
// ibland förkortade med "…". Namn visas som förnamn och initial.
// Karusellen rullar långsamt från höger till vänster, pausar vid hover,
// fokus och touch, går att svepa och står still vid prefers-reduced-motion.

export type Review = {
  name: string
  date: string
  source: "Google" | "Trustindex"
  stars: number
  text: string
}

const REVIEWS: Review[] = [
  { name: "Melkurius", date: "22 juli 2025", source: "Trustindex", stars: 5, text: "Perfekt! Allt 100%. Hypersnabb leverans. … Jag beställde 21/7 och hade varan hemma nästa dag, på mindre än 24 timmar. Grymt imponerad!" },
  { name: "Kent S.", date: "17 okt 2024", source: "Trustindex", stars: 5, text: "Snabb leverans. Inget tjafs vid reklamation. Trevligt bemötande vid kontakt." },
  { name: "Gabriella S.", date: "10 okt 2023", source: "Google", stars: 5, text: "Fick hem en vara som slutade fungera efter 2 dagar. Skickade ett mail och de ringde upp efter ca 15 min och meddelade att de skulle skicka en ny. Snabb återkoppling och trevligt bemötande!" },
  { name: "Claudia K.", date: "13 sep 2023", source: "Trustindex", stars: 5, text: "Hit återkommer man gärna! Lätt att hitta det man sökte och snabb leverans 👍" },
  { name: "Erik G.", date: "2 jan 2024", source: "Trustindex", stars: 5, text: "Snabb leverans, och jag fick det jag beställde … Batteriet till min iPhone 6 var i utmärkt skick, tog två dygn att gå under 100% i standbyläge." },
  { name: "Matin Z.", date: "1 nov 2023", source: "Trustindex", stars: 5, text: "Got an iPhone screen taken from a new iPhone. Arrived in a perfect condition and original packaging and sealing! … Very impressed!" },
  { name: "Lennart", date: "2 dec 2023", source: "Trustindex", stars: 5, text: "Bra pris, kvalitet o snabb lev." },
  { name: "Jan Krister B.", date: "2 jan 2024", source: "Trustindex", stars: 5, text: "Mitt köp gick mycket enkelt samt snabb perfekt leverans !!" },
  { name: "Christian A.", date: "4 jan 2024", source: "Trustindex", stars: 5, text: "Alltid snabba och smidiga leveranser." },
  { name: "Anders", date: "3 nov 2023", source: "Trustindex", stars: 5, text: "Snabbt enkelt och information tiptop." },
  { name: "David S.", date: "10 jan 2024", source: "Trustindex", stars: 5, text: "Snabb leverans av utlovad vara. … allt kom fram på bra sätt." },
  { name: "Suzanne C.", date: "11 okt 2023", source: "Trustindex", stars: 5, text: "Snabb leverans av en bra vara." },
  { name: "Jerker S.", date: "6 feb 2024", source: "Trustindex", stars: 5, text: "Nöjd! Telefonen funkar kabel kom snabbt nöjd" },
  { name: "Emil J.", date: "6 nov 2023", source: "Trustindex", stars: 5, text: "Supersnabb leverans." },
]

const SPEED = 34

function Card({ r, hidden }: { r: Review; hidden?: boolean }) {
  return (
    <figure className="ticard" aria-hidden={hidden ? true : undefined}>
      <div className="stars" role="img" aria-label={r.stars + " av 5 stjärnor"}>{"★".repeat(r.stars)}</div>
      <blockquote>{r.text}</blockquote>
      <figcaption className="who">
        <span>{r.name}</span>
        <span className="src">{r.date} · {r.source}</span>
      </figcaption>
    </figure>
  )
}

export default function TrustindexReviews({ reviews }: { reviews?: Review[] }) {
  const list = reviews && reviews.length >= 6 ? reviews : REVIEWS
  const ref = useRef<HTMLDivElement>(null)
  const api = useRef<{ nudge: (dir: number) => void }>({ nudge: () => {} })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let raf = 0
    let last = 0
    let pos = el.scrollLeft
    let paused = reduce
    let timer: ReturnType<typeof setTimeout> | null = null

    const loopWidth = () => {
      const first = el.querySelector<HTMLElement>("[data-set='a'] .ticard")
      const dup = el.querySelector<HTMLElement>("[data-set='b'] .ticard")
      if (!first || !dup) return 0
      return dup.offsetLeft - first.offsetLeft
    }
    const pause = () => {
      paused = true
      if (timer) clearTimeout(timer)
      timer = null
    }
    const resume = (delay: number) => {
      if (reduce) return
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        pos = el.scrollLeft
        paused = false
      }, delay)
    }
    const step = (t: number) => {
      const dt = last ? Math.min(64, t - last) : 16
      last = t
      if (!paused && !document.hidden) {
        pos += (SPEED * dt) / 1000
        const lw = loopWidth()
        if (lw > 0 && pos >= lw) pos -= lw
        el.scrollLeft = pos
      }
      raf = requestAnimationFrame(step)
    }

    const onEnter = () => pause()
    const onLeave = () => resume(400)
    const onTouchStart = () => pause()
    const onTouchEnd = () => resume(2500)
    const onFocusIn = () => pause()
    const onFocusOut = () => resume(800)
    const onWheel = () => {
      pause()
      resume(2500)
    }

    api.current.nudge = (dir: number) => {
      pause()
      const card = el.querySelector<HTMLElement>(".ticard")
      const w = card ? card.offsetWidth + 16 : 300
      el.scrollBy({ left: dir * w, behavior: reduce ? "auto" : "smooth" })
      resume(3000)
    }

    el.addEventListener("mouseenter", onEnter)
    el.addEventListener("mouseleave", onLeave)
    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchend", onTouchEnd, { passive: true })
    el.addEventListener("focusin", onFocusIn)
    el.addEventListener("focusout", onFocusOut)
    el.addEventListener("wheel", onWheel, { passive: true })
    if (!reduce) raf = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(raf)
      if (timer) clearTimeout(timer)
      el.removeEventListener("mouseenter", onEnter)
      el.removeEventListener("mouseleave", onLeave)
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchend", onTouchEnd)
      el.removeEventListener("focusin", onFocusIn)
      el.removeEventListener("focusout", onFocusOut)
      el.removeEventListener("wheel", onWheel)
    }
  }, [])

  return (
    <div className="tiwrap">
      <div className="tiscroll" ref={ref} role="region" aria-label="Kundomdömen från Trustindex" tabIndex={0}>
        <div className="titrack">
          <div className="tiset" data-set="a">
            {list.map((r, i) => (
              <Card key={"a" + i} r={r} />
            ))}
          </div>
          <div className="tiset" data-set="b" aria-hidden="true">
            {list.map((r, i) => (
              <Card key={"b" + i} r={r} hidden />
            ))}
          </div>
        </div>
      </div>
      <button type="button" className="tinav prev" aria-label="Föregående omdöme" onClick={() => api.current.nudge(-1)}>‹</button>
      <button type="button" className="tinav next" aria-label="Nästa omdöme" onClick={() => api.current.nudge(1)}>›</button>
    </div>
  )
}
