import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { catalogUrl } from '../lib/catalog';

type Props = { folder: string; paths: string[]; onChange: (paths: string[]) => void; single?: boolean };

/** Envoi d'images vers le stockage « catalog » (réservé à l'administration par les politiques Supabase) */
export default function ImageUploader({ folder, paths, onChange, single = false }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    const path = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error: err } = await supabase.storage.from('catalog').upload(path, file, { contentType: file.type });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    onChange(single ? [path] : [...paths, path]);
  }

  return (
    <div className="grid gap-2">
      <ul className="flex flex-wrap gap-3">
        {paths.map((p) => (
          <li key={p} className="grid gap-1">
            <img src={catalogUrl(p)} alt="" className="h-24 w-20 rounded object-cover" />
            <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => onChange(paths.filter((x) => x !== p))}>
              {t('admin.common.remove')}
            </button>
          </li>
        ))}
      </ul>
      <label className="btn-ghost w-fit cursor-pointer">
        {busy ? t('admin.common.uploading') : t('admin.common.addImage')}
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => void onFile(e)} disabled={busy} />
      </label>
      {error && (
        <p role="alert" className="text-sm text-rouge">
          {error}
        </p>
      )}
    </div>
  );
}
