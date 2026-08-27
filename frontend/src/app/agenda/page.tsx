'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import apiFetch from '../../lib/api/client';
import {
  HOURS, DAYS_ES, HOUR_HEIGHT,
  getWeekDates, toDateStr, getLayoutProps,
} from './_components/calendarUtils';
import { AppointmentBlock } from './_components/AppointmentBlock';
import { AppointmentDrawer } from './_components/AppointmentDrawer';
import { NewAppointmentModal, type NewApptInitialData } from './_components/NewAppointmentModal';

// ─── MAIN AGENDA PAGE ─────────────────────────────────────────────────────────

export default function AgendaPage() {
  const { activeBusiness, activeProfessional } = useAuth();
  const queryClient = useQueryClient();
  const [refDate, setRefDate] = useState(new Date());
  const [selectedApt, setSelectedApt] = useState<any | null>(null);
  const [filterProfId, setFilterProfId] = useState<string>('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [rebookData, setRebookData] = useState<NewApptInitialData | null>(null);

  React.useEffect(() => {
    if (activeProfessional?.id) {
      setFilterProfId(activeProfessional.id);
    } else {
      setFilterProfId('');
    }
  }, [activeProfessional]);

  const handleRebook = (apt: any) => {
    setSelectedApt(null);
    setRebookData({
      professionalId: apt.professionalId?.id || apt.professionalId?._id || apt.professionalId,
      serviceId: apt.serviceId?.id || apt.serviceId?._id || apt.serviceId,
      clientId: apt.clientId?.id || apt.clientId?._id || apt.clientId,
      clientName: apt.clientId?.name || '',
      notes: apt.notes || '',
    });
    setShowNewModal(true);
  };

  const calendarSettings = useMemo(() => activeBusiness?.settings?.calendar || {
    primaryColor: '#7C3AED',
    viewMode: 'week',
    showWeekends: true,
  }, [activeBusiness]);

  const weekDates = useMemo(() => {
    let dates = getWeekDates(refDate);
    if (!calendarSettings.showWeekends) {
      dates = dates.filter(d => d.getDay() !== 0 && d.getDay() !== 6);
    }
    return dates;
  }, [refDate, calendarSettings.showWeekends]);

  const startDate = toDateStr(weekDates[0]);
  const endDate = toDateStr(weekDates[weekDates.length - 1]);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments-week', activeBusiness?.id, startDate, endDate],
    queryFn: () => apiFetch(`/appointments?startDate=${startDate}&endDate=${endDate}`),
    enabled: !!activeBusiness?.id,
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals', activeBusiness?.id],
    queryFn: () => apiFetch('/professionals'),
    enabled: !!activeBusiness?.id,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, comment }: { id: string; status: string; comment?: string }) =>
      apiFetch(`/appointments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, comment }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments-week'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['appointment'] });
      setSelectedApt(null);
    },
  });

  const filteredApts = filterProfId
    ? appointments.filter((a: any) => a.professionalId?.id === filterProfId || a.professionalId?._id === filterProfId)
    : appointments;

  const aptsForDay = (dateStr: string) => filteredApts.filter((a: any) => a.date === dateStr);

  const goBack = () => { const d = new Date(refDate); d.setDate(d.getDate() - 7); setRefDate(d); };
  const goNext = () => { const d = new Date(refDate); d.setDate(d.getDate() + 7); setRefDate(d); };
  const goToday = () => setRefDate(new Date());

  const todayStr = toDateStr(new Date());
  const weekLabel = `${weekDates[0].toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} – ${weekDates[6].toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const handleNewSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['appointments-week'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
          <p className="text-sm text-slate-500 mt-0.5">{weekLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={filterProfId} onChange={e => setFilterProfId(e.target.value)} className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 shadow-sm">
            <option value="">Todos los profesionales</option>
            {professionals.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm">
            <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={goToday} className="px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Hoy</button>
            <button onClick={goNext} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />Nuevo Turno
          </button>
        </div>
      </div>

      {/* CALENDAR GRID */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-premium overflow-auto">
        <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
          <div className="border-r border-slate-100" />
          {weekDates.map((d, i) => {
            const isToday = toDateStr(d) === todayStr;
            return (
              <div key={i} className={`py-3 px-2 text-center border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-brand-50/60' : ''}`}>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{DAYS_ES[d.getDay()]}</p>
                <p className={`text-lg font-bold mt-0.5 ${isToday ? 'text-brand-600' : 'text-slate-700'}`}>{d.getDate()}</p>
              </div>
            );
          })}
        </div>
        <div className="grid overflow-y-auto" style={{ gridTemplateColumns: '56px repeat(7, 1fr)', maxHeight: '640px' }}>
          <div className="border-r border-slate-100">
            {HOURS.map(h => (
              <div key={h} className="calendar-hour-cell flex items-start pt-1.5 px-2">
                <span className="text-[10px] font-medium text-slate-300 tabular-nums select-none">{String(h).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>
          {weekDates.map((d, di) => {
            const dateStr = toDateStr(d);
            const dayApts = aptsForDay(dateStr);
            const isToday = dateStr === todayStr;
            return (
              <div
                key={di}
                className={`relative border-r border-slate-100 last:border-r-0 calendar-day-column ${isToday ? 'bg-brand-50/20' : ''}`}
                style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}
              >
                {HOURS.map(h => (
                  <div key={h} className="absolute left-0 right-0 border-t border-slate-100" style={{ top: `${(h - 8) * HOUR_HEIGHT}px` }} />
                ))}
                {!isLoading && (() => {
                  const dayAptsLayout = getLayoutProps(dayApts);
                  return dayApts.map((apt: any) => {
                    const layout = dayAptsLayout.get(apt.id || apt._id);
                    return (
                      <AppointmentBlock
                        key={apt.id || apt._id}
                        apt={apt}
                        onClick={() => setSelectedApt(apt)}
                        calendarSettings={calendarSettings}
                        layout={layout}
                      />
                    );
                  });
                })()}
              </div>
            );
          })}
        </div>
      </div>

      {/* DETAIL DRAWER */}
      {selectedApt && (
        <AppointmentDrawer
          apt={selectedApt}
          onClose={() => setSelectedApt(null)}
          onStatusChange={(id, status, comment) => statusMutation.mutate({ id, status, comment })}
          onRebook={handleRebook}
        />
      )}

      {/* NEW APPOINTMENT MODAL */}
      {showNewModal && activeBusiness?.id && (
        <NewAppointmentModal
          businessId={activeBusiness.id}
          onClose={() => { setShowNewModal(false); setRebookData(null); }}
          onSuccess={handleNewSuccess}
          initialData={rebookData || undefined}
        />
      )}
    </DashboardLayout>
  );
}
