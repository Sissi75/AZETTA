import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../services/auth';
import { supabase } from '../services/supabase';
import { LOCALES, applyLocale, isLocale, type LocaleCode } from '../i18n';
import { money, shortDate } from '../lib/format';

type OrderRow = { id: string; order_number: string; status: string; total: number; created_at: string };

export default function Account() {
  const { t, i18n } = useTranslation();
  const { session, profile, loading, refreshProfile } = useAuth();
  const locale = i18n.language as LocaleCode;
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [lang, setLang] = useState<string>(locale);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);
  const [orders, setOrders] = useState<OrderRow[] | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
      setLang(isLocale(profile.locale) ? profile.locale : 'fr');
    }
  }, [profile]);

  useEffect(() => {
    if (!session) return;
    void supabase
      .from('orders')
      .select('id, order_number, status, total, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders((data ?? []) as OrderRow[]));
  }, [session]);

  if (loading) return <p>{t('common.loading')}</p>;
  if (!session) return <Navigate to="/connexion" replace />;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(false);
    const { error: err } = await supabase.from('profiles').update({ full_name: fullName, phone, locale: lang }).eq('id', session!.user.id);
    if (err) {
      setError(true);
      return;
    }
    if (isLocale(lang)) applyLocale(lang);
    await refreshProfile();
    setSaved(true);
  }

  return (
    <section className="grid gap-10">
      <div className="grid max-w-md gap-4">
        <h1 className="font-display text-3xl">{t('account.title')}</h1>
        <form onSubmit={save} className="grid gap-4">
          <label className="grid gap-1">
            {t('auth.fullName')}
            <input className="field" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </label>
          <label className="grid gap-1">
            {t('auth.phone')}
            <input className="field" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="grid gap-1">
            {t('lang.title')}
            <select className="field" value={lang} onChange={(e) => setLang(e.target.value)}>
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          {error && (
            <p role="alert" className="text-rouge">
              {t('common.error')}
            </p>
          )}
          {saved && <p role="status">{t('account.saved')}</p>}
          <button className="btn" type="submit">
            {t('account.save')}
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-4 font-display text-2xl">{t('account.orders')}</h2>
        {orders === null ? (
          <p>{t('common.loading')}</p>
        ) : orders.length === 0 ? (
          <p>{t('account.noOrders')}</p>
        ) : (
          <ul className="grid gap-3">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-ink/15 p-4">
                <span className="font-semibold">{o.order_number}</span>
                <span>{t(`order.status.${o.status}`)}</span>
                <span>{money(Number(o.total), locale)}</span>
                <span className="text-sm">{shortDate(o.created_at, locale)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
