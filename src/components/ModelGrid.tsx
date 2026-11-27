import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { money, tr } from '../lib/format';
import { catalogUrl, type Model } from '../lib/catalog';
import type { LocaleCode } from '../i18n';

/** Modèles de robes lus dans la base ; chaque carte mène au configurateur. */
export default function ModelGrid() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as LocaleCode;
  const [models, setModels] = useState<Model[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    void supabase
      .from('dress_models')
      .select('id, name, description, base_price, image_paths')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data, error: e }) => {
        if (e) setError(true);
        else setModels((data ?? []) as Model[]);
      });
  }, []);

  if (error) return <p role="alert">{t('common.error')}</p>;
  if (models === null) return <p>{t('common.loading')}</p>;
  if (models.length === 0) return <p className="max-w-prose">{t('catalogue.empty')}</p>;

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {models.map((m) => (
        <li key={m.id} className="overflow-hidden rounded-md border border-ink/15">
          {m.image_paths[0] ? (
            <img src={catalogUrl(m.image_paths[0])} alt={tr(m.name, locale)} className="aspect-[3/4] w-full object-cover" loading="lazy" />
          ) : (
            <div className="band aspect-[3/4] w-full bg-surface" aria-hidden="true" />
          )}
          <div className="grid gap-2 p-4">
            <h3 className="font-display text-xl">{tr(m.name, locale)}</h3>
            <p className="text-sm leading-relaxed">{tr(m.description, locale)}</p>
            <p className="font-semibold">{t('catalogue.from', { price: money(Number(m.base_price), locale) })}</p>
            <Link to={`/personnaliser/${m.id}`} className="btn mt-1">
              {t('catalogue.customize')}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
