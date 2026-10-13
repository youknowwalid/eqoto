import { useEffect, useRef, useState } from 'react'

/** Fade/slide children in the first time they scroll into view. */
export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true)
            io.disconnect()
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? 'is-visible' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/** Primary green pill button / link */
export function PillButton({ href = '/signup', children, size = 'md', className = '', ...rest }) {
  const sizes = {
    sm: 'h-[34px] px-5 text-[15px]',
    md: 'h-[42px] px-8 text-[17px]',
  }
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center rounded-full bg-neon font-medium text-ink transition duration-200 hover:bg-[#8affa1] hover:shadow-[0_0_0_4px_rgba(109,255,138,0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon active:scale-[0.98] ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </a>
  )
}

/** Section heading used across the page */
export function SectionTitle({ children, className = '', as: Tag = 'h2' }) {
  return (
    <Tag
      className={`text-center text-[28px] font-semibold leading-[1.15] tracking-[-0.035em] text-cream sm:text-[34px] ${className}`}
    >
      {children}
    </Tag>
  )
}

/** Small green bullet list used in two sections */
export function DotList({ items, className = '', textClass = 'text-[17px] sm:text-[19px]' }) {
  return (
    <ul className={`space-y-2 ${className}`}>
      {items.map((t) => (
        <li key={t} className={`relative pl-7 leading-[1.4] text-cream ${textClass}`}>
          <span className="absolute left-0 top-[0.62em] h-[5px] w-[5px] rounded-full bg-neon" aria-hidden="true" />
          {t}
        </li>
      ))}
    </ul>
  )
}

/** Tracks a CSS media query */
export function useMediaQuery(query) {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false)
  const [matches, setMatches] = useState(get)
  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia(query)
    const on = () => setMatches(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return matches
}
