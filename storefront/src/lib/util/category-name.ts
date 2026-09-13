// Display-name normaliser for category names.
// Some imported brand categories are stored ALL-CAPS ("APPLE", "SONY XPERIA");
// teknikhouse shows proper case ("Apple", "Sony Xperia"). This fixes the
// display everywhere without touching the data. Non-all-caps names (models,
// departments) pass through unchanged.

const BRAND_NAME: Record<string, string> = {
  apple: "Apple",
  samsung: "Samsung",
  google: "Google",
  huawei: "Huawei",
  xiaomi: "Xiaomi",
  oneplus: "OnePlus",
  "sony-xperia": "Sony Xperia",
  motorola: "Motorola",
  lg: "LG",
  htc: "HTC",
  nokia: "Nokia",
  asus: "ASUS",
  "ovriga-tillverkare": "Övriga tillverkare",
}

export function niceCategoryName(name?: string | null, slug?: string | null): string {
  if (slug && BRAND_NAME[slug]) return BRAND_NAME[slug]
  const s = (name || "").trim()
  // All-caps (has uppercase, no lowercase) -> title-case, keeping short acronyms.
  if (s && /[A-ZÅÄÖ]/.test(s) && !/[a-zåäö]/.test(s)) {
    return s
      .toLowerCase()
      .split(/\s+/)
      .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
      .join(" ")
  }
  return s
}
