"use client"

import FilterRadioGroup from "@modules/common/components/filter-radio-group"

export type SortOptions =
  | "recommended"
  | "title"
  | "price_asc"
  | "price_desc"
  | "created_at"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
}

const sortOptions = [
  { value: "recommended", label: "Rekommenderad" },
  { value: "title", label: "Namn" },
  { value: "price_asc", label: "Pris: Lågt till högt" },
  { value: "price_desc", label: "Pris: Högt till lågt" },
  { value: "created_at", label: "Senast inlagd" },
]

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  const handleChange = (value: SortOptions) => {
    setQueryParams("sortBy", value)
  }

  return (
    <FilterRadioGroup
      title="Sortera efter"
      items={sortOptions}
      value={sortBy}
      handleChange={handleChange}
      data-testid={dataTestId}
    />
  )
}

export default SortProducts
