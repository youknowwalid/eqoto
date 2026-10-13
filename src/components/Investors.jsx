import { useEffect, useRef, useState } from 'react'
import Portrait from './Portrait'
import { Reveal, SectionTitle, PillButton, useMediaQuery } from './ui'
import { CheckIcon } from './Icons'
import { investors } from '../content'

function Verified() {
  return (
    <span
      className="ml-2 inline-grid h-[15px] w-[15px] translate-y-[-1px] place-items-center rounded-full bg-neon text-ink"
      title="Verified investor"
    >
      <CheckIcon size={10} strokeWidth={3.6} />
      <span className="sr-only">Verified</span>
    </span>
  )
}

function InvestorCard({ person, index }) {
  return (
    <article className="group relative h-[442px] overflow-hidden rounded-2xl border border-cream/25 bg-[#161714] transition duration-300 hover:border-neon/60">
      <Portrait
        look={person.look}
        seed={index * 13 + 5}
        title={`Illustrated portrait of ${person.name}`}
        className="absolute inset-0 h-full w-full transition duration-700 group-hover:scale-[1.03]"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(16,17,14,0) 38%, rgba(16,17,14,0.72) 58%, rgba(22,23,20,0.97) 78%)',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="text-[22px] font-semibold leading-tight tracking-[-0.03em] text-cream">
          {person.name}
          <Verified />
        </h3>
        <p className="mt-1.5 line-clamp-2 min-h-[2.8em] text-[15px] leading-[1.4] text-cream/95">{person.bio}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-cream/20 bg-[#1b1c1a]/95 px-4 py-2.5">
            <div className="text-[22px] font-semibold leading-tight tracking-[-0.03em] text-neon">{person.ret}</div>
            <div className="text-[14px] text-cream/90">Return (24M)</div>
          </div>
          <div className="rounded-xl border border-cream/20 bg-[#1b1c1a]/95 px-4 py-2.5">
            <div className="text-[22px] font-semibold leading-tight tracking-[-0.03em] text-neon">{person.followers}</div>
            <div className="text-[14px] text-cream/90">Followers</div>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function Investors() {
  const list = investors.list
  const isLg = useMediaQuery('(min-width: 1024px)')
  const isMd = useMediaQuery('(min-width: 640px)')
  const visible = isLg ? 3 : isMd ? 2 : 1
  const steps = list.length - visible + 1
  const [index, setIndex] = useState(0)
  const touch = useRef(null)
  const safe = Math.min(index, steps - 1)

  useEffect(() => {
    setIndex((i) => Math.min(i, steps - 1))
  }, [steps])

  const go = (i) => setIndex(Math.max(0, Math.min(steps - 1, i)))

  return (
    <section id="community" className="bg-ink px-4 pb-14 pt-14 sm:px-6 sm:pt-16">
      <Reveal>
        <SectionTitle>{investors.title}</SectionTitle>
        <p className="mx-auto mt-3 max-w-[790px] text-center text-[16.5px] leading-[1.45] text-cream sm:text-[18px]">
          {investors.text}
        </p>
      </Reveal>

      <div className="mx-auto mt-9 max-w-[1184px]">
        <div
          className="overflow-hidden"
          onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touch.current == null) return
            const dx = e.changedTouches[0].clientX - touch.current
            if (Math.abs(dx) > 40) go(safe + (dx < 0 ? 1 : -1))
            touch.current = null
          }}
          role="group"
          aria-roledescription="carousel"
          aria-label="Featured investors"
        >
          <div
            className="-mx-3 flex transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `translateX(-${(safe * 100) / visible}%)` }}
          >
            {list.map((p, i) => (
              <div
                key={p.name}
                className="shrink-0 px-3"
                style={{ width: `${100 / visible}%` }}
                aria-hidden={i < safe || i >= safe + visible}
              >
                <InvestorCard person={p} index={i} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2" role="tablist" aria-label="Carousel position">
          {Array.from({ length: steps }).map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === safe}
              aria-label={`Show investors ${i + 1} to ${i + visible}`}
              onClick={() => go(i)}
              className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon ${
                i === safe ? 'w-10 bg-cream' : 'w-2 bg-cream/30 hover:bg-cream/60'
              }`}
            />
          ))}
        </div>

        <p className="mt-6 flex items-start gap-2 text-[14.5px] text-cream sm:items-center">
          <span className="mt-[5px] block h-3 w-3 shrink-0 rounded-full bg-neon sm:mt-0" aria-hidden="true" />
          {investors.note}
        </p>

        <div className="mt-6 text-center">
          <PillButton>{investors.cta}</PillButton>
        </div>
      </div>
    </section>
  )
}
