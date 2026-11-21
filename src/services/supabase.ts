import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && key);

if (!supabaseConfigured) {
  console.error('Configuration Supabase manquante : définir VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY.');
}

// Clé publique uniquement : la sécurité repose sur les politiques RLS. La clé service_role ne doit jamais apparaître ici.
export const supabase = createClient(url ?? 'http://localhost', key ?? 'missing', {
  auth: { persistSession: true, autoRefreshToken: true },
});
