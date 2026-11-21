import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { money, tr, type I18nText } from '../lib/format';
import type { LocaleCode } from '../i18n';

type Model = { id: string; name: I18nText; description: I18nText; base_price: number; image_paths: string[] };

const imageCredits: Record<string, { label: string; url: string; license: string; licenseUrl: string }> = {
  amel: {
    label: 'Yves Jalabert',
    url: 'https://commons.wikimedia.org/wiki/File:Kabyle_women_traditional_costume.jpg',
    license: 'CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
  },
  tiziri: {
    label: 'BELDJERBA Tika maiva',
    url: 'https://commons.wikimedia.org/wiki/File:Robe_traditionnelle_kabyle.jpg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  thiziri: {
    label: 'Ninisa23',
    url: 'https://commons.wikimedia.org/wiki/File:Algerian_Kabyle_woman_in_traditional_dress_and_jewels_-_1970.jpg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
};

function imageUrl(path: string) {
  return path.startsWith('https://') || path.startsWith('http://')
    ? path
    : supabase.storage.from('catalog').getPublicUrl(path).data.publicUrl;
}

function creditFor(model: Model) {
  const name = String(model.name?.fr ?? '').toLowerCase();
  if (name.includes('amel')) return imageCredits.amel;
  if (name.includes('tiziri cérémonie') || name.includes('thiziri')) return imageCredits.thiziri;
  if (name.includes('tiziri')) return imageCredits.tiziri;
  return null;
}

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
      <h1 className="mb-3 font-display text-3xl">{t('catalogue.title')}</h1>
      <p className="mb-6 max-w-3xl text-sm leading-relaxed text-ink/70">
        Photographies de référence de tenues kabyles. Les visuels sont illustratifs : le tissu,
        les couleurs et les finitions de la robe commandée seront confirmés avec vous avant confection.
      </p>
      {models.length === 0 ? (
        <p className="max-w-prose">{t('catalogue.empty')}</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((m) => {
            const credit = creditFor(m);
            const firstImage = m.image_paths?.[0];
            return (
              <li key={m.id} className="overflow-hidden rounded-md border border-ink/15">
                {firstImage && (
                  <img
                    src={imageUrl(firstImage)}
                    alt={`${tr(m.name, locale)} — photographie illustrative d'une tenue kabyle`}
                    className="aspect-[3/4] w-full bg-stone-100 object-cover"
                    loading="lazy"
                  />
                )}
                <div className="grid gap-2 p-4">
                  <h2 className="font-display text-xl">{tr(m.name, locale)}</h2>
                  <p className="text-sm leading-relaxed">{tr(m.description, locale)}</p>
                  <p className="font-semibold">{t('catalogue.from', { price: money(Number(m.base_price), locale) })}</p>
                  {credit && (
                    <p className="text-xs text-ink/60">
                      Photo : <a className="underline" href={credit.url} target="_blank" rel="noreferrer">{credit.label}</a>
                      {' · '}<a className="underline" href={credit.licenseUrl} target="_blank" rel="noreferrer">{credit.license}</a>
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
