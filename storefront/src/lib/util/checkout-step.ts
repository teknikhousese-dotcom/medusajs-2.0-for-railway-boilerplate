/*
 * Kassans steg med svenska adresser: /kassa?steg=leverans | betalning | adress | granska.
 * Gamla engelska värden (?step=delivery | payment | address | review) läses fortfarande,
 * så gamla länkar och bokmärken fungerar. Middleware skickar /checkout vidare till /kassa.
 */

export type CheckoutSteg = "leverans" | "betalning" | "adress" | "granska"

export const CHECKOUT_PATH = "/checkout"

/* false: länkar skrivs i gamla formatet (övergång), true: /kassa?steg=... */
const SWEDISH_URLS = false

const LEGACY_TO_SV: Record<string, CheckoutSteg> = {
  delivery: "leverans",
  payment: "betalning",
  address: "adress",
  review: "granska",
}

const SV_TO_LEGACY: Record<CheckoutSteg, string> = {
  leverans: "delivery",
  betalning: "payment",
  adress: "address",
  granska: "review",
}

const VALID: string[] = ["leverans", "betalning", "adress", "granska"]

export function normalizeSteg(value?: string | null): CheckoutSteg | "" {
  const v = String(value || "").trim().toLowerCase()
  if (VALID.includes(v)) return v as CheckoutSteg
  return LEGACY_TO_SV[v] || ""
}

type ParamReader = { get(name: string): string | null }

export function readSteg(params?: ParamReader | null): CheckoutSteg | "" {
  if (!params) return ""
  return normalizeSteg(params.get("steg") || params.get("step"))
}

export function checkoutHref(steg: CheckoutSteg): string {
  if (SWEDISH_URLS) return CHECKOUT_PATH + "?steg=" + steg
  return CHECKOUT_PATH + "?step=" + SV_TO_LEGACY[steg]
}
