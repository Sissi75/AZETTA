import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';
import I18nFields, { cleanI18n, toI18n, type I18nValue } from '../../components/I18nFields';
import ImageUploader from '../../components/ImageUploader';
import { tr } from '../../lib/format';
import type { LocaleCode } from '../../i18n';

type Group = { id: string; code: string; name: Record<string, string>; is_required: boolean; allow_multiple: boolean; is_active: boolean; sort_order: number };
type Quality = { id: string; name: Record<string, string> };
type Option = {
  id: string; group_id: string; code: string; name: Record<string, string>; description: Record<string, string> | null;
  price_delta: number; price_per_meter: number | null; fabric_quality_id: string | null; fabric_width_cm: number | null;
  color_hex: string | null; length_factor: number | null; disables_groups: string[]; visual_key: string | null;
  image_path: string | null; is_active: boolean; sort_order: number;
};
type Form = {
  id?: string; group_id: string; code: string; name: I18nValue; description: I18nValue; delta: string; ppm: string; quality: string; width: string;
  useColor: boolean; color: string; factor: string; disables: string[]; visual: string; images: string[]; active: boolean; sort: string;
};
type GroupForm = { id?: string; code: string; name: I18nValue; required: boolean; multiple: boolean; active: boolean; sort: string };

const blank = (groupId: string): Form => ({
  group_id: groupId, code: '', name: toI18n(null), description: toI18n(null), delta: '0', ppm: '', quality: '', width: '',
  useColor: false, color: '#C8372D', factor: '', disables: [], visual: '', images: [], active: true, sort: '0',
});
const blankGroup = (): GroupForm => ({ code: '', name: toI18n(null), required: false, multiple: false, active: true, sort: '0' });
const num = (v: string): number | null => {
  const n = Number(v.replace(',', '.'));
  return v.trim() !== '' && Number.isFinite(n) ? n : null;
};

export default function AdminOptions() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as LocaleCode;
  const [groups, setGroups] = useState<Group[]>([]);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState<Form>(blank(''));
  const [gform, setGform] = useState<GroupForm>(blankGroup());
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const [g, q, o] = await Promise.all([
      supabase.from('option_groups').select('*').order('sort_order'),
      supabase.from('fabric_qualities').select('id, name').order('sort_order'),
      supabase.from('options').select('*').order('sort_order'),
    ]);
    const gs = (g.data ?? []) as Group[];
    setGroups(gs);
    setQualities((q.data ?? []) as Quality[]);
    setOptions((o.data ?? []) as Option[]);
    setFilter((f) => f || gs[0]?.id || '');
    setForm((f) => (f.group_id ? f : blank(gs[0]?.id ?? '')));
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function saveOption(e: React.FormEvent) {
    e.preventDefault();
    const name = cleanI18n(form.name);
    const delta = num(form.delta) ?? 0;
    if (!form.group_id || !form.code.trim() || Object.keys(name).length === 0 || delta < 0) {
      setMsg({ ok: false, text: t('admin.common.invalid') });
      return;
    }
    const desc = cleanI18n(form.description);
    const payload = {
      group_id: form.group_id,
      code: form.code.trim(),
      name,
      description: Object.keys(desc).length ? desc : null,
      price_delta: delta,
      price_per_meter: num(form.ppm),
      fabric_quality_id: form.quality || null,
      fabric_width_cm: num(form.width),
      color_hex: form.useColor ? form.color : null,
      length_factor: num(form.factor),
      disables_groups: form.disables,
      visual_key: form.visual || null,
      image_path: form.images[0] ?? null,
      is_active: form.active,
      sort_order: Number(form.sort) || 0,
    };
    const { error } = form.id ? await supabase.from('options').update(payload).eq('id', form.id) : await supabase.from('options').insert(payload);
    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }
    setMsg({ ok: true, text: t('admin.common.saved') });
    setForm(blank(form.group_id));
    await load();
  }

  async function saveGroup(e: React.FormEvent) {
    e.preventDefault();
    const name = cleanI18n(gform.name);
    if (!/^[a-z][a-z0-9_]*$/.test(gform.code) || Object.keys(name).length === 0) {
      setMsg({ ok: false, text: t('admin.sizes.keyInvalid') });
      return;
    }
    const payload = { code: gform.code, name, is_required: gform.required, allow_multiple: gform.multiple, is_active: gform.active, sort_order: Number(gform.sort) || 0 };
    const { error } = gform.id ? await supabase.from('option_groups').update(payload).eq('id', gform.id) : await supabase.from('option_groups').insert(payload);
    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }
    setMsg({ ok: true, text: t('admin.common.saved') });
    setGform(blankGroup());
    await load();
  }

  function edit(o: Option) {
    setForm({
      id: o.id, group_id: o.group_id, code: o.code, name: toI18n(o.name), description: toI18n(o.description),
      delta: String(o.price_delta), ppm: o.price_per_meter === null ? '' : String(o.price_per_meter), quality: o.fabric_quality_id ?? '',
      width: o.fabric_width_cm === null ? '' : String(o.fabric_width_cm), useColor: o.color_hex !== null, color: o.color_hex ?? '#C8372D',
      factor: o.length_factor === null ? '' : String(o.length_factor), disables: o.disables_groups, visual: o.visual_key ?? '',
      images: o.image_path ? [o.image_path] : [], active: o.is_active, sort: String(o.sort_order),
    });
  }

  const shown = options.filter((o) => o.group_id === filter);

  return (
    <section className="grid gap-10">
      <div className="grid gap-4">
        <h2 className="font-display text-2xl">{t('admin.options.title')}</h2>
        <p className="max-w-prose text-sm">{t('admin.options.hint')}</p>
        <label className="grid max-w-xs gap-1">
          {t('admin.options.group')}
          <select className="field" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {tr(g.name, locale)}
              </option>
            ))}
          </select>
        </label>
        <ul className="grid gap-2">
          {shown.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-ink/15 p-3">
              <span className="flex items-center gap-2 font-medium">
                {o.color_hex && <span className="inline-block h-5 w-5 rounded border border-ink/30" style={{ backgroundColor: o.color_hex }} aria-hidden="true" />}
                {tr(o.name, locale)}
              </span>
              <span className="text-sm">{!o.is_active && t('admin.common.inactive')}</span>
              <button type="button" className="btn-ghost" onClick={() => edit(o)}>
                {t('admin.common.edit')}
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn-ghost w-fit" onClick={() => setForm(blank(filter))}>
          {t('admin.common.new')}
        </button>

        <form onSubmit={saveOption} className="grid max-w-xl gap-4 rounded-md border border-ink/20 p-4">
          <h3 className="font-display text-xl">{form.id ? t('admin.common.edit') : t('admin.common.new')}</h3>
          <label className="grid gap-1">
            {t('admin.options.group')}
            <select className="field" value={form.group_id} onChange={(e) => setForm({ ...form, group_id: e.target.value })}>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {tr(g.name, locale)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            {t('admin.common.code')}
            <input className="field" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </label>
          <I18nFields legend={t('admin.common.name')} value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <I18nFields legend={t('admin.common.description')} value={form.description} onChange={(description) => setForm({ ...form, description })} multiline />
          <label className="grid gap-1">
            {t('admin.options.priceDelta')}
            <input className="field" inputMode="decimal" value={form.delta} onChange={(e) => setForm({ ...form, delta: e.target.value })} />
          </label>
          <label className="grid gap-1">
            {t('admin.options.quality')}
            <select className="field" value={form.quality} onChange={(e) => setForm({ ...form, quality: e.target.value })}>
              <option value="">{t('admin.common.none')}</option>
              {qualities.map((q) => (
                <option key={q.id} value={q.id}>
                  {tr(q.name, locale)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            {t('admin.options.pricePerMeter')}
            <input className="field" inputMode="decimal" value={form.ppm} onChange={(e) => setForm({ ...form, ppm: e.target.value })} />
          </label>
          <label className="grid gap-1">
            {t('admin.options.width')}
            <input className="field" inputMode="decimal" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} />
          </label>
          <label className="grid gap-1">
            {t('admin.options.lengthFactor')}
            <input className="field" inputMode="decimal" value={form.factor} onChange={(e) => setForm({ ...form, factor: e.target.value })} />
            <span className="text-xs">{t('admin.options.lengthFactorHint')}</span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.useColor} onChange={(e) => setForm({ ...form, useColor: e.target.checked })} />
              {t('admin.options.color')}
            </label>
            {form.useColor && <input type="color" aria-label={t('admin.options.color')} value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />}
          </div>
          <label className="grid gap-1">
            {t('admin.options.visual')}
            <select className="field" value={form.visual} onChange={(e) => setForm({ ...form, visual: e.target.value })}>
              <option value="">{t('admin.common.none')}</option>
              <option value="none">{t('admin.options.visualNone')}</option>
              <option value="half">{t('admin.options.visualHalf')}</option>
              <option value="long">{t('admin.options.visualLong')}</option>
              <option value="knee">{t('admin.options.visualKnee')}</option>
            </select>
          </label>
          <fieldset className="grid gap-2">
            <legend className="mb-1 font-medium">{t('admin.options.disables')}</legend>
            {groups.map((g) => (
              <label key={g.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.disables.includes(g.code)}
                  onChange={(e) => setForm({ ...form, disables: e.target.checked ? [...form.disables, g.code] : form.disables.filter((c) => c !== g.code) })}
                />
                {tr(g.name, locale)}
              </label>
            ))}
          </fieldset>
          <div>
            <p className="mb-1 font-medium">{t('admin.common.image')}</p>
            <ImageUploader folder="options" single paths={form.images} onChange={(images) => setForm({ ...form, images })} />
          </div>
          <label className="grid gap-1">
            {t('admin.common.sortOrder')}
            <input className="field" inputMode="numeric" value={form.sort} onChange={(e) => setForm({ ...form, sort: e.target.value })} />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            {t('admin.common.active')}
          </label>
          <button className="btn w-fit" type="submit">
            {t('admin.common.save')}
          </button>
        </form>
      </div>

      <div className="grid gap-4">
        <h2 className="font-display text-2xl">{t('admin.options.groups')}</h2>
        <ul className="grid gap-2">
          {groups.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-ink/15 p-3">
              <span className="font-medium">{tr(g.name, locale)}</span>
              <code className="text-xs">{g.code}</code>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setGform({ id: g.id, code: g.code, name: toI18n(g.name), required: g.is_required, multiple: g.allow_multiple, active: g.is_active, sort: String(g.sort_order) })}
              >
                {t('admin.common.edit')}
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={saveGroup} className="grid max-w-xl gap-4 rounded-md border border-ink/20 p-4">
          <label className="grid gap-1">
            {t('admin.common.code')}
            <input className="field" value={gform.code} disabled={Boolean(gform.id)} onChange={(e) => setGform({ ...gform, code: e.target.value })} />
          </label>
          <I18nFields legend={t('admin.common.name')} value={gform.name} onChange={(name) => setGform({ ...gform, name })} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={gform.required} onChange={(e) => setGform({ ...gform, required: e.target.checked })} />
            {t('admin.options.required')}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={gform.multiple} onChange={(e) => setGform({ ...gform, multiple: e.target.checked })} />
            {t('admin.options.multiple')}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={gform.active} onChange={(e) => setGform({ ...gform, active: e.target.checked })} />
            {t('admin.common.active')}
          </label>
          <label className="grid gap-1">
            {t('admin.common.sortOrder')}
            <input className="field" inputMode="numeric" value={gform.sort} onChange={(e) => setGform({ ...gform, sort: e.target.value })} />
          </label>
          <div className="flex gap-2">
            <button className="btn" type="submit">
              {t('admin.common.save')}
            </button>
            {gform.id && (
              <button type="button" className="btn-ghost" onClick={() => setGform(blankGroup())}>
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
