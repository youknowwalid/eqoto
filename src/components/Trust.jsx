import { Reveal, SectionTitle } from './ui'
import { LandmarkIcon, LockIcon, ShieldCheckIcon } from './Icons'
import { PartnerLogo } from './Marks'
import { trust } from '../content'

const icons = { bank: LandmarkIcon, lock: LockIcon, shield: ShieldCheckIcon }

export function Trust() {
  return (
    <section id="security" className="bg-slate px-4 pb-12 pt-14 sm:px-6 sm:pt-16">
      <Reveal>
        <SectionTitle>{trust.title}</SectionTitle>
      </Reveal>
      <div className="mx-auto mt-10 grid max-w-[1200px] gap-6 md:grid-cols-3">
        {trust.cards.map((c, i) => {
          const Icon = icons[c.icon]
          return (
            <Reveal
              key={c.title}
              delay={i * 90}
              className="flex min-h-[300px] flex-col rounded-2xl border border-cream/25 p-8 transition duration-300 hover:-translate-y-1 hover:border-neon/50 sm:min-h-[324px]"
            >
              <div className="flex items-center gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-neon-deep text-neon">
                  <Icon size={28} strokeWidth={1.7} />
                </span>
                <h3 className="text-[23px] font-semibold leading-[1.15] tracking-[-0.03em] text-cream">{c.title}</h3>
              </div>
              <p className="mt-6 flex-1 text-[17px] leading-[1.42] text-cream">{c.text}</p>
              <ul className="mt-6 flex flex-wrap gap-2.5">
                {c.chips.map((chip) => (
                  <li
                    key={chip}
                    className="inline-flex h-[34px] items-center rounded-full border border-cream/30 px-4 text-[14.5px] text-cream"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
