// Public Supabase settings. The publishable key is designed to live in the browser:
// what each visitor can read or change is enforced by Row Level Security in the database.
const env = (typeof import.meta !== 'undefined' && import.meta.env) || {}
export const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://vlciiiawwzccoxupixnj.supabase.co'
export const SUPABASE_KEY = env.VITE_SUPABASE_KEY || 'sb_publishable_Y2SpE-I5g1X9lkUEqmbFJA_UWJKj4fU'
