import { useTranslation } from 'react-i18next';
import { LOCALES, applyLocale, isLocale } from '../i18n';
import { supabase } from '../services/supabase';
import { useAuth } from '../services/auth';

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const code = e.target.value;
    if (!isLocale(code)) return;
    applyLocale(code);
    // Le choix est sauvegardé dans le compte lorsque l'utilisateur est connecté
    if (session) await supabase.from('profiles').update({ locale: code }).eq('id', session.user.id);
  }

  return (
    <select aria-label={t('lang.title')} value={i18n.language} onChange={onChange} className="rounded-md border border-ink/30 bg-white px-2 py-1.5 text-sm">
      {LOCALES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
