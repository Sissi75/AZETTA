import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';

export default function Auth() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
      else navigate('/compte');
    } else {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone, locale: i18n.language } },
      });
      if (err) setError(err.message);
      else if (data.session) navigate('/compte');
      else setInfo(t('auth.checkEmail'));
    }
    setBusy(false);
  }

  return (
    <section className="mx-auto grid max-w-md gap-6">
      <h1 className="font-display text-3xl">{mode === 'login' ? t('auth.login') : t('auth.register')}</h1>
      <form onSubmit={onSubmit} className="grid gap-4">
        {mode === 'register' && (
          <>
            <label className="grid gap-1">
              {t('auth.fullName')}
              <input className="field" required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
            </label>
            <label className="grid gap-1">
              {t('auth.phone')}
              <input className="field" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            </label>
          </>
        )}
        <label className="grid gap-1">
          {t('auth.email')}
          <input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label className="grid gap-1">
          {t('auth.password')}
          <input
            className="field"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>
        {error && (
          <p role="alert" className="text-rouge">
            {error}
          </p>
        )}
        {info && <p role="status">{info}</p>}
        <button className="btn" disabled={busy} type="submit">
          {mode === 'login' ? t('auth.login') : t('auth.register')}
        </button>
      </form>
      <button type="button" className="btn-ghost" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? t('auth.switchToRegister') : t('auth.switchToLogin')}
      </button>
    </section>
  );
}
