"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

// teknikhouse-style gallery: a constrained main image (shows the WHOLE product,
// no crop, white background) with a thumbnail strip when there are several images.
const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [active, setActive] = useState(0)
  if (!images?.length) return null
  const main = images[Math.min(active, images.length - 1)]

  return (
    <div className="flex flex-col gap-4 w-full small:max-w-[560px] mx-auto">
      <div className="relative aspect-square w-full overflow-hidden rounded-rounded border border-ui-border-base bg-white">
        {!!main?.url && (
          <Image
            src={main.url}
            priority
            className="absolute inset-0"
            alt="Produktbild"
            fill
            sizes="(max-width: 768px) 100vw, 560px"
            style={{ objectFit: "contain", padding: "12px" }}
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Bild ${i + 1}`}
              className={
                "relative w-16 h-16 rounded-md overflow-hidden border bg-white " +
                (i === active ? "border-ui-fg-base" : "border-ui-border-base hover:border-ui-fg-subtle")
              }
            >
              {!!image.url && (
                <Image
                  src={image.url}
                  alt={`Miniatyr ${i + 1}`}
                  fill
                  sizes="64px"
                  style={{ objectFit: "contain", padding: "4px" }}
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
