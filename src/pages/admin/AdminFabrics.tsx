import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';
import I18nFields, { cleanI18n, toI18n, type I18nValue } from '../../components/I18nFields';
import { money, tr } from '../../lib/format';
import type { LocaleCode } from '../../i18n';

type Fabric = { id: string; code: string; name: Record<string, string>; sale_price_per_meter: number; is_active: boolean; sort_order: number };
type Form = { id?: string; code: string; name: I18nValue; price: string; active: boolean; sort: string };
const blank = (): Form => ({ code: '', name: toI18n(null), price: '', active: true, sort: '0' });

export default function AdminFabrics() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as LocaleCode;
  const [rows, setRows] = useState<Fabric[]>([]);
  const [form, setForm] = useState<Form>(blank());
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('fabric_qualities').select('*').order('sort_order');
    setRows((data ?? []) as Fabric[]);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const name = cleanI18n(form.name);
    const price = Number(form.price.replace(',', '.'));
    if (!form.code.trim() || Object.keys(name).length === 0 || !Number.isFinite(price) || price < 0) {
      setMsg({ ok: false, text: t('admin.common.invalid') });
      return;
    }
    const payload = { code: form.code.trim(), name, sale_price_per_meter: price, is_active: form.active, sort_order: Number(form.sort) || 0 };
    const { error } = form.id ? await supabase.from('fabric_qualities').update(payload).eq('id', form.id) : await supabase.from('fabric_qualities').insert(payload);
    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }
    setMsg({ ok: true, text: t('admin.common.saved') });
    setForm(blank());
    await load();
  }

  return (
    <section className="grid gap-6">
      <h2 className="font-display text-2xl">{t('admin.fabrics.title')}</h2>
      <p className="max-w-prose text-sm">{t('admin.fabrics.hint')}</p>
      <ul className="grid gap-2">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-ink/15 p-3">
            <span className="font-medium">{tr(r.name, locale)}</span>
            <span>
              {money(Number(r.sale_price_per_meter), locale)} / m {!r.is_active && `(${t('admin.common.inactive')})`}
            </span>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setForm({ id: r.id, code: r.code, name: toI18n(r.name), price: String(r.sale_price_per_meter), active: r.is_active, sort: String(r.sort_order) })}
            >
              {t('admin.common.edit')}
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={save} className="grid max-w-xl gap-4 rounded-md border border-ink/20 p-4">
        <h3 className="font-display text-xl">{form.id ? t('admin.common.edit') : t('admin.common.new')}</h3>
        <label className="grid gap-1">
          {t('admin.common.code')}
          <input className="field" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </label>
        <I18nFields legend={t('admin.common.name')} value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <label className="grid gap-1">
          {t('admin.fabrics.pricePerMeter')}
          <input className="field" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </label>
        <label className="grid gap-1">
          {t('admin.common.sortOrder')}
          <input className="field" inputMode="numeric" value={form.sort} onChange={(e) => setForm({ ...form, sort: e.target.value })} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          {t('admin.common.active')}
        </label>
        {msg && (
          <p role={msg.ok ? 'status' : 'alert'} className={msg.ok ? '' : 'text-rouge'}>
            {msg.text}
          </p>
        )}
        <div className="flex gap-2">
          <button className="btn" type="submit">
            {t('admin.common.save')}
          </button>
          {form.id && (
            <button type="button" className="btn-ghost" onClick={() => setForm(blank())}>
              {t('admin.common.cancel')}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
