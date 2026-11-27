import { supabase } from '../services/supabase';
import type { I18nText } from './format';

export type Group = { id: string; code: string; name: I18nText; is_required: boolean; allow_multiple: boolean; sort_order: number };

export type Opt = {
  id: string;
  group_id: string;
  code: string;
  name: I18nText;
  description: I18nText;
  price_delta: number;
  image_path: string | null;
  color_hex: string | null;
  disables_groups: string[];
  visual_key: string | null;
  sort_order: number;
};

export type Model = { id: string; name: I18nText; description: I18nText; base_price: number; image_paths: string[] };
export type SizeChart = { code: string; label: string };
export type MeasureKey = { key: string; label: I18nText; hint: I18nText };

export type QuoteLine = {
  type: 'labour' | 'option' | 'fabric';
  amount: number;
  group?: string;
  component?: I18nText;
  meters?: number;
  price_per_meter?: number;
};
export type Quote = { complete: boolean; missing: string[]; total: number; currency: string; lines: QuoteLine[] };

/** URL publique d'une image du catalogue (bucket public « catalog ») */
export function catalogUrl(path: string): string {
  return supabase.storage.from('catalog').getPublicUrl(path).data.publicUrl;
}
