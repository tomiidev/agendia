'use client';

import React from 'react';
import { minutesToTop, timeToMinutes, minutesToHeight } from './calendarUtils';

interface AppointmentBlockProps {
  apt: any;
  onClick: () => void;
  calendarSettings: any;
  layout?: { colIndex: number; totalCols: number };
}

export function AppointmentBlock({ apt, onClick, calendarSettings, layout }: AppointmentBlockProps) {
  const top = minutesToTop(timeToMinutes(apt.startTime));
  const height = Math.max(minutesToHeight(apt.startTime, apt.endTime), 28);
  const color = apt.professionalId?.calendarColor || calendarSettings?.primaryColor || '#8b5cf6';
  const isShort = height < 50;

  const aptDateTime = new Date(`${apt.date}T${apt.startTime}`);
  const isPast = aptDateTime < new Date();

  const leftPct = layout ? (layout.colIndex / layout.totalCols) * 100 : 0;
  const widthPct = layout ? (1 / layout.totalCols) * 100 : 100;

  const style: React.CSSProperties = {
    top: `${top}px`,
    height: `${height}px`,
    backgroundColor: isPast ? '#f1f5f9' : `${color}18`,
    borderColor: isPast ? '#e2e8f0' : `${color}50`,
  };

  if (layout && layout.totalCols > 1) {
    style.left = `calc(${leftPct}% + 2px)`;
    style.width = `calc(${widthPct}% - 4px)`;
  } else {
    style.left = '4px';
    style.right = '4px';
  }

  return (
    <div
      onClick={onClick}
      className={`absolute rounded-xl cursor-pointer border overflow-hidden select-none transition-all hover:z-20 hover:scale-[1.02] hover:shadow-md ${isPast ? 'grayscale opacity-60' : ''}`}
      style={style}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: isPast ? '#94a3b8' : color }} />
      <div className="pl-3 pr-1.5 py-1 h-full flex flex-col justify-between">
        <p className={`text-[11px] font-semibold truncate leading-tight ${isPast ? 'text-slate-500' : 'text-slate-800'}`}>{apt.clientId?.name || 'Cliente'}</p>
        {!isShort && <p className={`text-[10px] truncate ${isPast ? 'text-slate-400' : 'text-slate-500'}`}>{apt.serviceId?.name} · {apt.startTime}–{apt.endTime}</p>}
      </div>
    </div>
  );
}
