type MenuCat = {
  id: string
  parent_category_id?: string | null
  metadata?: Record<string, unknown> | null
}

// Varugrupper med metadata.hide_in_menu = "1" (kryssrutan "Dolj i menyerna" i
// adminens Hantera Varugrupper) visas inte i toppmenyn, mega-menyn eller mobilmenyn.
// Sidan och alla lankar till den fungerar som vanligt. Underkategorier doljs ocksa.
export function isHiddenInMenu(c: MenuCat | null | undefined): boolean {
  const v = c && c.metadata ? (c.metadata as Record<string, unknown>).hide_in_menu : undefined
  return v === "1" || v === 1 || v === true || v === "true"
}

export function hideFromMenu<T extends MenuCat>(cats: T[] | null | undefined): T[] {
  const list = cats || []
  const hidden = new Set<string>()
  for (const c of list) if (isHiddenInMenu(c)) hidden.add(c.id)
  if (!hidden.size) return list
  const byId = new Map<string, T>()
  for (const c of list) byId.set(c.id, c)
  const underHidden = (c: T): boolean => {
    let pid = c.parent_category_id || null
    let guard = 0
    while (pid && guard < 10) {
      if (hidden.has(pid)) return true
      const p = byId.get(pid)
      pid = p ? p.parent_category_id || null : null
      guard++
    }
    return false
  }
  return list.filter((c) => !hidden.has(c.id) && !underHidden(c))
}
