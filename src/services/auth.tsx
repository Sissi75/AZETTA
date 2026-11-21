import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { applyLocale, isLocale } from '../i18n';

export type Profile = { id: string; full_name: string | null; phone: string | null; locale: string };
export type Role = 'client' | 'couturiere' | 'admin' | 'qualite' | 'logistique' | 'approvisionnement';

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  roles: Role[];
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) {
        setProfile(null);
        setRoles([]);
        setLoading(false);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;

  const load = useCallback(async (id: string, applyLang: boolean) => {
    const [p, r] = await Promise.all([
      supabase.from('profiles').select('id, full_name, phone, locale').eq('id', id).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', id),
    ]);
    if (p.data) {
      setProfile(p.data as Profile);
      // La langue enregistrée dans le compte prime à la connexion
      if (applyLang && isLocale(p.data.locale)) applyLocale(p.data.locale);
    }
    setRoles(((r.data ?? []) as { role: Role }[]).map((x) => x.role));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userId) void load(userId, true);
  }, [userId, load]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      roles,
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
      },
      refreshProfile: async () => {
        if (userId) await load(userId, false);
      },
    }),
    [session, profile, roles, loading, userId, load],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return v;
}
