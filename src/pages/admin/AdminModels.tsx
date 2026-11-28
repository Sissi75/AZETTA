import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';
import I18nFields, { cleanI18n, toI18n, type I18nValue } from '../../components/I18nFields';
import ImageUploader from '../../components/ImageUploader';
import { money, tr } from '../../lib/format';
import type { LocaleCode } from '../../i18n';

type Model = { id: string; slug: string; name: Record<string, string>; description: Record<string, string> | null; base_price: number; production_days: number; image_paths: string[]; is_active: boolean; sort_order: number };
type Group = { id: string; code: string; name: Record<string, string> };
type Option = { id: string; group_id: string; name: Record<string, string>; is_active: boolean };
type Key = { key: string; label: Record<string, string> };
type Rule = {
  id: string; model_id: string; component: Record<string, string>; source_group: string; length_key: string; length_allowance_cm: number; width_key: string | null;
  width_ease_factor: number; width_allowance_cm: number; pieces: number; extra_meters: number; waste_pct: number; min_meters: number; length_factor_group: string | null; sort_order: number;
};
type Form = { id?: string; slug: string; name: I18nValue; description: I18nValue; price: string; days: string; images: string[]; active: boolean; sort: string };
type RuleForm = {
  id?: string; component: I18nValue; source: string; lengthKey: string; lengthAllow: string; widthKey: string; ease: string; widthAllow: string;
  pieces: string; extra: string; waste: string; min: string; factorGroup: string; sort: string;
};

const blank = (): Form => ({ slug: '', name: toI18n(null), description: toI18n(null), price: '', days: '14', images: [], active: true, sort: '0' });
const blankRule = (): RuleForm => ({ component: toI18n(null), source: '', lengthKey: '', lengthAllow: '0', widthKey: '', ease: '1', widthAllow: '0', pieces: '1', extra: '0', waste: '0', min: '0', factorGroup: '', sort: '0' });
const n = (v: string, d = 0): number => {
  const x = Number(v.replace(',', '.'));
  return v.trim() !== '' && Number.isFinite(x) ? x : d;
};

export default function AdminModels() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as LocaleCode;
  const [models, setModels] = useState<Model[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [keys, setKeys] = useState<Key[]>([]);
  const [form, setForm] = useState<Form>(blank());
  const [linked, setLinked] = useState<Set<string>>(new Set());
  const [rules, setRules] = useState<Rule[]>([]);
  const [rform, setRform] = useState<RuleForm>(blankRule());
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const [m, g, o, k] = await Promise.all([
      supabase.from('dress_models').select('*').order('sort_order'),
      supabase.from('option_groups').select('id, code, name').order('sort_order'),
      supabase.from('options').select('id, group_id, name, is_active').order('sort_order'),
      supabase.from('measurement_keys').select('key, label').order('sort_order'),
    ]);
    setModels((m.data ?? []) as Model[]);
    setGroups((g.data ?? []) as Group[]);
    setOptions((o.data ?? []) as Option[]);
    setKeys((k.data ?? []) as Key[]);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const loadModelDetails = useCallback(async (id: string) => {
    const [mo, r] = await Promise.all([
      supabase.from('model_options').select('option_id').eq('model_id', id),
      supabase.from('consumption_rules').select('*').eq('model_id', id).order('sort_order'),
    ]);
    setLinked(new Set(((mo.data ?? []) as { option_id: string }[]).map((x) => x.option_id)));
    setRules((r.data ?? []) as Rule[]);
  }, []);

  function select(m: Model) {
    setForm({ id: m.id, slug: m.slug, name: toI18n(m.name), description: toI18n(m.description), price: String(m.base_price), days: String(m.production_days), images: m.image_paths, active: m.is_active, sort: String(m.sort_order) });
    setRform(blankRule());
    setMsg(null);
    void loadModelDetails(m.id);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const name = cleanI18n(form.name);
    const price = n(form.price, -1);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(form.slug) || Object.keys(name).length === 0 || price < 0) {
      setMsg({ ok: false, text: t('admin.models.invalid') });
      return;
    }
    const desc = cleanI18n(form.description);
    const payload = {
      slug: form.slug, name, description: Object.keys(desc).length ? desc : null, base_price: price,
      production_days: Math.max(1, Math.round(n(form.days, 14))), image_paths: form.images, is_active: form.active, sort_order: Math.round(n(form.sort)),
    };
    if (form.id) {
      const { error } = await supabase.from('dress_models').update(payload).eq('id', form.id);
      if (error) return setMsg({ ok: false, text: error.message });
    } else {
      const { data, error } = await supabase.from('dress_models').insert(payload).select('id').single();
      if (error) return setMsg({ ok: false, text: error.message });
      setForm((f) => ({ ...f, id: (data as { id: string }).id }));
    }
    setMsg({ ok: true, text: t('admin.common.saved') });
    await load();
  }

  async function toggleOption(optionId: string, on: boolean) {
    if (!form.id) return;
    const { error } = on
      ? await supabase.from('model_options').insert({ model_id: form.id, option_id: optionId })
      : await supabase.from('model_options').delete().eq('model_id', form.id).eq('option_id', optionId);
    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }
    await loadModelDetails(form.id);
  }

  async function saveRule(e: React.FormEvent) {
    e.preventDefault();
    if (!form.id) return;
    const component = cleanI18n(rform.component);
    if (Object.keys(component).length === 0 || !rform.source || !rform.lengthKey) {
      setMsg({ ok: false, text: t('admin.common.invalid') });
      return;
    }
    const payload = {
      model_id: form.id, component, source_group: rform.source, length_key: rform.lengthKey, length_allowance_cm: n(rform.lengthAllow),
      width_key: rform.widthKey || null, width_ease_factor: n(rform.ease, 1), width_allowance_cm: n(rform.widthAllow), pieces: Math.max(1, Math.round(n(rform.pieces, 1))),
      extra_meters: n(rform.extra), waste_pct: n(rform.waste), min_meters: n(rform.min), length_factor_group: rform.factorGroup || null, sort_order: Math.round(n(rform.sort)),
    };
    const { error } = rform.id ? await supabase.from('consumption_rules').update(payload).eq('id', rform.id) : await supabase.from('consumption_rules').insert(payload);
    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }
    setMsg({ ok: true, text: t('admin.common.saved') });
    setRform(blankRule());
    await loadModelDetails(form.id);
  }

  async function deleteRule(id: string) {
    if (!form.id || !window.confirm(t('admin.common.confirmDelete'))) return;
    const { error } = await supabase.from('consumption_rules').delete().eq('id', id);
    if (error) setMsg({ ok: false, text: error.message });
    else await loadModelDetails(form.id);
  }

  const groupName = (code: string) => {
    const g = groups.find((x) => x.code === code);
    return g ? tr(g.name, locale) : code;
  };

  return (
    <section className="grid gap-8">
      <div className="grid gap-3">
        <h2 className="font-display text-2xl">{t('admin.models.title')}</h2>
        <ul className="grid gap-2">
          {models.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-ink/15 p-3">
              <span className="font-medium">{tr(m.name, locale)}</span>
              <span className="text-sm">
                {money(Number(m.base_price), locale)} {!m.is_active && `(${t('admin.common.inactive')})`}
              </span>
              <button type="button" className="btn-ghost" onClick={() => select(m)}>
                {t('admin.common.edit')}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn-ghost w-fit"
          onClick={() => {
            setForm(blank());
            setLinked(new Set());
            setRules([]);
            setMsg(null);
          }}
        >
          {t('admin.common.new')}
        </button>
      </div>

      <form onSubmit={save} className="grid max-w-xl gap-4 rounded-md border border-ink/20 p-4">
        <h3 className="font-display text-xl">{form.id ? t('admin.common.edit') : t('admin.common.new')}</h3>
        <label className="grid gap-1">
          {t('admin.models.slug')}
          <input className="field" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        </label>
        <I18nFields legend={t('admin.common.name')} value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <I18nFields legend={t('admin.common.description')} value={form.description} onChange={(description) => setForm({ ...form, description })} multiline />
        <label className="grid gap-1">
          {t('admin.models.basePrice')}
          <input className="field" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </label>
        <label className="grid gap-1">
          {t('admin.models.productionDays')}
          <input className="field" inputMode="numeric" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} />
        </label>
        <div>
          <p className="mb-1 font-medium">{t('admin.models.images')}</p>
          <ImageUploader folder="models" paths={form.images} onChange={(images) => setForm({ ...form, images })} />
        </div>
        <label className="grid gap-1">
          {t('admin.common.sortOrder')}
          <input className="field" inputMode="numeric" value={form.sort} onChange={(e) => setForm({ ...form, sort: e.target.value })} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          {t('admin.models.published')}
        </label>
        <button className="btn w-fit" type="submit">
          {t('admin.common.save')}
        </button>
      </form>

      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={msg.ok ? '' : 'text-rouge'}>
          {msg.text}
        </p>
      )}

      {!form.id ? (
        <p className="max-w-prose text-sm">{t('admin.models.saveFirst')}</p>
      ) : (
        <>
          <div className="grid max-w-xl gap-4 rounded-md border border-ink/20 p-4">
            <h3 className="font-display text-xl">{t('admin.models.available')}</h3>
            <p className="text-sm">{t('admin.models.availableHint')}</p>
            {groups.map((g) => {
              const opts = options.filter((o) => o.group_id === g.id);
              if (opts.length === 0) return null;
              return (
                <fieldset key={g.id} className="grid gap-1">
                  <legend className="mb-1 font-medium">{tr(g.name, locale)}</legend>
                  {opts.map((o) => (
                    <label key={o.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={linked.has(o.id)} onChange={(e) => void toggleOption(o.id, e.target.checked)} />
                      {tr(o.name, locale)} {!o.is_active && `(${t('admin.common.inactive')})`}
                    </label>
                  ))}
                </fieldset>
              );
            })}
          </div>

          <div className="grid max-w-xl gap-4 rounded-md border border-ink/20 p-4">
            <h3 className="font-display text-xl">{t('admin.models.rules')}</h3>
            <p className="text-sm">{t('admin.models.rulesHint')}</p>
            <ul className="grid gap-2">
              {rules.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-ink/15 p-3 text-sm">
                  <span className="font-medium">
                    {tr(r.component, locale)} · {groupName(r.source_group)}
                  </span>
                  <span className="flex gap-2">
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() =>
                        setRform({
                          id: r.id, component: toI18n(r.component), source: r.source_group, lengthKey: r.length_key, lengthAllow: String(r.length_allowance_cm),
                          widthKey: r.width_key ?? '', ease: String(r.width_ease_factor), widthAllow: String(r.width_allowance_cm), pieces: String(r.pieces),
                          extra: String(r.extra_meters), waste: String(r.waste_pct), min: String(r.min_meters), factorGroup: r.length_factor_group ?? '', sort: String(r.sort_order),
                        })
                      }
                    >
                      {t('admin.common.edit')}
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => void deleteRule(r.id)}>
                      {t('admin.common.delete')}
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            <form onSubmit={saveRule} className="grid gap-3">
              <I18nFields legend={t('admin.models.component')} value={rform.component} onChange={(component) => setRform({ ...rform, component })} />
              <label className="grid gap-1">
                {t('admin.models.sourceGroup')}
                <select className="field" value={rform.source} onChange={(e) => setRform({ ...rform, source: e.target.value })}>
                  <option value="">{t('admin.common.none')}</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.code}>
                      {tr(g.name, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                {t('admin.models.lengthKey')}
                <select className="field" value={rform.lengthKey} onChange={(e) => setRform({ ...rform, lengthKey: e.target.value })}>
                  <option value="">{t('admin.common.none')}</option>
                  {keys.map((k) => (
                    <option key={k.key} value={k.key}>
                      {tr(k.label, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                {t('admin.models.lengthAllowance')}
                <input className="field" inputMode="decimal" value={rform.lengthAllow} onChange={(e) => setRform({ ...rform, lengthAllow: e.target.value })} />
              </label>
              <label className="grid gap-1">
                {t('admin.models.factorGroup')}
                <select className="field" value={rform.factorGroup} onChange={(e) => setRform({ ...rform, factorGroup: e.target.value })}>
                  <option value="">{t('admin.common.none')}</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.code}>
                      {tr(g.name, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                {t('admin.models.widthKey')}
                <select className="field" value={rform.widthKey} onChange={(e) => setRform({ ...rform, widthKey: e.target.value })}>
                  <option value="">{t('admin.common.none')}</option>
                  {keys.map((k) => (
                    <option key={k.key} value={k.key}>
                      {tr(k.label, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                {t('admin.models.ease')}
                <input className="field" inputMode="decimal" value={rform.ease} onChange={(e) => setRform({ ...rform, ease: e.target.value })} />
              </label>
              <label className="grid gap-1">
                {t('admin.models.widthAllowance')}
                <input className="field" inputMode="decimal" value={rform.widthAllow} onChange={(e) => setRform({ ...rform, widthAllow: e.target.value })} />
              </label>
              <label className="grid gap-1">
                {t('admin.models.pieces')}
                <input className="field" inputMode="numeric" value={rform.pieces} onChange={(e) => setRform({ ...rform, pieces: e.target.value })} />
              </label>
              <label className="grid gap-1">
                {t('admin.models.extraMeters')}
                <input className="field" inputMode="decimal" value={rform.extra} onChange={(e) => setRform({ ...rform, extra: e.target.value })} />
              </label>
              <label className="grid gap-1">
                {t('admin.models.waste')}
                <input className="field" inputMode="decimal" value={rform.waste} onChange={(e) => setRform({ ...rform, waste: e.target.value })} />
              </label>
              <label className="grid gap-1">
                {t('admin.models.minMeters')}
                <input className="field" inputMode="decimal" value={rform.min} onChange={(e) => setRform({ ...rform, min: e.target.value })} />
              </label>
              <label className="grid gap-1">
                {t('admin.common.sortOrder')}
                <input className="field" inputMode="numeric" value={rform.sort} onChange={(e) => setRform({ ...rform, sort: e.target.value })} />
              </label>
              <div className="flex gap-2">
                <button className="btn" type="submit">
                  {t('admin.common.save')}
                </button>
                {rform.id && (
                  <button type="button" className="btn-ghost" onClick={() => setRform(blankRule())}>
                    {t('admin.common.cancel')}
                  </button>
                )}
              </div>
            </form>
          </div>
        </>
      )}
    </section>
  );
}
