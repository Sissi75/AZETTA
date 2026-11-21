import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { money, tr, type I18nText } from '../lib/format';
import type { LocaleCode } from '../i18n';

type Model = { id: string; name: I18nText; description: I18nText; base_price: number; image_paths: string[] };

export default function Catalogue() {
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

  return (
    <section>
      <h1 className="mb-6 font-display text-3xl">{t('catalogue.title')}</h1>
      {models.length === 0 ? (
        <p className="max-w-prose">{t('catalogue.empty')}</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((m) => (
            <li key={m.id} className="overflow-hidden rounded-md border border-ink/15">
              {m.image_paths[0] && (
                <img
                  src={supabase.storage.from('catalog').getPublicUrl(m.image_paths[0]).data.publicUrl}
                  alt={tr(m.name, locale)}
                  className="aspect-[3/4] w-full object-cover"
                  loading="lazy"
                />
              )}
              <div className="grid gap-1 p-4">
                <h2 className="font-display text-xl">{tr(m.name, locale)}</h2>
                <p className="text-sm leading-relaxed">{tr(m.description, locale)}</p>
                <p className="font-semibold">{t('catalogue.from', { price: money(Number(m.base_price), locale) })}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
