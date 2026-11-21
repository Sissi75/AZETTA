import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';

export default function Home() {
  const { t } = useTranslation();
  const [pct, setPct] = useState<number | null>(null);

  // Le taux d'avance vient de la base (paramétrable par l'administration), jamais codé en dur
  useEffect(() => {
    void supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'deposit_rate')
      .maybeSingle()
      .then(({ data }) => {
        if (data && typeof data.value === 'number') setPct(Math.round(data.value * 100));
      });
  }, []);

  return (
    <section className="grid gap-8 md:max-w-2xl">
      <h1 className="font-display text-4xl leading-tight md:text-5xl">{t('home.title')}</h1>
      <p className="text-lg leading-relaxed">{t('home.subtitle')}</p>
      <div>
        <Link to="/catalogue" className="btn">
          {t('home.cta')}
        </Link>
      </div>
      <ul className="grid gap-3 border-s-4 border-saffron ps-4 leading-relaxed">
        {pct !== null && <li>{t('home.deposit', { pct })}</li>}
        <li>{t('home.quality')}</li>
        <li>{t('home.balance')}</li>
      </ul>
    </section>
  );
}
