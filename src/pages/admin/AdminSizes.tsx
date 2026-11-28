import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';
import I18nFields, { cleanI18n, toI18n, type I18nValue } from '../../components/I18nFields';
import { tr } from '../../lib/format';
import type { LocaleCode } from '../../i18n';

type Key = { key: string; label: Record<string, string>; hint: Record<string, string> | null; sort_order: number };
type Size = { id: string; code: string; label: string; measurements: Record<string, number>; is_active: boolean; sort_order: number };
type SizeForm = { id?: string; code: string; label: string; values: Record<string, string>; active: boolean; sort: string };
type KeyForm = { isNew: boolean; key: string; label: I18nValue; hint: I18nValue; sort: string };

const blankSize = (): SizeForm => ({ code: '', label: '', values: {}, active: true, sort: '0' });
const blankKey = (): KeyForm => ({ isNew: true, key: '', label: toI18n(null), hint: toI18n(null), sort: '0' });

export default function AdminSizes() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as LocaleCode;
  const [keys, setKeys] = useState<Key[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [sizeForm, setSizeForm] = useState<SizeForm>(blankSize());
  const [keyForm, setKeyForm] = useState<KeyForm>(blankKey());
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const [k, s] = await Promise.all([supabase.from('measurement_keys').select('*').order('sort_order'), supabase.from('size_charts').select('*').order('sort_order')]);
    setKeys((k.data ?? []) as Key[]);
    setSizes((s.data ?? []) as Size[]);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function saveKey(e: React.FormEvent) {
    e.preventDefault();
    const label = cleanI18n(keyForm.label);
    if (!/^[a-z][a-z0-9_]*$/.test(keyForm.key) || Object.keys(label).length === 0) {
      setMsg({ ok: false, text: t('admin.sizes.keyInvalid') });
      return;
    }
    const hint = cleanI18n(keyForm.hint);
    const payload = { key: keyForm.key, label, hint: Object.keys(hint).length ? hint : null, sort_order: Number(keyForm.sort) || 0 };
    const { error } = await supabase.from('measurement_keys').upsert(payload);
    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }
    setMsg({ ok: true, text: t('admin.common.saved') });
    setKeyForm(blankKey());
    await load();
  }

  async function saveSize(e: React.FormEvent) {
    e.preventDefault();
    const measurements: Record<string, number> = {};
    for (const [k, v] of Object.entries(sizeForm.values)) {
      const n = Number(v.replace(',', '.'));
      if (v.trim() !== '' && Number.isFinite(n) && n > 0) measurements[k] = n;
    }
    if (!sizeForm.code.trim() || !sizeForm.label.trim()) {
      setMsg({ ok: false, text: t('admin.common.invalid') });
      return;
    }
    const payload = { code: sizeForm.code.trim(), label: sizeForm.label.trim(), measurements, is_active: sizeForm.active, sort_order: Number(sizeForm.sort) || 0 };
    const { error } = sizeForm.id ? await supabase.from('size_charts').update(payload).eq('id', sizeForm.id) : await supabase.from('size_charts').insert(payload);
    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }
    setMsg({ ok: true, text: t('admin.common.saved') });
    setSizeForm(blankSize());
    await load();
  }

  return (
    <section className="grid gap-10">
      <div className="grid gap-4">
        <h2 className="font-display text-2xl">{t('admin.sizes.title')}</h2>
        <p className="max-w-prose text-sm">{t('admin.sizes.hint')}</p>
        <ul className="grid gap-2">
          {sizes.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-ink/15 p-3">
              <span className="font-medium">{s.label}</span>
              <span className="text-sm">{!s.is_active && t('admin.common.inactive')}</span>
              <button
                type="button"
                className="btn-ghost"
                onClick={() =>
                  setSizeForm({
                    id: s.id,
                    code: s.code,
                    label: s.label,
                    values: Object.fromEntries(Object.entries(s.measurements).map(([k, v]) => [k, String(v)])),
                    active: s.is_active,
                    sort: String(s.sort_order),
                  })
                }
              >
                {t('admin.common.edit')}
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={saveSize} className="grid max-w-xl gap-4 rounded-md border border-ink/20 p-4">
          <h3 className="font-display text-xl">{sizeForm.id ? t('admin.common.edit') : t('admin.common.new')}</h3>
          <label className="grid gap-1">
            {t('admin.common.code')}
            <input className="field" value={sizeForm.code} onChange={(e) => setSizeForm({ ...sizeForm, code: e.target.value })} />
          </label>
          <label className="grid gap-1">
            {t('admin.sizes.label')}
            <input className="field" value={sizeForm.label} onChange={(e) => setSizeForm({ ...sizeForm, label: e.target.value })} />
          </label>
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-1 font-medium">{t('admin.sizes.values')}</legend>
            {keys.map((k) => (
              <label key={k.key} className="grid gap-1 text-sm">
                {tr(k.label, locale)} (cm)
                <input
                  className="field"
                  inputMode="decimal"
                  value={sizeForm.values[k.key] ?? ''}
                  onChange={(e) => setSizeForm({ ...sizeForm, values: { ...sizeForm.values, [k.key]: e.target.value } })}
                />
              </label>
            ))}
          </fieldset>
          <label className="grid gap-1">
            {t('admin.common.sortOrder')}
            <input className="field" inputMode="numeric" value={sizeForm.sort} onChange={(e) => setSizeForm({ ...sizeForm, sort: e.target.value })} />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={sizeForm.active} onChange={(e) => setSizeForm({ ...sizeForm, active: e.target.checked })} />
            {t('admin.common.active')}
          </label>
          <div className="flex gap-2">
            <button className="btn" type="submit">
              {t('admin.common.save')}
            </button>
            {sizeForm.id && (
              <button type="button" className="btn-ghost" onClick={() => setSizeForm(blankSize())}>
                {t('admin.common.cancel')}
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="grid gap-4">
        <h2 className="font-display text-2xl">{t('admin.sizes.measurementKeys')}</h2>
        <ul className="grid gap-2">
          {keys.map((k) => (
            <li key={k.key} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-ink/15 p-3">
              <span className="font-medium">{tr(k.label, locale)}</span>
              <code className="text-xs">{k.key}</code>
              <button type="button" className="btn-ghost" onClick={() => setKeyForm({ isNew: false, key: k.key, label: toI18n(k.label), hint: toI18n(k.hint), sort: String(k.sort_order) })}>
                {t('admin.common.edit')}
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={saveKey} className="grid max-w-xl gap-4 rounded-md border border-ink/20 p-4">
          <label className="grid gap-1">
            {t('admin.sizes.key')}
            <input className="field" value={keyForm.key} disabled={!keyForm.isNew} onChange={(e) => setKeyForm({ ...keyForm, key: e.target.value })} />
          </label>
          <I18nFields legend={t('admin.sizes.label')} value={keyForm.label} onChange={(label) => setKeyForm({ ...keyForm, label })} />
          <I18nFields legend={t('admin.sizes.hintLabel')} value={keyForm.hint} onChange={(hint) => setKeyForm({ ...keyForm, hint })} multiline />
          <label className="grid gap-1">
            {t('admin.common.sortOrder')}
            <input className="field" inputMode="numeric" value={keyForm.sort} onChange={(e) => setKeyForm({ ...keyForm, sort: e.target.value })} />
          </label>
          <div className="flex gap-2">
            <button className="btn" type="submit">
              {t('admin.common.save')}
            </button>
            {!keyForm.isNew && (
              <button type="button" className="btn-ghost" onClick={() => setKeyForm(blankKey())}>
                {t('admin.common.cancel')}
              </button>
            )}
          </div>
        </form>
      </div>
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={msg.ok ? '' : 'text-rouge'}>
          {msg.text}
        </p>
      )}
    </section>
  );
}
