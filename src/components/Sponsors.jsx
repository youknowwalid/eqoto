import { useState } from 'react'
import { Crest } from './Marks'
import { Reveal } from './ui'
import { PauseIcon } from './Icons'
import { sponsors } from '../content'

function Item({ s }) {
  return (
    <li className="flex w-[224px] shrink-0 flex-col items-center px-3 text-center">
      <div className="flex h-[112px] items-center justify-center">
        <Crest kind={s.id} size={100} />
      </div>
      <span className="mt-2.5 text-[16.5px] leading-snug text-cream">{s.name}</span>
    </li>
  )
}

export default function Sponsors() {
  const [paused, setPaused] = useState(false)
  const list = sponsors.list
  return (
    <section aria-labelledby="sponsors-title" className="bg-ink pb-[72px] pt-[74px]">
      <Reveal className="px-4">
        <h2
          id="sponsors-title"
          className="mx-auto max-w-[900px] text-center text-[34px] font-bold leading-[1.04] tracking-[-0.045em] text-cream sm:text-[48px] sm:leading-[50px]"
        >
          {sponsors.title}
        </h2>
      </Reveal>

      <div
        className="group relative mt-[58px] overflow-hidden"
        style={{
          WebkitMaskImage: 'linear-gradient(90deg,transparent 0,#000 6%,#000 94%,transparent 100%)',
          maskImage: 'linear-gradient(90deg,transparent 0,#000 6%,#000 94%,transparent 100%)',
        }}
      >
        <ul
          className="animate-marquee flex w-max"
          style={{ animationPlayState: paused ? 'paused' : undefined }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {list.map((s) => (
            <Item key={s.id} s={s} />
          ))}
          {list.map((s) => (
            <Item key={`${s.id}-copy`} s={s} />
          ))}
        </ul>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          className="inline-flex items-center gap-2 rounded-full border border-cream/25 px-3.5 py-1.5 text-[13px] text-mute transition hover:border-cream/60 hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
        >
          <PauseIcon size={13} />
          {paused ? 'Resume scrolling' : 'Pause scrolling'}
        </button>
      </div>
    </section>
  )
}
