"use client"

import { deleteLineItem } from "@lib/data/cart"
import { Spinner, Trash } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

/*
 * Next 15 regenerates Server Action ids on every build. A tab that was opened
 * before a deploy still posts the old id, the server answers 404
 * (x-nextjs-action-not-found) and the action promise rejects without the
 * request ever reaching Medusa. That used to be swallowed here, so the trash
 * button looked dead. Reload once to pick up the current build instead.
 */
export const isStaleActionError = (err: unknown) => {
  const msg = String((err as any)?.message || err || "")
  return /server action/i.test(msg) || /not found on the server/i.test(msg) || /failed to fetch/i.test(msg)
}

const DeleteButton = ({
  id,
  children,
  className,
  "data-testid": dataTestId,
}: {
  id: string
  children?: React.ReactNode
  className?: string
  "data-testid"?: string
}) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [, startTransition] = useTransition()

  const handleDelete = async (id: string) => {
    setError(null)
    setIsDeleting(true)
    await deleteLineItem(id)
      .then(() => {
        /* Belt and braces on top of the scoped cache tag the action */
        /* revalidates. See the note in product-actions. */
        startTransition(() => router.refresh())
      })
      .catch((err) => {
        if (isStaleActionError(err) && typeof window !== "undefined") {
          window.location.reload()
          return
        }
        setIsDeleting(false)
        setError("Kunde inte ta bort varan. Ladda om sidan och försök igen.")
        startTransition(() => router.refresh())
      })
  }

  return (
    <div
      className={clx(
        "flex items-center justify-between text-small-regular",
        className
      )}
    >
      <button
        type="button"
        className="flex gap-x-1 text-ui-fg-subtle hover:text-ui-fg-base cursor-pointer"
        onClick={() => handleDelete(id)}
        disabled={isDeleting}
        /* On the cart page this button has no visible text, so without a label */
        /* it is announced as just "button" and cannot be identified. */
        aria-label={children ? undefined : "Remove item from cart"}
        data-testid={dataTestId}
      >
        {isDeleting ? <Spinner className="animate-spin" /> : <Trash />}
        {children ? <span>{children}</span> : null}
      </button>
      {error ? (
        <span className="text-rose-500 text-xsmall-regular ml-2" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}

export default DeleteButton
