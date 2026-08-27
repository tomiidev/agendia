import React from 'react';
import { minutesToTop, timeToMinutes, minutesToHeight } from './utils';

export function AppointmentBlock({ apt, onClick }: { apt: any; onClick: () => void }) {
  const top = minutesToTop(timeToMinutes(apt.startTime));
  const height = Math.max(minutesToHeight(apt.startTime, apt.endTime), 28);
  const color = apt.professionalId?.calendarColor || '#8b5cf6';
  const isShort = height < 50;

  const aptDateTime = new Date(`${apt.date}T${apt.startTime}`);
  const isPast = aptDateTime < new Date();

  return (
    <div
      onClick={onClick}
      className={`absolute left-1 right-1 rounded-xl cursor-pointer border overflow-hidden select-none transition-all hover:z-20 hover:scale-[1.02] hover:shadow-md ${isPast ? 'grayscale opacity-60' : ''}`}
      style={{ top: `${top}px`, height: `${height}px`, backgroundColor: isPast ? '#f1f5f9' : `${color}18`, borderColor: isPast ? '#e2e8f0' : `${color}50` }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: isPast ? '#94a3b8' : color }} />
      <div className="pl-3 pr-1.5 py-1 h-full flex flex-col justify-between">
        <p className={`text-[11px] font-semibold truncate leading-tight ${isPast ? 'text-slate-500' : 'text-slate-800'}`}>{apt.clientId?.name || 'Cliente'}</p>
        {!isShort && <p className={`text-[10px] truncate ${isPast ? 'text-slate-400' : 'text-slate-500'}`}>{apt.serviceId?.name} · {apt.startTime}–{apt.endTime}</p>}
      </div>
    </div>
  );
}
