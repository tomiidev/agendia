const CATEGORY_COLORS = [
  'bg-brand-100 text-brand-700 border-brand-200',
  'bg-sky-100 text-sky-700 border-sky-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-violet-100 text-violet-700 border-violet-200',
];

export function getCategoryColor(category: string) {
  let hash = 0;
  for (let i = 0; i < (category || '').length; i++) hash += category.charCodeAt(i);
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
}
