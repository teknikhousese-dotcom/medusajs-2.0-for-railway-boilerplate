import repeat from "@lib/util/repeat"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"

const SkeletonRelatedProducts = () => {
  return (
    <div className="product-page-constraint">
      <div className="mb-5 flex flex-col items-start gap-2 small:mb-8 small:items-center">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-100"></div>
        <div className="h-7 w-56 max-w-full animate-pulse rounded bg-gray-100"></div>
      </div>
      <ul className="grid grid-cols-2 gap-3 small:grid-cols-5 small:gap-5">
        {repeat(5).map((index) => (
          <li key={index}>
            <SkeletonProductPreview />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SkeletonRelatedProducts
