// Single source of truth for the EQOTO brand. Import from here instead of hard-coding names or storage keys.
export const BRAND = {
  name: 'EQOTO',
  slug: 'eqoto',
  tagline: 'Practice investing with a front-row seat',
  domain: 'eqoto.vercel.app',
  supportEmail: 'support@eqoto.example',
  // Shown wherever balances, prices or returns appear.
  disclosure:
    'EQOTO is a paper-trading and education platform. Balances, prices, investors and returns are simulated. No real money is deposited, held, invested or withdrawn, and EQOTO is not a broker, bank or regulated financial service.',
  storage: { session: 'eqoto.session', account: 'eqoto.acct', nav: 'eqoto.nav' },
}
export const file = (name) => `${BRAND.slug}-${name}`
