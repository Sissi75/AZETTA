import { LOCALES } from '../i18n';

export type I18nValue = Record<string, string>;

export function toI18n(v: Record<string, string | undefined> | null | undefined): I18nValue {
  const out: I18nValue = {};
  for (const l of LOCALES) out[l.code] = v?.[l.code] ?? '';
  return out;
}

/** Retire les langues vides avant l'enregistrement en base */
export function cleanI18n(v: I18nValue): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v)) if (val.trim() !== '') out[k] = val.trim();
  return out;
}

type Props = { legend: string; value: I18nValue; onChange: (v: I18nValue) => void; multiline?: boolean };

/** Saisie d'un texte dans les quatre variantes de langue, chacune avec sa direction d'écriture */
export default function I18nFields({ legend, value, onChange, multiline = false }: Props) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 font-medium">{legend}</legend>
      {LOCALES.map((l) => (
        <label key={l.code} className="grid gap-1 text-sm">
          <span>{l.label}</span>
          {multiline ? (
            <textarea className="field" rows={2} lang={l.htmlLang} dir={l.dir} value={value[l.code] ?? ''} onChange={(e) => onChange({ ...value, [l.code]: e.target.value })} />
          ) : (
            <input className="field" lang={l.htmlLang} dir={l.dir} value={value[l.code] ?? ''} onChange={(e) => onChange({ ...value, [l.code]: e.target.value })} />
          )}
        </label>
      ))}
    </fieldset>
  );
}
