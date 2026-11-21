import { useState, type ReactNode } from 'react';
import { LOCALES, applyLocale, storedLocale, type LocaleCode } from '../i18n';

/** Première ouverture : l'utilisateur choisit sa langue. Les quatre variantes sont présentées à égalité. */
export default function LanguageGate({ children }: { children: ReactNode }) {
  const [chosen, setChosen] = useState<boolean>(storedLocale() !== null);

  if (chosen) return <>{children}</>;

  function pick(code: LocaleCode) {
    applyLocale(code);
    setChosen(true);
  }

  return (
    <main className="flex min-h-screen flex-col">
      <div className="band" aria-hidden="true" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6">
        <h1 className="font-display text-4xl">Azetta</h1>
        <p className="text-lg">Fren tutlayt · Choisissez votre langue · اختر لغتك</p>
        <ul className="grid gap-3">
          {LOCALES.map((l) => (
            <li key={l.code}>
              <button type="button" lang={l.htmlLang} dir={l.dir} onClick={() => pick(l.code)} className="btn-ghost w-full justify-start text-xl">
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
