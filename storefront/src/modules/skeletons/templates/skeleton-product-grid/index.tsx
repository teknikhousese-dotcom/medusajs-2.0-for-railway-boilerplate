import repeat from "@lib/util/repeat"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"

const SkeletonProductGrid = () => {
  return (
    <ul className="grid w-full flex-1 grid-cols-2 min-[768px]:grid-cols-3 medium:grid-cols-4 large:grid-cols-5 gap-3 min-[768px]:gap-4 medium:gap-5" data-testid="products-list-loader">
      {repeat(8).map((index) => (
        <li key={index}>
          <SkeletonProductPreview />
        </li>
      ))}
    </ul>
  )
}

export default SkeletonProductGrid
