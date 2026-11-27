import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { useAuth } from '../services/auth';
import { money, tr } from '../lib/format';
import { catalogUrl, type Group, type MeasureKey, type Model, type Opt, type Quote, type SizeChart } from '../lib/catalog';
import type { LocaleCode } from '../i18n';
import DressPreview from '../components/DressPreview';

type Loaded = { model: Model; groups: Group[]; options: Opt[]; allowed: Set<string>; sizes: SizeChart[]; keys: MeasureKey[] };

const FALLBACK_COLOR = '#C9CED8';
const FALLBACK_DECO = '#F2B01E';

export default function Configurator() {
  const { modelId } = useParams();
  const { t, i18n } = useTranslation();
  const locale = i18n.language as LocaleCode;
  const navigate = useNavigate();
  const { session } = useAuth();

  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState(false);
  const [selection, setSelection] = useState<Record<string, string[]>>({});
  const [sizeCode, setSizeCode] = useState('');
  const [measures, setMeasures] = useState<Record<string, string>>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (!modelId) return;
    void Promise.all([
      supabase.from('dress_models').select('id, name, description, base_price, image_paths').eq('id', modelId).eq('is_active', true).maybeSingle(),
      supabase.from('option_groups').select('id, code, name, is_required, allow_multiple, sort_order').eq('is_active', true).order('sort_order'),
      supabase
        .from('options')
        .select('id, group_id, code, name, description, price_delta, image_path, color_hex, disables_groups, visual_key, sort_order')
        .eq('is_active', true)
        .order('sort_order'),
      supabase.from('model_options').select('option_id').eq('model_id', modelId),
      supabase.from('size_charts').select('code, label').eq('is_active', true).order('sort_order'),
      supabase.from('measurement_keys').select('key, label, hint').order('sort_order'),
    ]).then(([m, g, o, mo, s, k]) => {
      if (m.error || g.error || o.error || mo.error || s.error || k.error || !m.data) {
        setError(true);
        return;
      }
      setData({
        model: m.data as Model,
        groups: (g.data ?? []) as Group[],
        options: (o.data ?? []) as Opt[],
        allowed: new Set(((mo.data ?? []) as { option_id: string }[]).map((x) => x.option_id)),
        sizes: (s.data ?? []) as SizeChart[],
        keys: (k.data ?? []) as MeasureKey[],
      });
    });
  }, [modelId]);

  // Si le modèle n'a aucune option rattachée, toutes les options actives sont proposées
  const available = useMemo(() => (data ? data.options.filter((o) => data.allowed.size === 0 || data.allowed.has(o.id)) : []), [data]);
  const groupById = useMemo(() => new Map((data?.groups ?? []).map((g) => [g.id, g])), [data]);

  const selected = useMemo(() => {
    const out: Opt[] = [];
    for (const o of available) {
      const g = groupById.get(o.group_id);
      if (g && selection[g.code]?.includes(o.id)) out.push(o);
    }
    return out;
  }, [available, groupById, selection]);

  const disabled = useMemo(() => new Set(selected.flatMap((o) => o.disables_groups)), [selected]);
  const effective = useMemo(() => selected.filter((o) => !disabled.has(groupById.get(o.group_id)?.code ?? '')), [selected, disabled, groupById]);
  const visibleGroups = useMemo(
    () => (data?.groups ?? []).filter((g) => !disabled.has(g.code) && available.some((o) => o.group_id === g.id)),
    [data, disabled, available],
  );

  const measuresNumeric = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(measures)) {
      const n = Number(v.replace(',', '.'));
      if (v.trim() !== '' && Number.isFinite(n) && n > 0) out[k] = n;
    }
    return out;
  }, [measures]);

  const effectiveKey = effective.map((o) => o.id).sort().join(',');
  const measuresKey = JSON.stringify(measuresNumeric);

  // Estimation calculée par le serveur (métrage de tissu x prix au mètre + options)
  useEffect(() => {
    if (!data || !modelId) return;
    const handle = setTimeout(() => {
      void supabase
        .rpc('compute_quote', {
          _model: modelId,
          _config: { size: sizeCode || null, options: effective.map((o) => ({ option_id: o.id })) },
          _measures: measuresNumeric,
        })
        .then(({ data: q, error: e }) => setQuote(e ? null : (q as Quote)));
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, modelId, effectiveKey, sizeCode, measuresKey]);

  if (error) return <p role="alert">{t('configurator.notFound')}</p>;
  if (!data) return <p>{t('common.loading')}</p>;

  const optionIn = (code: string): Opt | undefined => effective.find((o) => groupById.get(o.group_id)?.code === code);
  const decoColor = (code: string): string | undefined => {
    const o = optionIn(code);
    return o ? (o.color_hex ?? FALLBACK_DECO) : undefined;
  };
  const lengthKey = optionIn('longueur')?.visual_key;
  const sleevesKey = optionIn('manches')?.visual_key;

  function choose(group: Group, id: string) {
    setSelection((prev) => {
      const cur = prev[group.code] ?? [];
      if (group.allow_multiple) return { ...prev, [group.code]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
      if (cur[0] === id) return group.is_required ? prev : { ...prev, [group.code]: [] };
      return { ...prev, [group.code]: [id] };
    });
  }

  const hasSizeOrMeasures = sizeCode !== '' || Object.keys(measuresNumeric).length > 0;
  const requiredOk = visibleGroups.filter((g) => g.is_required).every((g) => (selection[g.code]?.length ?? 0) > 0);
  const canAdd = requiredOk && hasSizeOrMeasures && quote?.complete === true && !busy;

  function missingText(m: string): string {
    if (m.startsWith('option:')) {
      const g = data!.groups.find((x) => x.code === m.slice(7));
      return t('configurator.missingOption', { name: g ? tr(g.name, locale) : m.slice(7) });
    }
    const k = data!.keys.find((x) => x.key === m);
    if (k) return t('configurator.missingMeasure', { name: tr(k.label, locale) });
    return t('configurator.missingTariff');
  }

  async function addToOrder() {
    if (!session) {
      navigate('/connexion');
      return;
    }
    setBusy(true);
    setAddError(null);
    const uid = session.user.id;
    const cart = await supabase.from('orders').select('id').eq('customer_id', uid).eq('status', 'panier').order('created_at', { ascending: false }).limit(1).maybeSingle();
    let orderId: string | undefined = cart.data?.id as string | undefined;
    if (!orderId) {
      const created = await supabase.from('orders').insert({ customer_id: uid }).select('id').single();
      if (created.error) {
        setAddError(created.error.message);
        setBusy(false);
        return;
      }
      orderId = created.data.id as string;
    }
    const item = await supabase.from('order_items').insert({
      order_id: orderId,
      model_id: modelId,
      configuration: { size: sizeCode || null, options: effective.map((o) => ({ option_id: o.id })) },
      measurements: measuresNumeric,
    });
    setBusy(false);
    if (item.error) {
      setAddError(item.error.message);
      return;
    }
    navigate('/compte');
  }

  const color = optionIn('couleur')?.color_hex ?? FALLBACK_COLOR;

  return (
    <div className="grid gap-6">
      <Link to="/" className="w-fit underline">
        {t('configurator.back')}
      </Link>
      <h1 className="font-display text-3xl">{tr(data.model.name, locale)}</h1>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="grid gap-8">
          {visibleGroups.map((g) => (
            <fieldset key={g.id} className="grid gap-3">
              <legend className="mb-1 font-display text-xl">
                {tr(g.name, locale)} {g.is_required && <span className="text-sm font-normal text-ink/70">({t('configurator.required')})</span>}
              </legend>
              <div className="flex flex-wrap gap-3">
                {available
                  .filter((o) => o.group_id === g.id)
                  .map((o) => {
                    const on = selection[g.code]?.includes(o.id) ?? false;
                    const label = tr(o.name, locale);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => choose(g, o.id)}
                        className={`grid min-w-24 gap-1 rounded-md border-2 p-2 text-start ${on ? 'border-azure bg-surface' : 'border-ink/20 hover:border-ink/50'}`}
                      >
                        {o.color_hex && <span className="block h-8 w-full rounded border border-ink/30" style={{ backgroundColor: o.color_hex }} aria-hidden="true" />}
                        {o.image_path && <img src={catalogUrl(o.image_path)} alt="" className="h-20 w-24 rounded object-cover" loading="lazy" />}
                        <span className="text-sm font-medium">{label}</span>
                        {Number(o.price_delta) > 0 && <span className="text-xs">{t('configurator.plus', { price: money(Number(o.price_delta), locale) })}</span>}
                      </button>
                    );
                  })}
              </div>
            </fieldset>
          ))}

          <fieldset className="grid gap-3">
            <legend className="mb-1 font-display text-xl">{t('configurator.measures')}</legend>
            {data.sizes.length > 0 && (
              <label className="grid max-w-xs gap-1">
                {t('configurator.size')}
                <select className="field" value={sizeCode} onChange={(e) => setSizeCode(e.target.value)}>
                  <option value="">{t('configurator.sizeNone')}</option>
                  {data.sizes.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <p className="text-sm">{t('configurator.measuresHint')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.keys.map((k) => (
                <label key={k.key} className="grid gap-1 text-sm">
                  {tr(k.label, locale)} (cm)
                  <input
                    className="field"
                    inputMode="decimal"
                    value={measures[k.key] ?? ''}
                    onChange={(e) => setMeasures((p) => ({ ...p, [k.key]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <aside className="grid content-start gap-5 lg:sticky lg:top-4 lg:self-start">
          {data.model.image_paths[0] && <img src={catalogUrl(data.model.image_paths[0])} alt={tr(data.model.name, locale)} className="w-full rounded-md object-cover" />}
          <DressPreview
            color={color}
            length={lengthKey === 'knee' ? 'knee' : 'long'}
            sleeves={sleevesKey === 'none' ? 'none' : sleevesKey === 'half' ? 'half' : 'long'}
            deco={{ col: decoColor('deco_col'), bas: decoColor('deco_bas'), manches: sleevesKey === 'none' ? undefined : decoColor('deco_manches'), ceinture: decoColor('deco_ceinture') }}
            label={t('configurator.preview')}
          />
          <p className="text-xs">{t('configurator.previewNote')}</p>

          <div className="grid gap-2 rounded-md border border-ink/20 p-4">
            <h2 className="font-display text-xl">{t('configurator.estimate')}</h2>
            {quote ? (
              <>
                <p className="text-2xl font-semibold">
                  {quote.complete ? t('configurator.total') : t('configurator.partial')} : {money(Number(quote.total), locale)}
                </p>
                {!quote.complete && (
                  <ul className="list-disc ps-5 text-sm" role="status">
                    {quote.missing.map((m) => (
                      <li key={m}>{missingText(m)}</li>
                    ))}
                  </ul>
                )}
                <details>
                  <summary className="cursor-pointer text-sm underline">{t('configurator.detail')}</summary>
                  <ul className="mt-2 grid gap-1 text-sm">
                    {quote.lines.map((l, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span>
                          {l.type === 'labour' && t('configurator.labour')}
                          {l.type === 'option' && tr(data.groups.find((g) => g.code === l.group)?.name, locale)}
                          {l.type === 'fabric' &&
                            t('configurator.fabricLine', { component: tr(l.component, locale), meters: l.meters, price: money(Number(l.price_per_meter), locale) })}
                        </span>
                        <span>{money(Number(l.amount), locale)}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              </>
            ) : (
              <p>{t('common.loading')}</p>
            )}
            {!hasSizeOrMeasures && <p className="text-sm">{t('configurator.needSize')}</p>}
          </div>

          {addError && (
            <p role="alert" className="text-rouge">
              {t('configurator.addFailed')} {addError}
            </p>
          )}
          <button type="button" className="btn" disabled={session ? !canAdd : false} onClick={() => void addToOrder()}>
            {busy ? t('configurator.adding') : session ? t('configurator.add') : t('configurator.loginToOrder')}
          </button>
        </aside>
      </div>
    </div>
  );
}
