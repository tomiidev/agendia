export const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8am to 8pm
export const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
export const HOUR_HEIGHT = 72;

export function getWeekDates(refDate: Date): Date[] {
  const day = refDate.getDay();
  const monday = new Date(refDate);
  monday.setDate(refDate.getDate() - day + 1);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function toDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

export function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTop(minutes: number) {
  return ((minutes - 8 * 60) / 60) * HOUR_HEIGHT;
}

export function minutesToHeight(start: string, end: string) {
  return ((timeToMinutes(end) - timeToMinutes(start)) / 60) * HOUR_HEIGHT;
}

export const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-amber-100 border-amber-300', text: 'text-amber-800', label: 'Pendiente' },
  CONFIRMED: { bg: 'bg-brand-100 border-brand-300', text: 'text-brand-800', label: 'Confirmado' },
  COMPLETED: { bg: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-800', label: 'Completado' },
  CANCELLED: { bg: 'bg-red-100 border-red-300', text: 'text-red-700', label: 'Cancelado' },
  NO_SHOW: { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-600', label: 'No Show' },
};
