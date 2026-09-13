"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

// teknikhouse gallery: a rounded main frame that shows the whole product (no
// crop) on a soft background, with a thumbnail strip when there are several
// images. Works for every category.
const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [active, setActive] = useState(0)
  if (!images?.length) return null
  const main = images[Math.min(active, images.length - 1)]

  return (
    <div className="flex flex-col gap-3 w-full small:sticky small:top-24">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-ui-border-base bg-ui-bg-subtle">
        {!!main?.url && (
          <Image
            src={main.url}
            priority
            className="absolute inset-0 mix-blend-multiply"
            alt="Produktbild"
            fill
            sizes="(max-width: 768px) 100vw, 560px"
            style={{ objectFit: "contain", padding: "18px" }}
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 flex-wrap">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Bild ${i + 1}`}
              className={
                "relative w-[74px] h-[74px] rounded-xl overflow-hidden border bg-ui-bg-subtle transition " +
                (i === active
                  ? "border-[#F50000] ring-2 ring-[#F50000]/15"
                  : "border-ui-border-base hover:border-ui-border-strong")
              }
            >
              {!!image.url && (
                <Image
                  src={image.url}
                  alt={`Miniatyr ${i + 1}`}
                  fill
                  sizes="74px"
                  className="mix-blend-multiply"
                  style={{ objectFit: "contain", padding: "6px" }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageGallery
