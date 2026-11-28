import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';

type Setting = { key: string; value: unknown; description: string | null };

function Row({ s, onSaved }: { s: Setting; onSaved: () => void }) {
  const { t } = useTranslation();
  const kind = typeof s.value;
  const [val, setVal] = useState<string>(String(s.value));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    let parsed: unknown = val;
    if (kind === 'number') {
      const n = Number(val.replace(',', '.'));
      if (!Number.isFinite(n)) {
        setMsg({ ok: false, text: t('admin.common.invalid') });
        return;
      }
      parsed = n;
    } else if (kind === 'boolean') {
      parsed = val === 'true';
    }
    const { error } = await supabase.from('app_settings').update({ value: parsed }).eq('key', s.key);
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: t('admin.common.saved') });
    if (!error) onSaved();
  }

  return (
    <li className="grid gap-2 rounded-md border border-ink/15 p-4">
      <p className="font-medium">{t(`admin.settings.keys.${s.key}`, { defaultValue: s.key })}</p>
      {s.description && <p className="text-sm">{s.description}</p>}
      {kind === 'boolean' ? (
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={val === 'true'} onChange={(e) => setVal(String(e.target.checked))} />
          {t('admin.common.active')}
        </label>
      ) : (
        <input className="field max-w-xs" value={val} onChange={(e) => setVal(e.target.value)} inputMode={kind === 'number' ? 'decimal' : 'text'} />
      )}
      <div className="flex items-center gap-3">
        <button type="button" className="btn w-fit" onClick={() => void save()}>
          {t('admin.common.save')}
        </button>
        {msg && (
          <span role={msg.ok ? 'status' : 'alert'} className={msg.ok ? '' : 'text-rouge'}>
            {msg.text}
          </span>
        )}
      </div>
    </li>
  );
}

export default function AdminSettings() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Setting[]>([]);
  const load = useCallback(async () => {
    const { data } = await supabase.from('app_settings').select('key, value, description').order('key');
    setRows((data ?? []) as Setting[]);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="grid gap-4">
      <h2 className="font-display text-2xl">{t('admin.settings.title')}</h2>
      <p className="max-w-prose text-sm">{t('admin.settings.hint')}</p>
      <ul className="grid max-w-xl gap-3">
        {rows.map((s) => (
          <Row key={`${s.key}-${String(s.value)}`} s={s} onSaved={() => void load()} />
        ))}
      </ul>
    </section>
  );
}
