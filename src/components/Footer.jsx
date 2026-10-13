import Logo from './Logo'
import { StoreBadge } from './Marks'
import { FacebookGlyph, InstagramGlyph, LinkedinGlyph, XGlyph, YoutubeGlyph } from './Icons'
import { footer } from '../content'

const socials = [
  { label: 'Facebook', Icon: FacebookGlyph },
  { label: 'Instagram', Icon: InstagramGlyph },
  { label: 'LinkedIn', Icon: LinkedinGlyph },
  { label: 'X', Icon: XGlyph },
  { label: 'YouTube', Icon: YoutubeGlyph },
]

export default function Footer() {
  return (
    <footer className="bg-slate px-4 pb-12 pt-12 sm:px-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_620px] lg:gap-8">
          <div>
            <Logo size="lg" />
            <p className="mt-2.5 max-w-[380px] text-[15px] leading-snug text-cream">{footer.tagline}</p>
            <p className="mt-9 text-[15px] font-semibold text-cream">{footer.findUs}</p>
            <ul className="mt-3 flex gap-3">
              {socials.map(({ label, Icon }) => (
                <li key={label}>
                  <a
                    href="#"
                    aria-label={label}
                    className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#1d1f23] transition hover:bg-neon focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
                  >
                    <Icon size={19} />
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <StoreBadge store="apple" />
              <StoreBadge store="google" />
            </div>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 content-start gap-x-6 gap-y-8 sm:grid-cols-3">
            {footer.columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-[14.5px] font-semibold tracking-wide text-cream">{col.title}</h3>
                <ul className="mt-3 space-y-[3px]">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a
                        href="#"
                        className="text-[14.5px] leading-snug text-cream transition hover:text-neon focus-visible:text-neon focus-visible:outline-none"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <hr className="mt-10 border-cream/15" />
        <p className="mt-8 max-w-[1100px] text-[14px] leading-[1.55] text-mute">{footer.legal}</p>
      </div>
    </footer>
  )
}
