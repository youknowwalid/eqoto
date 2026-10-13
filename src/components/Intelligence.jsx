import { useState } from 'react'
import { CityScene } from './Scenes'
import { Reveal, DotList } from './ui'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'
import { intelligence } from '../content'

/* The slanted app cards under the city picture */
function CardStrip({ slide }) {
  const handles = ['@northfield', '@chronicle', '@kestrel']
  return (
    <div
      className="relative h-full overflow-hidden"
      style={{ background: 'linear-gradient(180deg,#303c3b 0%,#222a2b 100%)' }}
    >
      {slide.cards.map((c, i) => (
        <div
          key={c}
          className="animate-pop absolute rounded-[16px] border border-white/10 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
          style={{
            width: '33%',
            height: '78%',
            left: `${-4 + i * 34}%`,
            top: `${8 + i * 7}%`,
            background: 'linear-gradient(145deg,#3b4a47,#2c3735)',
            transform: 'perspective(700px) rotateX(22deg) rotateZ(20deg)',
            animationDelay: `${i * 70}ms`,
          }}
        >
          <div className="text-[13px] font-bold leading-tight tracking-tight text-cream">{c}</div>
          <div className="mt-1 text-[8px] leading-snug text-mute">{slide.blurbs[i]}</div>
          <div className="mt-2 text-[7px] text-neon/80">Built by {handles[i]}</div>
        </div>
      ))}
    </div>
  )
}

export default function Intelligence() {
  const [i, setI] = useState(0)
  const slides = intelligence.slides
  const slide = slides[i]
  const prev = () => setI((i + slides.length - 1) % slides.length)
  const next = () => setI((i + 1) % slides.length)

  return (
    <>
      <section
        id="intelligence"
        className="bg-moss px-4 py-12 sm:px-6"
        aria-roledescription="carousel"
        aria-label="Intelligence features"
      >
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_588px] lg:gap-8">
          <Reveal>
            <div key={i} className="animate-pop" aria-live="polite">
              <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.035em] text-cream sm:text-[34px]">
                {slide.title}
              </h2>
              <DotList items={slide.bullets} className="mt-2" textClass="text-[16.5px] sm:text-[18px]" />
            </div>

            {/* the button has a little green "ledge" behind it, like a folder tab */}
            <div className="relative mt-6 inline-block">
              <span
                className="absolute -top-[10px] left-0 h-[30px] w-[271px] max-w-[88vw] rounded-t-[20px] rounded-br-[6px] bg-neon"
                aria-hidden="true"
              />
              <a
                href="#get-the-app"
                className="relative inline-flex h-[46px] items-center rounded-full bg-neon px-8 text-[17px] font-medium text-ink transition hover:bg-[#8affa1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
              >
                {intelligence.cta}
              </a>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                type="button"
                onClick={prev}
                aria-label="Previous slide"
                className="grid h-12 w-12 place-items-center rounded-full border border-neon text-neon transition hover:bg-neon hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
              >
                <ChevronLeftIcon size={20} />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next slide"
                className="grid h-12 w-12 place-items-center rounded-full border border-neon text-neon transition hover:bg-neon hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
              >
                <ChevronRightIcon size={20} />
              </button>
              <span className="self-center text-[14px] text-mute" aria-hidden="true">
                {i + 1} / {slides.length}
              </span>
            </div>
          </Reveal>

          <Reveal delay={120} className="mx-auto w-full max-w-[588px]">
            <div className="overflow-hidden bg-[#222a2b]" style={{ aspectRatio: '588 / 409' }}>
              <div style={{ height: '64%' }}>
                <CityScene className="h-full w-full" />
              </div>
              <div style={{ height: '36%' }}>
                <CardStrip slide={slide} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      <div className="h-9 bg-black" aria-hidden="true" />
    </>
  )
}
