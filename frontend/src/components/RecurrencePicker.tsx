'use client';

import React, { useState, useEffect } from 'react';
import { Repeat, Calendar as CalendarIcon } from 'lucide-react';

export default function RecurrencePicker({ value, onChange, startDate }: { value: any, onChange: (val: any) => void, startDate: string }) {
  const [duration, setDuration] = useState('1M');
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const calculateEndDate = (start: string, dur: string) => {
    const date = new Date(start);
    if (dur === '1M') date.setMonth(date.getMonth() + 1);
    else if (dur === '3M') date.setMonth(date.getMonth() + 3);
    else if (dur === '6M') date.setMonth(date.getMonth() + 6);
    else if (dur === '1Y') date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (duration !== 'custom') {
      onChange({ ...value, endDate: calculateEndDate(startDate, duration) });
    }
  }, [duration, startDate]);

  return (
    <div className="space-y-5 p-6 border-2 border-slate-100 rounded-3xl bg-slate-50/50">
      <label className="flex items-center justify-between gap-3 font-bold text-slate-900 cursor-pointer text-base">
        <div className="flex items-center gap-2">
            <div className='p-1.5 bg-brand-100 text-brand-700 rounded-lg'><Repeat size={16} /></div>
            Repetir esta reserva
        </div>
        <input 
          type="checkbox" 
          checked={value.enabled} 
          onChange={e => onChange({ ...value, enabled: e.target.checked })} 
          className="w-5 h-5 accent-brand-600 rounded-full"
        />
      </label>

      {value.enabled && (
        <div className="space-y-5 pt-2 border-t border-slate-200">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Días de la semana</p>
            <div className="flex gap-2 flex-wrap">
              {days.map((day, i) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    const newDays = value.daysOfWeek.includes(i) 
                      ? value.daysOfWeek.filter((d: number) => d !== i)
                      : [...value.daysOfWeek, i];
                    onChange({ ...value, daysOfWeek: newDays });
                  }}
                  className={`w-10 h-10 rounded-xl text-xs font-bold transition-all shadow-sm ${value.daysOfWeek.includes(i) ? 'bg-brand-600 text-white shadow-brand-600/20' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Duración</p>
            <select 
                className="w-full p-4 border-2 border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:border-brand-500 outline-none transition-colors mb-3"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
            >
                <option value="1M">1 Mes</option>
                <option value="3M">3 Meses</option>
                <option value="6M">6 Meses</option>
                <option value="1Y">1 Año</option>
                <option value="custom">Personalizada</option>
            </select>

            {duration === 'custom' && (
                <input 
                  type="date" 
                  value={value.endDate} 
                  onChange={e => onChange({ ...value, endDate: e.target.value })}
                  className="w-full p-4 border-2 border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:border-brand-500 outline-none transition-colors"
                />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
