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

export function getLayoutProps(apts: any[]) {
  const sorted = [...apts].sort((a, b) => {
    const startA = timeToMinutes(a.startTime);
    const startB = timeToMinutes(b.startTime);
    if (startA !== startB) return startA - startB;
    return timeToMinutes(b.endTime) - timeToMinutes(a.endTime);
  });

  const layoutMap = new Map<string, { colIndex: number; totalCols: number }>();
  let currentGroup: any[] = [];
  let groupMaxEnd = 0;

  const processGroup = (group: any[]) => {
    const groupColumns: any[][] = [];
    for (const apt of group) {
      const aptStart = timeToMinutes(apt.startTime);
      let colIndex = 0;
      while (colIndex < groupColumns.length) {
        const col = groupColumns[colIndex];
        const lastApt = col[col.length - 1];
        if (aptStart >= timeToMinutes(lastApt.endTime)) break;
        colIndex++;
      }
      if (colIndex === groupColumns.length) groupColumns.push([]);
      groupColumns[colIndex].push(apt);
    }
    const totalCols = groupColumns.length;
    for (let c = 0; c < totalCols; c++) {
      for (const apt of groupColumns[c]) {
        layoutMap.set(apt.id || apt._id, { colIndex: c, totalCols });
      }
    }
  };

  for (const apt of sorted) {
    const aptStart = timeToMinutes(apt.startTime);
    const aptEnd = timeToMinutes(apt.endTime);
    if (currentGroup.length > 0 && aptStart >= groupMaxEnd) {
      processGroup(currentGroup);
      currentGroup = [];
      groupMaxEnd = 0;
    }
    currentGroup.push(apt);
    if (aptEnd > groupMaxEnd) groupMaxEnd = aptEnd;
  }

  if (currentGroup.length > 0) processGroup(currentGroup);

  return layoutMap;
}

export const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-amber-100 border-amber-300', text: 'text-amber-800', label: 'Pendiente' },
  CONFIRMED: { bg: 'bg-brand-100 border-brand-300', text: 'text-brand-800', label: 'Confirmado' },
  COMPLETED: { bg: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-800', label: 'Completado' },
  CANCELLED: { bg: 'bg-red-100 border-red-300', text: 'text-red-700', label: 'Cancelado' },
  NO_SHOW: { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-600', label: 'No Show' },
};
