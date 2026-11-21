import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from '../locales/fr.json';
import ar from '../locales/ar.json';
import kabLatn from '../locales/kab_latn.json';
import kabTfng from '../locales/kab_tfng.json';

/** Les 4 variantes d'écriture. Aucune n'est secondaire : l'ordre n'implique aucune priorité. */
export const LOCALES = [
  { code: 'fr', label: 'Français', dir: 'ltr', htmlLang: 'fr' },
  { code: 'ar', label: 'العربية', dir: 'rtl', htmlLang: 'ar' },
  { code: 'kab_latn', label: 'Tamaziɣt', dir: 'ltr', htmlLang: 'kab' },
  { code: 'kab_tfng', label: 'ⵜⴰⵎⴰⵣⵉⵖⵜ', dir: 'ltr', htmlLang: 'kab-Tfng' },
] as const;

export type LocaleCode = (typeof LOCALES)[number]['code'];

const STORAGE_KEY = 'azetta.locale';

export function isLocale(code: string | null | undefined): code is LocaleCode {
  return LOCALES.some((l) => l.code === code);
}

export function storedLocale(): LocaleCode | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isLocale(v) ? v : null;
  } catch {
    return null;
  }
}

/** Applique la langue : traduction, direction (RTL/LTR), attribut lang, mémorisation locale. */
export function applyLocale(code: LocaleCode): void {
  const meta = LOCALES.find((l) => l.code === code)!;
  void i18n.changeLanguage(code);
  document.documentElement.lang = meta.htmlLang;
  document.documentElement.dir = meta.dir;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* stockage indisponible : la langue ne sera pas mémorisée localement */
  }
}

const initial: LocaleCode = storedLocale() ?? 'fr';

void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    ar: { translation: ar },
    kab_latn: { translation: kabLatn },
    kab_tfng: { translation: kabTfng },
  },
  lng: initial,
  // Traduction manquante : tifinagh -> latin -> français ; les autres -> français
  fallbackLng: { kab_tfng: ['kab_latn', 'fr'], default: ['fr'] },
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

const meta0 = LOCALES.find((l) => l.code === initial)!;
document.documentElement.lang = meta0.htmlLang;
document.documentElement.dir = meta0.dir;

export default i18n;
