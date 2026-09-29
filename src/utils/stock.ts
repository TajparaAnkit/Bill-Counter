import { BillItem, Product } from '../types';

export const tracksStock = (p?: Product | null): boolean => typeof p?.stock === 'number';

export const isLowStock = (p: Product): boolean => tracksStock(p) && p.stock! <= (p.lowStock ?? 0);

const qtyByProduct = (items: BillItem[] = []) => {
  const m = new Map<string, number>();
  items.forEach((i) => i.productId && m.set(i.productId, (m.get(i.productId) || 0) + (i.quantity || 0)));
  return m;
};

// Stock change per tracked product when a bill's items go from `before` to
// `after` (pass [] for "no bill"). Negative = stock goes down.
export const stockDeltas = (products: Product[], before: BillItem[] = [], after: BillItem[] = []): Record<string, number> => {
  const was = qtyByProduct(before);
  const now = qtyByProduct(after);
  const out: Record<string, number> = {};
  new Set([...was.keys(), ...now.keys()]).forEach((id) => {
    const change = (was.get(id) || 0) - (now.get(id) || 0);
    if (change !== 0 && tracksStock(products.find((p) => p.id === id))) out[id] = Math.round(change * 1000) / 1000;
  });
  return out;
};

// Local copy of the products with the deltas applied (mirrors what was written).
export const applyStockDeltas = (products: Product[], deltas: Record<string, number>): Product[] =>
  products.map((p) => (deltas[p.id] && tracksStock(p) ? { ...p, stock: Math.round((p.stock! + deltas[p.id]) * 1000) / 1000 } : p));
