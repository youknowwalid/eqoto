import { useEffect, useRef, useState } from 'react'
import Logo from './Logo'
import { PillButton } from './ui'
import { SearchIcon, GlobeIcon, ChevronDownIcon, MenuIcon, CloseIcon } from './Icons'
import { announcement, nav, languages } from '../content'

export function AnnouncementBar() {
  return (
    <div className="bg-banner px-4 py-[11px] text-center text-[12.5px] leading-snug text-cream sm:text-[13px]">
      {announcement}
    </div>
  )
}

function DesktopMenu({ item, open, onToggle, onOpen, onClose }) {
  return (
    <li className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex h-[72px] items-center gap-1.5 text-[17px] text-cream transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-neon"
      >
        {item.label}
        <ChevronDownIcon size={17} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div
        className={`absolute left-[-14px] top-full z-50 w-[230px] origin-top rounded-2xl border border-cream/15 bg-[#17181a] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.55)] transition duration-150 ${
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'
        }`}
      >
        {item.items.map((label) => (
          <a
            key={label}
            href="#"
            tabIndex={open ? 0 : -1}
            className="block rounded-xl px-4 py-2.5 text-[15.5px] text-cream transition hover:bg-white/8 hover:text-neon focus-visible:bg-white/8 focus-visible:text-neon focus-visible:outline-none"
          >
            {label}
          </a>
        ))}
      </div>
    </li>
  )
}

export default function Header() {
  const [openIdx, setOpenIdx] = useState(-1)
  const [searchOpen, setSearchOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [lang, setLang] = useState('EN')
  const [drawer, setDrawer] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(-1)
  const wrapRef = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpenIdx(-1)
        setLangOpen(false)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpenIdx(-1)
        setLangOpen(false)
        setSearchOpen(false)
        setDrawer(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus()
  }, [searchOpen])

  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawer])

  return (
    <header ref={wrapRef} className="sticky top-0 z-50 bg-black">
      <div className="mx-auto flex h-[72px] max-w-[1376px] items-center justify-between px-4 sm:px-6 xl:px-0">
        {/* left: logo + menus */}
        <div className="flex items-center gap-8 xl:gap-10">
          <Logo />
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-7 xl:gap-8">
              {nav.map((item, i) => (
                <DesktopMenu
                  key={item.label}
                  item={item}
                  open={openIdx === i}
                  onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
                  onOpen={() => setOpenIdx(i)}
                  onClose={() => setOpenIdx(-1)}
                />
              ))}
            </ul>
          </nav>
        </div>

        {/* right: tools */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative hidden items-center lg:flex">
            <div
              className={`overflow-hidden transition-all duration-300 ${searchOpen ? 'mr-2 w-[220px] opacity-100' : 'w-0 opacity-0'}`}
            >
              <input
                ref={searchRef}
                type="search"
                placeholder="Search markets, people…"
                aria-label="Search"
                tabIndex={searchOpen ? 0 : -1}
                className="h-9 w-full rounded-full border border-cream/30 bg-[#17181a] px-4 text-[14.5px] text-cream placeholder:text-mute focus:border-neon focus:outline-none"
              />
            </div>
            <button
              type="button"
              aria-label={searchOpen ? 'Close search' : 'Open search'}
              onClick={() => setSearchOpen((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-full text-cream transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-neon"
            >
              {searchOpen ? <CloseIcon size={19} /> : <SearchIcon size={21} />}
            </button>
            <span className="mx-3 h-5 w-px bg-cream/25" />
            <div className="relative">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={langOpen}
                onClick={() => setLangOpen((v) => !v)}
                className="flex h-9 items-center gap-2 rounded-full px-2 text-[17px] text-cream transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-neon"
              >
                <GlobeIcon size={21} />
                {lang}
              </button>
              {langOpen && (
                <ul
                  role="listbox"
                  aria-label="Language"
                  className="absolute right-0 top-[calc(100%+8px)] z-50 grid w-[132px] grid-cols-2 gap-1 rounded-2xl border border-cream/15 bg-[#17181a] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
                >
                  {languages.map((l) => (
                    <li key={l}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={l === lang}
                        onClick={() => {
                          setLang(l)
                          setLangOpen(false)
                        }}
                        className={`w-full rounded-lg px-3 py-1.5 text-left text-[14.5px] transition hover:bg-white/10 ${
                          l === lang ? 'text-neon' : 'text-cream'
                        }`}
                      >
                        {l}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <a
            href="/login"
            className="hidden h-[34px] items-center rounded-full border-[1.5px] border-cream/90 px-6 text-[17px] font-medium text-cream transition hover:bg-cream hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon sm:inline-flex"
          >
            Log in
          </a>
          <PillButton size="sm" className="!px-4 sm:!px-6">
            Start Investing
          </PillButton>
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawer(true)}
            className="grid h-10 w-10 place-items-center rounded-full text-cream transition hover:bg-white/10 lg:hidden"
          >
            <MenuIcon size={24} />
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden ${drawer ? 'visible' : 'invisible'}`}
        aria-hidden={!drawer}
      >
        <div
          className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ${drawer ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setDrawer(false)}
        />
        <aside
          className={`absolute right-0 top-0 flex h-full w-[min(86vw,360px)] flex-col bg-[#0d0e0c] p-5 transition-transform duration-300 ${
            drawer ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between">
            <Logo />
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawer(false)}
              className="grid h-10 w-10 place-items-center rounded-full text-cream hover:bg-white/10"
            >
              <CloseIcon size={24} />
            </button>
          </div>
          <div className="mt-6 flex-1 overflow-y-auto">
            {nav.map((item, i) => (
              <div key={item.label} className="border-b border-cream/10">
                <button
                  type="button"
                  aria-expanded={mobileOpen === i}
                  onClick={() => setMobileOpen(mobileOpen === i ? -1 : i)}
                  className="flex w-full items-center justify-between py-4 text-[18px] text-cream"
                >
                  {item.label}
                  <ChevronDownIcon size={20} className={`transition-transform ${mobileOpen === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`grid transition-all duration-300 ${mobileOpen === i ? 'grid-rows-[1fr] pb-3' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    {item.items.map((l) => (
                      <a key={l} href="#" className="block py-2 pl-3 text-[16px] text-mute hover:text-neon">
                        {l}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-3">
            <a
              href="/login"
              className="inline-flex h-11 flex-1 items-center justify-center rounded-full border-[1.5px] border-cream/90 text-[16px] font-medium text-cream"
            >
              Log in
            </a>
            <PillButton className="!h-11 flex-1">Start Investing</PillButton>
          </div>
        </aside>
      </div>
    </header>
  )
}
