"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

/* teknikhouse gallery: a rounded square frame that shows the whole product
   (no crop). On touch screens the frame is a swipeable, snapping slider with
   dots; thumbnails below scroll sideways instead of wrapping. */
const CSS = `
.thg-track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;scrollbar-width:none;-webkit-overflow-scrolling:touch;height:100%}
.thg-track::-webkit-scrollbar{display:none}
.thg-slide{position:relative;flex:0 0 100%;height:100%;scroll-snap-align:center}
.thg-thumbs{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:2px}
.thg-thumbs::-webkit-scrollbar{display:none}
.thg-nav{position:absolute;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.92);border:1px solid #e6e0da;display:none;align-items:center;justify-content:center;cursor:pointer;color:#1b1714;box-shadow:0 4px 14px -6px rgba(27,23,20,.25)}
.thg-nav:disabled{opacity:.35;cursor:default}
@media(min-width:1024px) and (hover:hover){.thg-nav{display:flex}}
`

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [active, setActive] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbsRef = useRef<HTMLDivElement>(null)
  const list = (images || []).filter((i) => !!i?.url)

  const goTo = useCallback((i: number) => {
    const el = trackRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" })
    setActive(i)
  }, [])

  const onScroll = () => {
    const el = trackRef.current
    if (!el || !el.clientWidth) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== active) setActive(i)
  }

  useEffect(() => {
    const strip = thumbsRef.current
    const t = strip?.children[active] as HTMLElement | undefined
    if (strip && t) {
      const left = t.offsetLeft - strip.clientWidth / 2 + t.clientWidth / 2
      strip.scrollTo({ left, behavior: "smooth" })
    }
  }, [active])

  if (!list.length) return null
  const many = list.length > 1

  return (
    <div className="flex w-full flex-col gap-3">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-ui-border-base bg-ui-bg-subtle">
        <div
          ref={trackRef}
          className="thg-track"
          onScroll={many ? onScroll : undefined}
          aria-roledescription={many ? "bildspel" : undefined}
        >
          {list.map((image, i) => (
            <div key={image.id || i} className="thg-slide" aria-hidden={i !== active}>
              <Image
                src={image.url}
                priority={i === 0}
                loading={i === 0 ? undefined : "lazy"}
                className="mix-blend-multiply"
                alt={"Produktbild " + (i + 1)}
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 600px"
                style={{ objectFit: "contain", padding: "18px" }}
                draggable={false}
              />
            </div>
          ))}
        </div>

        {many && (
          <>
            <button
              type="button"
              className="thg-nav"
              style={{ left: 10 }}
              onClick={() => goTo(Math.max(0, active - 1))}
              disabled={active === 0}
              aria-label="Föregående bild"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button
              type="button"
              className="thg-nav"
              style={{ right: 10 }}
              onClick={() => goTo(Math.min(list.length - 1, active + 1))}
              disabled={active === list.length - 1}
              aria-label="Nästa bild"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
            <div className="pointer-events-none absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 small:hidden">
              {list.map((_, i) => (
                <span
                  key={i}
                  className={
                    "h-1.5 rounded-full transition-all " +
                    (i === active ? "w-4 bg-[#F50000]" : "w-1.5 bg-[#1b1714]/25")
                  }
                />
              ))}
            </div>
            <span className="absolute right-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ui-fg-subtle small:hidden">
              {active + 1}/{list.length}
            </span>
          </>
        )}
      </div>

      {many && (
        <div ref={thumbsRef} className="thg-thumbs">
          {list.map((image, i) => (
            <button
              key={image.id || i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Visa bild ${i + 1}`}
              aria-current={i === active}
              className={
                "relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-xl border bg-ui-bg-subtle transition small:h-[74px] small:w-[74px] " +
                (i === active
                  ? "border-[#F50000] ring-2 ring-[#F50000]/15"
                  : "border-ui-border-base hover:border-ui-border-strong")
              }
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="74px"
                className="mix-blend-multiply"
                style={{ objectFit: "contain", padding: "6px" }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageGallery
