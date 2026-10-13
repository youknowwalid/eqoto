import { useMemo } from 'react'
import { PhoneFrame, PortfolioPhoneScreen } from './Phones'
import { GlowChart } from './Scenes'
import { PillButton, Reveal } from './ui'
import { makeQr } from '../lib/qr'
import { brand, cta } from '../content'

/** A real, scannable QR code generated in the browser from brand.qrTarget */
export function QrCode({ text, size = 120 }) {
  const matrix = useMemo(() => makeQr(text), [text])
  const quiet = 2
  const n = matrix.length + quiet * 2
  const path = []
  matrix.forEach((row, r) =>
    row.forEach((on, c) => {
      if (on) path.push(`M${c + quiet} ${r + quiet}h1v1h-1z`)
    }),
  )
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${n} ${n}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR code that opens ${text}`}
      className="rounded-md bg-white"
    >
      <path d={path.join('')} fill="#000" />
    </svg>
  )
}

export default function CtaBand() {
  return (
    <section
      id="get-the-app"
      className="relative overflow-hidden px-4 py-14 sm:px-6 lg:py-0"
      style={{ background: 'linear-gradient(165deg,#292d32 0%,#2c3835 40%,#32493e 78%,#345041 100%)' }}
    >
      <div className="mx-auto grid min-h-[684px] max-w-[1200px] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_588px] lg:gap-8">
        <Reveal className="order-2 lg:order-1 lg:pr-6">
          <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.035em] text-cream sm:text-[34px]">
            {cta.title}
          </h2>
          <p className="mt-2 max-w-[560px] text-[16.5px] leading-[1.45] text-cream sm:text-[17.5px]">{cta.text}</p>
          <div className="mt-10 flex flex-wrap items-center gap-4 sm:mt-[72px]">
            <PillButton className="!h-[42px]">{cta.button}</PillButton>
            <div className="hidden sm:block">
              <QrCode text={brand.qrTarget} size={120} />
            </div>
          </div>
        </Reveal>

        <Reveal delay={100} className="relative order-1 mx-auto h-[420px] w-full max-w-[588px] sm:h-[500px] lg:order-2">
          <GlowChart className="absolute inset-x-0 top-[22%] h-[26%] w-full opacity-90" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="origin-center scale-[0.66] sm:scale-[0.77]" style={{ marginTop: '-60px' }}>
              <PhoneFrame width={300} height={620}>
                <PortfolioPhoneScreen />
              </PhoneFrame>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
