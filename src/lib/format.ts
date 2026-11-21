import type { LocaleCode } from '../i18n';

export type I18nText = Partial<Record<string, string>> | null | undefined;

/** Texte multilingue stocké en base (jsonb) avec repli : langue -> latin -> français -> arabe -> première valeur */
export function tr(text: I18nText, locale: string): string {
  if (!text) return '';
  const order = [locale, locale === 'kab_tfng' ? 'kab_latn' : '', 'fr', 'ar'].filter(Boolean);
  for (const k of order) {
    const v = text[k];
    if (v) return v;
  }
  return Object.values(text).find(Boolean) ?? '';
}

const INTL: Record<LocaleCode, string> = { fr: 'fr-DZ', ar: 'ar-DZ', kab_latn: 'fr-DZ', kab_tfng: 'fr-DZ' };

export function money(value: number, locale: LocaleCode): string {
  return new Intl.NumberFormat(INTL[locale] ?? 'fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(value);
}

export function shortDate(iso: string, locale: LocaleCode): string {
  return new Intl.DateTimeFormat(INTL[locale] ?? 'fr-DZ', { dateStyle: 'medium' }).format(new Date(iso));
}
