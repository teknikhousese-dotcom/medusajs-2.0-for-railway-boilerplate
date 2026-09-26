/*
 * Hämta i butik: titel och text exakt som i Wiki (Fraktinställningar,
 * "Hämta hos oss"), med vanliga bindestreck.
 */

export const PICKUP_TITLE = "Hämta hos oss"

export const PICKUP_DESCRIPTION =
  "Hämta din beställning i vår butik på Sveavägen, Stockholm. Vi meddelar dig så snart din order är redo för upphämtning. Öppettider: Mån-Fre 11:00-16:00."

export function isPickupName(name?: string | null): boolean {
  const n = String(name || "").toLowerCase()
  return n.includes("hämta") || n.includes("hamta") || n.includes("butik")
}
