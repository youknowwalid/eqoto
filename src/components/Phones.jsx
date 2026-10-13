import { Avatar } from './Portrait'
import { Sparkline } from './Scenes'
import { investors } from '../content'

/* A generic dark smartphone. Everything inside is sized in px for a 300px-wide device. */
export function PhoneFrame({ width = 300, height = 620, className = '', style, children }) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        width,
        height,
        borderRadius: width * 0.16,
        padding: width * 0.03,
        background: 'linear-gradient(145deg,#5a544c 0%,#24211e 35%,#0c0c0b 100%)',
        boxShadow:
          '0 40px 90px rgba(0,0,0,.65), 0 8px 24px rgba(0,0,0,.5), inset 0 0 0 1.5px rgba(255,255,255,.2), inset 0 0 0 5px #0a0a09',
        ...style,
      }}
    >
      <div
        className="relative h-full w-full overflow-hidden bg-[#0d0e0c]"
        style={{ borderRadius: width * 0.135, fontFamily: 'var(--font-sans)' }}
      >
        {children}
        <div className="absolute left-1/2 top-[11px] h-[22px] w-[88px] -translate-x-1/2 rounded-full bg-black" />
      </div>
    </div>
  )
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pt-[12px] text-[10px] font-semibold text-white">
      <span>9:41</span>
      <span className="flex items-center gap-1" aria-hidden="true">
        <svg width="14" height="9" viewBox="0 0 14 9" fill="white">
          <rect x="0" y="6" width="2.4" height="3" rx=".6" />
          <rect x="3.6" y="4" width="2.4" height="5" rx=".6" />
          <rect x="7.2" y="2" width="2.4" height="7" rx=".6" />
          <rect x="10.8" y="0" width="2.4" height="9" rx=".6" />
        </svg>
        <svg width="20" height="9" viewBox="0 0 20 9" fill="none">
          <rect x=".5" y=".5" width="16" height="8" rx="2.4" stroke="white" opacity=".6" />
          <rect x="2" y="2" width="12" height="5" rx="1.4" fill="white" />
        </svg>
      </span>
    </div>
  )
}

const heroRows = [
  { name: 'Ines Calder', look: 0 },
  { name: 'Liam Brandt', look: 1 },
  { name: 'Sofia Marin', look: 3 },
  { name: 'Noah Everett', look: 4 },
  { name: 'Ethan Lowe', look: 2 },
]

/* Screen shown on the hero phone: "Trade Like a Pro" list */
export function HeroPhoneScreen() {
  const looks = investors.list.map((i) => i.look)
  return (
    <div className="flex h-full flex-col bg-[#10110f] text-white">
      <StatusBar />
      <div className="mt-3 flex items-center justify-between px-4">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h10" />
          </svg>
        </span>
        <span className="flex gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10">
            <span className="block h-2 w-2 rounded-full bg-white" />
          </span>
        </span>
      </div>

      <div className="mt-5 px-4">
        <div className="text-[17px] font-bold leading-tight tracking-tight">Trade Like a Pro ›</div>
        <div className="mt-0.5 text-[9.5px] text-white/50">Mirror top investors · Trade like a pro</div>
      </div>

      <div className="mx-3 mt-3 rounded-[16px] bg-[#1c1d1b] p-2">
        {heroRows.map((r) => (
          <div key={r.name} className="flex items-center gap-2 rounded-xl px-1.5 py-[7px]">
            <Avatar look={looks[r.look]} size={30} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-semibold">{r.name}</div>
              <div className="text-[8.5px] text-white/45">
                Return (2Y) <span className="text-[#6dff8a]">+96.35%</span>
              </div>
            </div>
            <div className="text-right leading-tight">
              <div className="text-[12px] font-bold text-[#6dff8a]">27K</div>
              <div className="text-[8px] text-white/45">Followers</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 px-4">
        <div className="flex items-center gap-1.5 text-[13px] font-bold tracking-tight">
          <span className="text-[#6dff8a]">✦</span> Hot Topics ›
        </div>
        <div className="mt-0.5 text-[9px] text-white/50">Summary of the hottest topics &amp; discussions</div>
      </div>
      <div className="mx-3 mt-2 flex-1 rounded-t-[16px] bg-[#1c1d1b] p-3">
        <div className="flex items-center gap-1.5">
          <Avatar look={looks[5]} size={16} />
          <Avatar look={looks[2]} size={16} className="-ml-2" />
          <span className="text-[8px] text-white/45">Based on 760 posts</span>
        </div>
        <div className="mt-1.5 text-[10px] leading-snug text-white/80">
          Most investors here believe Lumen’s next chip cycle is already priced in…
        </div>
      </div>

      <div className="flex items-center justify-around border-t border-white/10 bg-[#0b0c0a] px-3 pb-3 pt-2 text-[7.5px] text-white/50">
        {['Watchlist', 'Portfolio', 'Discover', 'Social'].map((t, i) => (
          <div key={t} className="flex flex-col items-center gap-1">
            <span className={`block h-3.5 w-3.5 rounded-md ${i === 2 ? 'bg-[#6dff8a]' : 'bg-white/25'}`} />
            <span className={i === 2 ? 'text-[#6dff8a]' : ''}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* Screen shown on the "Ready when you are" phone: account value + chart */
export function PortfolioPhoneScreen() {
  return (
    <div className="flex h-full flex-col bg-[#0c0d0b] text-white">
      <StatusBar />
      <div className="mt-3 flex items-center justify-between px-4">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[11px]">‹</span>
        <span className="flex gap-1.5">
          <span className="grid h-6 w-9 place-items-center rounded-full bg-white/10">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
              <circle cx="6" cy="12" r="2.4" />
              <circle cx="18" cy="6" r="2.4" />
              <circle cx="18" cy="18" r="2.4" />
              <path d="M6 12 18 6M6 12l12 6" stroke="white" strokeWidth="1.6" />
            </svg>
          </span>
        </span>
      </div>

      <div className="mt-4 flex items-start justify-between px-4">
        <div>
          <div className="text-[8.5px] text-white/50">Account Value</div>
          <div className="text-[21px] font-bold leading-tight tracking-tight">$52,418.30</div>
          <div className="text-[8px] text-[#6dff8a]">▲ 11,862.40 (29.24%) <span className="text-white/45">Today</span></div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="rounded-md bg-[#0f5a2a] px-1.5 py-0.5 text-[7.5px] font-bold text-[#6dff8a]">+$200</span>
          <span className="rounded-md bg-[#5a1a1a] px-1.5 py-0.5 text-[7.5px] font-bold text-[#ff7a7a]">-$10</span>
        </div>
      </div>

      <div className="relative mx-0 mt-3 h-[150px]">
        <Sparkline seed={5} width={283} height={150} />
        <div className="absolute inset-y-2 left-[62%] w-px bg-[#6dff8a]/70" />
        <span className="absolute left-[60.5%] top-[46%] block h-2.5 w-2.5 rounded-full border-2 border-[#6dff8a] bg-[#0c0d0b]" />
      </div>

      <div className="mt-2 flex items-center justify-between px-4 text-[8px] text-white/50">
        {['1D', '1W', '1M', '3M', '6M', '1Y', 'MAX'].map((t, i) => (
          <span key={t} className={i === 2 ? 'rounded-full bg-white/15 px-2 py-0.5 text-white' : ''}>
            {t}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 px-3">
        {[
          ['Available', '$8,229.77'],
          ['Invested', '$44,188.53'],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-[#1d1e1c] px-3 py-2">
            <div className="text-[7.5px] text-white/50">{k}</div>
            <div className="text-[10px] font-bold">{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 px-4 text-[11px] font-bold">Mirror Top Investors</div>
      <div className="mt-2 flex gap-1.5 px-4 text-[7px]">
        <span className="rounded-full bg-white/80 px-2 py-1 font-semibold text-black">Best of 500</span>
        <span className="rounded-full border border-white/20 px-2 py-1 text-white/70">Most mirrored</span>
        <span className="rounded-full border border-white/20 px-2 py-1 text-white/70">Trending</span>
      </div>
      <div className="mx-3 mt-2 flex-1 space-y-1.5 overflow-hidden rounded-t-2xl bg-[#171816] p-2">
        {[
          ['Maren Halvorsen', '+35.38%', 0],
          ['Daniel Okafor', '+54.46%', 1],
          ['Priya Raman', '+41.07%', 3],
        ].map(([name, ret, i]) => (
          <div key={name} className="flex items-center gap-2">
            <Avatar look={investors.list[i].look} size={22} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[8.5px] font-semibold">{name}</div>
              <div className="text-[6.5px] text-white/45">Return (24M)</div>
            </div>
            <div className="text-[9px] font-bold text-[#6dff8a]">{ret}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
