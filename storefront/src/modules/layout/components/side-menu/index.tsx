"use client"

import { Popover, Transition } from "@headlessui/react"
import { XMark } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import { Fragment, useState } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { getStoreName } from "@lib/util/env"

type Cat = HttpTypes.StoreProductCategory

const seg = (child: Cat, parent?: Cat) =>
  parent && parent.handle && child.handle
    ? child.handle.slice(parent.handle.length + 1)
    : child.handle || ""

// Department → outline icon (matched by keywords in the Swedish name).
function DeptIcon({ name }: { name: string }) {
  const n = (name || "").toLowerCase()
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  let path = <><rect x="4" y="4" width="7" height="7" rx="1.5" {...p} /><rect x="13" y="4" width="7" height="7" rx="1.5" {...p} /><rect x="4" y="13" width="7" height="7" rx="1.5" {...p} /><rect x="13" y="13" width="7" height="7" rx="1.5" {...p} /></>
  if (n.includes("reservdel")) path = <><rect x="7" y="2.5" width="10" height="19" rx="2.4" {...p} /><path d="M10.5 18.5h3" {...p} /></>
  else if (n.includes("tillbeh")) path = <><rect x="7" y="2.5" width="10" height="19" rx="2.4" {...p} /><path d="M12 6h.01" {...p} /><path d="M15 2.5l3 3-3 3" {...p} /></>
  else if (n.includes("batteri") || n.includes("powerbank")) path = <><rect x="3" y="8" width="16" height="9" rx="2" {...p} /><path d="M21 11v3" {...p} /><path d="M9 10l-2 3h3l-2 3" {...p} /></>
  else if (n.includes("kabl") || n.includes("laddar")) path = <><path d="M9 3v4M15 3v4" {...p} /><path d="M7 7h10v3.5a5 5 0 01-10 0z" {...p} /><path d="M12 16v5" {...p} /></>
  else if (n.includes("hörlur") || n.includes("högtal") || n.includes("ljud")) path = <><path d="M5 15v-3a7 7 0 0114 0v3" {...p} /><rect x="3" y="14" width="4" height="6" rx="1.6" {...p} /><rect x="17" y="14" width="4" height="6" rx="1.6" {...p} /></>
  else if (n.includes("gaming")) path = <><rect x="3" y="8" width="18" height="9" rx="4" {...p} /><path d="M8 12.5h-2M7 11v3M15 12h.01M17.5 13h.01" {...p} /></>
  else if (n.includes("dator")) path = <><rect x="3" y="5" width="18" height="11" rx="2" {...p} /><path d="M2 20h20" {...p} /></>
  else if (n.includes("surfplatt") || n.includes("mobiler")) path = <><rect x="4" y="3" width="16" height="18" rx="2.4" {...p} /><path d="M10 18h4" {...p} /></>
  else if (n.includes("smartwatch") || n.includes("klock")) path = <><rect x="7" y="7" width="10" height="10" rx="3" {...p} /><path d="M9 7l1-3h4l1 3M9 17l1 3h4l1-3" {...p} /></>
  else if (n.includes("verktyg")) path = <><path d="M14 4l6 6-3 3-6-6z" {...p} /><path d="M11 7L4 14v6h6l7-7" {...p} /></>
  else if (n.includes("reparation")) path = <><path d="M14 6.5a3.5 3.5 0 00-4.6 4.6L4 16.5 7 19l5.4-5.4A3.5 3.5 0 0017 9l-2 2-2-2z" {...p} /></>
  else if (n.includes("outlet") || n.includes("fynd")) path = <><path d="M4 4h7l9 9-7 7-9-9z" {...p} /><circle cx="8.5" cy="8.5" r="1.2" {...p} /></>
  else if (n.includes("hem") || n.includes("fritid")) path = <><path d="M4 11l8-7 8 7" {...p} /><path d="M6 10v9h12v-9" {...p} /></>
  return <svg viewBox="0 0 24 24" width="22" height="22">{path}</svg>
}

const QuickLinks: [string, string][] = [
  ["Hem", "/"],
  ["Alla produkter", "/store"],
  ["Sök", "/search"],
  ["Konto", "/account"],
]

/**
 * Power-style category drawer — light panel with department icons and
 * expandable subcategories (chevron), plus quick links.
 */
const SideMenu = ({
  regions,
  categories,
}: {
  regions: HttpTypes.StoreRegion[] | null
  categories?: HttpTypes.StoreProductCategory[]
}) => {
  const cats = categories || []
  const byParent = new Map<string | null, Cat[]>()
  for (const c of cats) {
    const p = (c.parent_category_id as string) || null
    if (!byParent.has(p)) byParent.set(p, [])
    byParent.get(p)!.push(c)
  }
  const sortRank = (a: Cat, b: Cat) =>
    ((a as any).rank ?? 0) - ((b as any).rank ?? 0) || a.name.localeCompare(b.name, "sv")
  const departments = (byParent.get(null) || []).slice().sort(sortRank)
  const childrenOf = (id: string) => (byParent.get(id) || []).slice().sort(sortRank)

  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  className="relative h-full flex items-center gap-2 transition-all ease-out duration-200 focus:outline-none hover:text-ui-fg-base font-medium"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
                  Meny
                </Popover.Button>
              </div>

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0 -translate-x-2"
                enterTo="opacity-100 translate-x-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-x-0"
                leaveTo="opacity-0 -translate-x-2"
              >
                <Popover.Panel className="flex flex-col absolute w-full sm:w-[380px] h-[calc(100vh-1rem)] z-[60] inset-x-0 sm:inset-x-auto text-sm text-ui-fg-base my-2 sm:ml-0">
                  <div
                    data-testid="nav-menu-popup"
                    className="flex flex-col h-full bg-white rounded-rounded border border-ui-border-base shadow-2xl justify-between overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-ui-border-base">
                      <span className="text-base font-semibold">Kategorier</span>
                      <button type="button" data-testid="close-menu-button" onClick={close} aria-label="Stäng meny" className="text-ui-fg-subtle hover:text-ui-fg-base">
                        <XMark />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      <ul>
                        {departments.map((dep) => {
                          const kids = childrenOf(dep.id)
                          const depHref = `/${dep.handle}`
                          const isOpen = expanded === dep.id
                          return (
                            <li key={dep.id} className="border-b border-ui-border-base">
                              <div className="flex items-center">
                                <LocalizedClientLink
                                  href={depHref}
                                  onClick={close}
                                  className="flex flex-1 items-center gap-3 px-5 py-3.5 hover:bg-ui-bg-subtle"
                                >
                                  <span className="text-ui-fg-base">
                                    <DeptIcon name={dep.name} />
                                  </span>
                                  <span className="font-medium">{dep.name}</span>
                                </LocalizedClientLink>
                                {kids.length > 0 && (
                                  <button
                                    type="button"
                                    aria-label={isOpen ? "Dölj" : "Visa"}
                                    onClick={() => setExpanded(isOpen ? null : dep.id)}
                                    className="px-4 self-stretch text-ui-fg-subtle hover:text-[#F50000]"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={"transition-transform " + (isOpen ? "rotate-90" : "")}><path d="M9 6l6 6-6 6" /></svg>
                                  </button>
                                )}
                              </div>
                              {isOpen && kids.length > 0 && (
                                <ul className="bg-ui-bg-subtle pb-2">
                                  {kids.map((k) => (
                                    <li key={k.id}>
                                      <LocalizedClientLink
                                        href={`${depHref}/${seg(k, dep)}`}
                                        onClick={close}
                                        className="block pl-14 pr-5 py-2 text-ui-fg-subtle hover:text-[#F50000]"
                                      >
                                        {k.name}
                                      </LocalizedClientLink>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          )
                        })}
                      </ul>

                      <div className="px-5 py-4 border-t border-ui-border-base">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-ui-fg-muted mb-2">Genvägar</div>
                        <ul className="flex flex-col gap-1.5">
                          {QuickLinks.map(([name, href]) => (
                            <li key={name}>
                              <LocalizedClientLink href={href} onClick={close} className="block py-1 text-ui-fg-subtle hover:text-ui-fg-base">
                                {name}
                              </LocalizedClientLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="px-5 py-3 border-t border-ui-border-base">
                      <Text className="txt-compact-small text-ui-fg-muted">
                        © {new Date().getFullYear()} {getStoreName()}
                      </Text>
                    </div>
                  </div>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
