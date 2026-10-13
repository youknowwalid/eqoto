import { HeroScene } from './Scenes'
import { PhoneFrame, HeroPhoneScreen } from './Phones'
import { PillButton, Reveal } from './ui'
import { ClockIcon, LandmarkIcon, UsersIcon, GlobeIcon, ShieldCheckIcon } from './Icons'
import { hero, stats } from '../content'

const statIcons = {
  clock: ClockIcon,
  bank: LandmarkIcon,
  users: UsersIcon,
  globe: GlobeIcon,
  shield: ShieldCheckIcon,
}

export function Hero() {
  const lastIdx = hero.titleLines.length - 1
  return (
    <section id="top" className="relative isolate overflow-hidden bg-ink">
      {/* artwork */}
      <div className="absolute inset-0 -z-10 lg:left-auto lg:w-[68%]">
        <HeroScene className="h-full w-full" />
        {/* phone on the table */}
        <div className="pointer-events-none absolute left-1/2 top-[27%] -ml-[150px] lg:left-auto lg:right-[11%] lg:top-[-5%] lg:ml-0">
          <div className="animate-float origin-center scale-[0.8] sm:scale-[0.9] lg:scale-100">
            <div
              style={{
                transform: 'perspective(1900px) rotateX(16deg) rotateY(-12deg) rotateZ(-31deg)',
                transformStyle: 'preserve-3d',
              }}
            >
              <PhoneFrame width={300} height={620}>
                <HeroPhoneScreen />
              </PhoneFrame>
            </div>
          </div>
        </div>
      </div>

      {/* left fade so text stays readable */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(90deg,#10110e 0%,#10110e 26%,rgba(16,17,14,0.88) 40%,rgba(16,17,14,0.25) 62%,rgba(16,17,14,0) 78%)',
        }}
      />
      <div
        className="absolute inset-0 -z-10 lg:hidden"
        style={{
          background: 'linear-gradient(180deg,#10110e 0%,rgba(16,17,14,0.9) 30%,rgba(16,17,14,0) 56%)',
        }}
      />

      <div className="mx-auto flex min-h-[760px] max-w-[1200px] items-start px-4 pb-24 pt-14 sm:px-6 lg:min-h-[628px] lg:items-center lg:px-4 lg:pb-0 lg:pt-0">
        <Reveal className="max-w-[560px]">
          <h1 className="text-[46px] font-bold leading-[1.04] tracking-[-0.045em] text-cream sm:text-[58px] lg:text-[68px] lg:leading-[72px]">
            {hero.titleLines.map((line, i) => (
              <span key={line} className="block">
                {line}
                {i === lastIdx && <span className="text-neon">.</span>}
              </span>
            ))}
          </h1>
          <p className="mt-3 text-[18px] text-cream sm:text-[19px]">{hero.greeting}</p>
          <PillButton className="mt-5">{hero.cta}</PillButton>
        </Reveal>
      </div>
    </section>
  )
}

export function StatsBar() {
  return (
    <section aria-label="eqoto at a glance" className="bg-ink">
      <ul className="mx-auto grid max-w-[1376px] grid-cols-1 gap-y-5 px-6 py-7 sm:grid-cols-2 lg:flex lg:items-center lg:justify-between lg:gap-0 lg:px-6 lg:py-6 xl:px-[13px]">
        {stats.map((s, i) => {
          const Icon = statIcons[s.icon]
          return (
            <li
              key={s.strong}
              className={`flex items-center gap-3.5 lg:whitespace-nowrap lg:px-6 ${
                i > 0 ? 'lg:border-l lg:border-cream/20' : 'lg:pl-0'
              }`}
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[14px] bg-neon-deep text-neon">
                <Icon size={31} strokeWidth={1.7} />
              </span>
              <span className="text-[16px] leading-tight sm:text-[17px]">
                <strong className="font-semibold text-cream">{s.strong}</strong>{' '}
                <span className="text-mute">{s.soft}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
