import { useEffect, useState } from 'react'
import { AccessIcon, ContrastIcon, TypeIcon, PauseIcon, CloseIcon } from './Icons'

const OPTIONS = [
  { key: 'a11y-text', label: 'Larger text', Icon: TypeIcon },
  { key: 'a11y-contrast', label: 'Higher contrast', Icon: ContrastIcon },
  { key: 'a11y-motion', label: 'Stop animations', Icon: PauseIcon },
]

/** Floating accessibility button with a small settings panel. */
export default function Accessibility() {
  const [open, setOpen] = useState(false)
  const [on, setOn] = useState({})

  useEffect(() => {
    const root = document.documentElement
    OPTIONS.forEach(({ key }) => root.classList.toggle(key, !!on[key]))
  }, [on])

  return (
    <div className="fixed bottom-6 right-4 z-[55] sm:right-5">
      {open && (
        <div
          role="dialog"
          aria-label="Accessibility settings"
          className="animate-pop absolute bottom-[58px] right-0 w-[250px] rounded-2xl border border-cream/20 bg-[#17181a] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[14px] font-semibold text-cream">Accessibility</span>
            <button
              type="button"
              aria-label="Close accessibility settings"
              onClick={() => setOpen(false)}
              className="grid h-7 w-7 place-items-center rounded-full text-cream hover:bg-white/10"
            >
              <CloseIcon size={16} />
            </button>
          </div>
          {OPTIONS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              role="switch"
              aria-checked={!!on[key]}
              onClick={() => setOn((s) => ({ ...s, [key]: !s[key] }))}
              className="flex w-full items-center justify-between rounded-xl px-2 py-2.5 text-left text-[14.5px] text-cream transition hover:bg-white/8"
            >
              <span className="flex items-center gap-2.5">
                <Icon size={18} />
                {label}
              </span>
              <span
                className={`relative h-5 w-9 rounded-full transition ${on[key] ? 'bg-neon' : 'bg-white/20'}`}
                aria-hidden="true"
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on[key] ? 'left-[18px] !bg-ink' : 'left-0.5'}`}
                />
              </span>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        aria-label="Accessibility settings"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-[46px] w-[46px] place-items-center rounded-full bg-[#262b4b] text-white shadow-[0_6px_22px_rgba(0,0,0,0.5)] ring-1 ring-white/70 transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
      >
        <AccessIcon size={26} />
      </button>
    </div>
  )
}
