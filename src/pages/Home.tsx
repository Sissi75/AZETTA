import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import ModelGrid from '../components/ModelGrid';

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
    <div className="grid gap-10">
      <section className="grid gap-5 md:max-w-2xl">
        <h1 className="font-display text-4xl leading-tight md:text-5xl">{t('home.title')}</h1>
        <p className="text-lg leading-relaxed">{t('home.subtitle')}</p>
        <ul className="grid gap-2 border-s-4 border-saffron ps-4 leading-relaxed">
          {pct !== null && <li>{t('home.deposit', { pct })}</li>}
          <li>{t('home.quality')}</li>
          <li>{t('home.balance')}</li>
        </ul>
      </section>
      <section aria-labelledby="models-title">
        <h2 id="models-title" className="mb-5 font-display text-2xl">
          {t('home.chooseModel')}
        </h2>
        <ModelGrid />
      </section>
    </div>
  );
}
