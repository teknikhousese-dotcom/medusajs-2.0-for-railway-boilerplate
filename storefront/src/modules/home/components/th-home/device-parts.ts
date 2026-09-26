/*
   Delar-typer för enhetsväljaren på startsidan ("Hitta rätt del").
   Kategoriträdet har inga undergrupper per deltyp (modell -> produkter direkt),
   så typen läses ut ur produktens titel. Används både på servern (antal per
   modell) och i klienten (filtrering av förhandsvisningen).
 */

export const PART_TYPES = [
  { k: "skarm", n: "Skärm" },
  { k: "batteri", n: "Batteri" },
  { k: "baksida", n: "Baksida" },
  { k: "kamera", n: "Kamera" },
  { k: "laddkontakt", n: "Laddkontakt" },
  { k: "ljud", n: "Högtalare" },
  { k: "knappar", n: "Knappar & flex" },
  { k: "tejp", n: "Tejp & lim" },
  { k: "ovrigt", n: "Övrigt" },
] as const

export type PartKey = (typeof PART_TYPES)[number]["k"]

const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g")
export const foldText = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(DIACRITICS, "")

export function partIndexOf(title: string): number {
  const t = foldText(title)
  if (/tejp for|batteritejp|limtejp|\blim\b|\b[bt]-?[5-9]000\b/.test(t)) return 7
  if (/skarm|display|\blcd\b|oled|digitizer|touchglas/.test(t) && !/skarmskydd/.test(t)) return 0
  if (/baksida|batterilucka|bakstycke|mellanram|chassi/.test(t)) return 2
  if (/batteri/.test(t)) return 1
  if (/kamera|lins/.test(t)) return 3
  if (/laddkontakt|laddport|laddningsport|laddningskontakt|usb|lightning/.test(t)) return 4
  if (/hogtalare|mikrofon|horlursuttag|horlurs|summer|ljud/.test(t)) return 5
  if (/knapp|flex|antenn|sensor|vibrat|taptic|simkort|home|face ?id|touch ?id|nfc|wifi|bluetooth|moderkort/.test(t)) return 6
  return 8
}
