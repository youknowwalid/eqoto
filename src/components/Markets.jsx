import { useEffect, useMemo, useState } from 'react'
import { Reveal, SectionTitle, PillButton, DotList } from './ui'
import { TickerMark } from './Marks'
import { markets } from '../content'

const money = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })

function stamp() {
  const d = new Date()
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const off = -d.getTimezoneOffset() / 60
  const sign = off >= 0 ? '+' : '-'
  const abs = Math.abs(off)
  const hh = Math.trunc(abs)
  const mm = Math.round((abs - hh) * 60)
  return `${time} GMT${sign}${hh}${mm ? ':' + String(mm).padStart(2, '0') : ''}`
}

function TickerCard({ t }) {
  const up = t.change >= 0
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-cream/25 px-3.5 py-3 transition duration-200 hover:border-neon/50 hover:bg-white/[0.03]">
      <TickerMark kind={t.mark} size={48} />
      <div className="min-w-0 flex-1">
        <div className="text-[21px] font-semibold leading-tight tracking-[-0.03em] text-cream">{t.symbol}</div>
        <div className="truncate text-[13.5px] text-mute">{t.name}</div>
      </div>
      <div className="text-right">
        <div key={t.price.toFixed(2)} className="animate-pop text-[22px] font-semibold leading-tight tracking-[-0.04em] text-cream">
          {money(t.price)}
        </div>
        <div className="text-[13.5px] text-mute">
          Today{' '}
          <span className={up ? 'text-neon' : 'text-down'}>
            {up ? '+' : ''}
            {t.change.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Markets() {
  const [active, setActive] = useState(0)
  const base = useMemo(() => markets.tabs.map((tab) => tab.tickers.map((t) => ({ ...t, open: t.price / (1 + t.change / 100) }))), [])
  const [prices, setPrices] = useState(() => base.map((tab) => tab.map((t) => ({ price: t.price, change: t.change }))))
  const [updated, setUpdated] = useState(stamp)

  // Gentle simulated price movement so the page feels alive (illustrative only)
  useEffect(() => {
    const timer = setInterval(() => {
      setPrices((prev) =>
        prev.map((tab, ti) =>
          tab.map((p, i) => {
            const drift = (Math.random() - 0.5) * 0.0016
            const price = Math.max(0.01, p.price * (1 + drift))
            const change = (price / base[ti][i].open - 1) * 100
            return { price, change }
          }),
        ),
      )
      setUpdated(stamp())
    }, 3200)
    return () => clearInterval(timer)
  }, [base])

  const tab = markets.tabs[active]
  const onKey = (e) => {
    if (e.key === 'ArrowRight') setActive((active + 1) % markets.tabs.length)
    if (e.key === 'ArrowLeft') setActive((active + markets.tabs.length - 1) % markets.tabs.length)
  }

  return (
    <section id="markets" className="bg-slate px-4 pb-12 pt-12 sm:px-6 sm:pt-14">
      <Reveal>
        <SectionTitle>{markets.title}</SectionTitle>
        <div role="tablist" aria-label="Asset classes" onKeyDown={onKey} className="mt-7 flex justify-center gap-3">
          {markets.tabs.map((t, i) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              id={`tab-${t.id}`}
              aria-selected={i === active}
              aria-controls={`panel-${t.id}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={`h-[36px] rounded-full border px-5 text-[17px] transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon ${
                i === active
                  ? 'border-neon bg-[#2c3536] text-neon'
                  : 'border-cream/30 text-cream hover:border-cream/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Reveal>

      <div
        role="tabpanel"
        id={`panel-${tab.id}`}
        aria-labelledby={`tab-${tab.id}`}
        key={tab.id}
        className="animate-pop mx-auto mt-8 grid max-w-[960px] gap-6 lg:grid-cols-[minmax(0,1fr)_370px]"
      >
        <div className="flex flex-col rounded-2xl border border-cream/25 p-7 sm:p-8">
          <div className="text-[11px] font-semibold tracking-[0.22em] text-neon">{tab.kicker}</div>
          <h3 className="mt-4 text-[24px] font-medium leading-[1.2] tracking-[-0.03em] text-cream sm:text-[28px]">
            {tab.heading}
          </h3>
          <DotList items={tab.bullets} className="mt-5 flex-1" />
          <div className="mt-8">
            <PillButton>{tab.cta}</PillButton>
          </div>
        </div>

        <div>
          <div className="space-y-[18px]">
            {tab.tickers.map((t, i) => (
              <TickerCard key={t.symbol} t={{ ...t, ...prices[active][i] }} />
            ))}
          </div>
          <p className="mt-4 text-[14px] text-mute">Last update: {updated} · illustrative data</p>
        </div>
      </div>
    </section>
  )
}
