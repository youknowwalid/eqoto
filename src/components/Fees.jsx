import { Reveal, SectionTitle } from './ui'
import { fees } from '../content'

export default function Fees() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden px-4 pb-14 pt-12 sm:px-6 sm:pt-14"
      style={{
        background:
          'radial-gradient(ellipse 70% 55% at 62% 78%, rgba(40,78,38,0.55) 0%, rgba(30,46,27,0.35) 45%, rgba(21,23,15,0) 100%), #15170f',
      }}
    >
      <Reveal>
        <SectionTitle className="!font-medium">{fees.title}</SectionTitle>
      </Reveal>

      <div className="mx-auto mt-9 grid max-w-[1200px] gap-5 md:grid-cols-3 lg:gap-[22px]">
        {fees.cards.map((c, i) => (
          <Reveal
            key={c.big}
            delay={i * 90}
            className="group flex min-h-[236px] flex-col justify-between rounded-[22px] border border-cream/25 p-7 transition duration-300 hover:-translate-y-1 hover:border-neon/60 hover:bg-white/[0.03] sm:min-h-[260px] sm:p-8"
          >
            <div className="text-[44px] font-bold leading-none tracking-[-0.055em] text-neon sm:text-[50px]">
              {c.big}
            </div>
            <div className="mt-10">
              <h3 className="text-[22px] font-semibold leading-tight tracking-[-0.03em] text-cream sm:text-[24px]">
                {c.title}
              </h3>
              <p className="mt-1.5 text-[16px] leading-[1.45] text-cream sm:text-[17px]">{c.text}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <p className="mt-9 text-center text-[14px] text-cream">
        {fees.footnote[0]}
        <a href="#pricing" className="underline decoration-cream/60 underline-offset-2 transition hover:text-neon">
          {fees.footnote[1]}
        </a>
        {fees.footnote[2]}
      </p>
    </section>
  )
}
