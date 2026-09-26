import { Container } from "@medusajs/ui"

/* Matches the real product card (square image, title, stock, price) so the
   grid does not jump when products load. */
const SkeletonProductPreview = () => {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-ui-border-base bg-white small:rounded-2xl">
      <Container className="aspect-square w-full rounded-none bg-ui-bg-subtle p-0 shadow-none" />
      <div className="flex flex-col gap-2 p-3 small:p-4">
        <div className="h-3.5 w-11/12 rounded bg-gray-100"></div>
        <div className="h-3.5 w-3/5 rounded bg-gray-100"></div>
        <div className="h-3 w-1/3 rounded bg-gray-100"></div>
        <div className="mt-1 flex items-center justify-between">
          <div className="h-5 w-2/5 rounded bg-gray-100"></div>
          <div className="h-8 w-8 rounded-full bg-gray-100"></div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonProductPreview
