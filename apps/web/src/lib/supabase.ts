// Supabase removed — using own JWT auth + PostgreSQL on Railway
export const supabase = null as any
export function useSupabaseAuth() {
  return { session: null, loading: false }
}
