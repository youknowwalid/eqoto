// ─────────────────────────────────────────────────────────────────────────────
//  eqoto — all page copy lives here, so you can edit text without touching layout.
//  Everything below is ILLUSTRATIVE SAMPLE CONTENT for a brand concept:
//  names, numbers, regulators, banks and partner clubs are invented.
//  Replace them with real, verified facts before this page goes live anywhere.
// ─────────────────────────────────────────────────────────────────────────────

export const brand = {
  name: 'eqoto',
  // The QR code on the page is generated from this address (any short URL works).
  qrTarget: 'https://eqoto.example/app',
}

export const announcement =
  'eqoto is a multi-asset investing platform concept. Illustrative content only — investments can rise and fall, and your capital is at risk.'

export const nav = [
  {
    label: 'Trade and Invest',
    items: ['Stocks', 'Crypto', 'ETFs', 'Indices', 'Commodities', 'Currencies'],
  },
  {
    label: 'Why eqoto',
    items: ['Our story', 'Security', 'Community', 'Pricing'],
  },
  {
    label: 'Learn',
    items: ['Academy', 'Market news', 'Live webinars', 'Glossary'],
  },
  {
    label: 'Company',
    items: ['About eqoto', 'Careers', 'Press room', 'Investor relations'],
  },
]

export const languages = ['EN', 'ES', 'FR', 'DE', 'IT', 'PT', 'BN']

export const hero = {
  titleLines: ['See how millions', 'invest. Then', 'invest your way'],
  greeting: 'Good to have you here.',
  cta: 'Start investing',
}

export const stats = [
  { icon: 'clock', strong: 'Since 2012', soft: '14 years' },
  { icon: 'bank', strong: 'Open markets', soft: '24/5' },
  { icon: 'users', strong: '12M+ users', soft: '60 countries' },
  { icon: 'globe', strong: 'Audited', soft: 'Every year' },
  { icon: 'shield', strong: 'Protected', soft: 'Segregated funds' },
]

export const fees = {
  title: 'Simple pricing. No fine print.',
  cards: [
    {
      big: '$0.99',
      title: 'Per stock trade.',
      text: 'One flat price whatever the size. No account fees, no custody fees, ever.',
    },
    {
      big: '0%',
      title: 'Commission on ETFs.',
      text: 'Build a balanced portfolio of leading ETFs with zero broker commission.',
    },
    {
      big: 'From 0.25%',
      title: 'Crypto that costs less.',
      text: 'Starting at 0.25% for active traders, and never more than 1% for anyone.',
    },
  ],
  footnote: ['Every fee, in plain numbers, is listed on the ', 'fees page', '.'],
}

export const markets = {
  title: 'Global markets. Your move.',
  tabs: [
    {
      id: 'stocks',
      label: 'Stocks',
      kicker: 'STOCKS',
      heading: '25 exchanges. Thousands of shares.',
      bullets: [
        'Start from just $10 with fractional shares.',
        'Trade top stocks around the clock, 24/5.',
        'Analyst picks and live market sentiment.',
      ],
      cta: 'Start investing',
      tickers: [
        { symbol: 'NOVA', name: 'Novara Systems Corp', price: 218.42, change: 1.18, mark: 'nova' },
        { symbol: 'ARCA', name: 'Arcadia Commerce Inc', price: 164.9, change: -0.52, mark: 'arca' },
        { symbol: 'MRDN', name: 'Meridian Software', price: 487.35, change: 0.34, mark: 'mrdn' },
      ],
    },
    {
      id: 'etfs',
      label: 'ETFs',
      kicker: 'ETFS',
      heading: 'Zero commission. Instant diversification.',
      bullets: [
        'Hundreds of index, sector and thematic ETFs.',
        'Spread your money across a whole market in one tap.',
        'Compare costs, holdings and past performance side by side.',
      ],
      cta: 'Explore ETFs',
      tickers: [
        { symbol: 'WRLD', name: 'World Index ETF', price: 112.76, change: 0.41, mark: 'wrld' },
        { symbol: 'TCHX', name: 'Tech Leaders ETF', price: 241.3, change: 1.62, mark: 'tchx' },
        { symbol: 'GRNX', name: 'Clean Energy ETF', price: 58.14, change: -0.87, mark: 'grnx' },
      ],
    },
    {
      id: 'crypto',
      label: 'Crypto',
      kicker: 'CRYPTO',
      heading: 'Crypto, without the maze.',
      bullets: [
        'Buy, sell and hold popular coins in the same app as your stocks.',
        'Pay less as you trade more, with fees capped at 1%.',
        'Trade any hour of any day, weekends included.',
      ],
      cta: 'Start with crypto',
      tickers: [
        { symbol: 'LUMN', name: 'Lumen Coin', price: 2843.1, change: 2.74, mark: 'lumn' },
        { symbol: 'ORBT', name: 'Orbit Token', price: 96.28, change: -1.36, mark: 'orbt' },
        { symbol: 'HELX', name: 'Helix Network', price: 14.07, change: 0.92, mark: 'helx' },
      ],
    },
  ],
}

export const investors = {
  title: 'The investors worth watching.',
  text: 'Pick someone whose results you respect, choose how much to put behind them, and Mirror does the rest — their moves become your moves. Smart, isn’t it?',
  note: 'Featured investors are verified through the eqoto Verified Investor Program. Past performance does not guarantee future results.',
  cta: 'Find investors to mirror',
  list: [
    {
      name: 'Maren Halvorsen',
      bio: 'Investment director with 9+ years of experience',
      ret: '+35.38%',
      followers: '495',
      look: {
        scene: 'interior',
        skin: '#e6b99a',
        hair: '#c9a06b',
        hairStyle: 'long',
        top: '#efe9dd',
        topStyle: 'vneck',
        bgA: '#8a7a68',
        bgB: '#3a3129',
      },
    },
    {
      name: 'Daniel Okafor',
      bio: 'Curious about markets and committed to building long-term wealth with…',
      ret: '+54.46%',
      followers: '1,518',
      look: {
        scene: 'forest',
        skin: '#7a4f38',
        hair: '#1d1613',
        hairStyle: 'short',
        top: '#1f2a44',
        topStyle: 'blazer',
        bgA: '#6f8b3d',
        bgB: '#1f3319',
      },
    },
    {
      name: 'Theo Lindgren',
      bio: 'I spread risk across sectors, regions and a small slice of crypto. Unlike plain ETFs…',
      ret: '+32.90%',
      followers: '799',
      look: {
        scene: 'balcony',
        skin: '#f0c8aa',
        hair: '#3b2418',
        hairStyle: 'curly',
        top: '#6c7a63',
        topStyle: 'sweater',
        bgA: '#cfd3d1',
        bgB: '#6d746f',
      },
    },
    {
      name: 'Priya Raman',
      bio: 'Quant analyst turned portfolio builder. I favour steady compounding over big swings…',
      ret: '+41.07%',
      followers: '2,204',
      look: {
        scene: 'office',
        skin: '#b97a56',
        hair: '#150f0d',
        hairStyle: 'bob',
        top: '#7b2d4e',
        topStyle: 'vneck',
        bgA: '#43566b',
        bgB: '#161d29',
      },
    },
    {
      name: 'Carlos Mendez',
      bio: 'Twenty years in commodities. Now I focus on dividend growers and resilient industrials…',
      ret: '+28.74%',
      followers: '1,036',
      look: {
        scene: 'cafe',
        skin: '#c68e6a',
        hair: '#2a1b14',
        hairStyle: 'beard',
        top: '#d8d2c4',
        topStyle: 'blazer',
        bgA: '#b3855a',
        bgB: '#3b2618',
      },
    },
    {
      name: 'Hana Kimura',
      bio: 'Long-term thematic investor following energy transition, health tech and robotics…',
      ret: '+47.19%',
      followers: '1,877',
      look: {
        scene: 'sunset',
        skin: '#f1d0b5',
        hair: '#120d0c',
        hairStyle: 'wavy',
        top: '#2f4d44',
        topStyle: 'sweater',
        bgA: '#e0946b',
        bgB: '#4b3350',
      },
    },
  ],
}

export const intelligence = {
  slides: [
    {
      title: 'Powered by intelligence.',
      bullets: [
        'Open a separate portfolio and link it to an AI trading agent.',
        'Beyond answering questions, the agent can actually manage trades for you.',
        'You stay in charge: you set the budget, the goals and the limits.',
      ],
      cards: ['Bulls and Bears', 'Investment Titans', 'Crystal Ball'],
      blurbs: [
        'Sharpen your instincts by studying how both sides of the market think.',
        'Follow the playbooks of history’s most respected investors.',
        'Ask what-if questions and see scenarios before you commit.',
      ],
    },
    {
      title: 'Insight before the bell.',
      bullets: [
        'Daily briefings distilled from filings, headlines and market chatter.',
        'Plain-language explanations for every move in your portfolio.',
        'Alerts built around your own watchlist, never a noisy feed.',
      ],
      cards: ['Morning Brief', 'Earnings Radar', 'Signal Scout'],
      blurbs: [
        'Start the day with five minutes that actually matter.',
        'See what companies report this week, and what is expected.',
        'Spot unusual volume and sentiment shifts as they emerge.',
      ],
    },
    {
      title: 'Strategies that adapt.',
      bullets: [
        'Pick a style — balanced, growth or income — and let the agent rebalance.',
        'Every action is logged so you can review the reasoning behind each trade.',
        'Pause or switch it off at any moment with a single tap.',
      ],
      cards: ['Steady Hand', 'Growth Engine', 'Income Garden'],
      blurbs: [
        'A calm, diversified mix for people who prefer fewer surprises.',
        'Tilted toward innovation, with guard-rails on risk.',
        'Built around dividends and regular, predictable payouts.',
      ],
    },
  ],
  cta: 'Visit the App Store',
}

export const trust = {
  title: 'Trusted by 12M+ users. Rightly so.',
  cards: [
    {
      icon: 'bank',
      title: 'Regulated entities.',
      text: 'Wherever you sign up, we follow the local rules. No exceptions.',
      chips: ['EQ Markets UK', 'EQ Europe', 'EQ Pacific'],
    },
    {
      icon: 'lock',
      title: 'Your money, kept apart.',
      text: 'Client funds sit in segregated accounts at leading custodian banks. Not a cent sits on our balance sheet.',
      chips: ['Northmark', 'Aldercroft', 'Kestrel Trust'],
    },
    {
      icon: 'shield',
      title: 'Investor protection.',
      text: 'Eligible clients are covered up to $100,000, and in some cases up to $500,000, through compensation schemes.',
      chips: ['Client Fund Scheme', 'Lloyden Cover'],
    },
  ],
}

export const partners = {
  title: 'Your funds are held with top-tier institutions',
  // Invented wordmarks, drawn in Marks.jsx
  logos: ['aldercroft', 'northmark', 'halvorsen', 'cirro', 'kestrel', 'marlowe', 'orvieux'],
}

export const cta = {
  title: 'Ready when you are.',
  text: 'Opening an account takes a few minutes. Start with $25 and you could be trading by the next market open.',
  button: 'Create account',
}

export const sponsors = {
  title: 'From podiums to pitches, look for our name.',
  list: [
    { id: 'harbor', name: 'Harbor City FC' },
    { id: 'northgate', name: 'Northgate United' },
    { id: 'lakeside', name: 'Lakeside Rovers' },
    { id: 'summit', name: 'Summit Women’s Rugby (SWR)' },
    { id: 'ridgeway', name: 'Ridgeway SC' },
    { id: 'apex', name: 'Apex Alpine Racing Team' },
    { id: 'crestview', name: 'Crestview Athletic F.C.' },
    { id: 'pitch', name: 'Pitch Rugby' },
    { id: 'riverton', name: 'Riverton 05' },
  ],
}

export const footer = {
  tagline: 'A modern investing platform for millions of people in 60 countries.',
  findUs: 'Find us on',
  columns: [
    { title: 'INVEST', links: ['Stocks', 'Crypto', 'ETFs', 'Indices'] },
    {
      title: 'PLATFORM',
      links: ['Mirror Portfolios™', '$100K Demo Account', 'Smart Portfolios', 'Fee Schedule'],
    },
    {
      title: 'SUPPORT',
      links: ['Help Center', 'How to Deposit', 'Open an Account', 'Risk Disclosures', 'Responsible Trading'],
    },
    { title: 'ABOUT US', links: ['About eqoto', 'Investor Relations', 'Careers', 'Awards'] },
    {
      title: 'LEGAL',
      links: ['Regulation', 'Privacy Policy', 'Terms & Conditions', 'Cookie Policy'],
    },
    { title: 'PARTNERS', links: ['Invite a Friend', 'Affiliate Program', 'eqoto Club'] },
  ],
  legal:
    'eqoto is a demonstration brand created for design study. All names, figures, partner marks and regulatory references on this page are illustrative sample content and do not describe a real, regulated service.',
}
