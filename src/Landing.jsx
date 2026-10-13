import { AnnouncementBar } from './components/Header'
import Header from './components/Header'
import { Hero, StatsBar } from './components/Hero'
import Fees from './components/Fees'
import Markets from './components/Markets'
import Investors from './components/Investors'
import Intelligence from './components/Intelligence'
import { Trust, Partners } from './components/Trust'
import CtaBand from './components/CtaBand'
import Sponsors from './components/Sponsors'
import Footer from './components/Footer'
import Accessibility from './components/Accessibility'

export default function Landing() {
  return (
    <>
      <a
        href="#main"
        className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-full bg-neon px-4 py-2 text-[14px] font-medium text-ink transition focus:translate-y-0"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <Header />
      <main id="main">
        <Hero />
        <StatsBar />
        <Fees />
        <Markets />
        <Investors />
        <Intelligence />
        <Trust />
        <Partners />
        <CtaBand />
        <Sponsors />
      </main>
      <Footer />
      <Accessibility />
    </>
  )
}
