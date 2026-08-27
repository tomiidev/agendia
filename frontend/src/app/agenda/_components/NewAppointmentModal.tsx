'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  X, Calendar, Search, Loader2, Check, Scissors,
  CheckCircle2, ArrowRight, ArrowLeft, Tag,
} from 'lucide-react';
import apiFetch from '../../../lib/api/client';
import { toDateStr } from './calendarUtils';
import RecurrencePicker from '../../../components/RecurrencePicker';
import { useAuth } from '../../../providers/AuthProvider';

type Step = 1 | 2 | 3;

interface NewApptForm {
  professionalId: string;
  serviceId: string;
  date: string;
  startTime: string;
  clientId: string;
  clientSearch: string;
  notes: string;
  couponCode: string;
}

export interface NewApptInitialData {
  professionalId?: string;
  serviceId?: string;
  clientId?: string;
  clientName?: string;
  notes?: string;
}

interface NewAppointmentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  businessId: string;
  initialData?: NewApptInitialData;
}

export function NewAppointmentModal({ onClose, onSuccess, businessId, initialData }: NewAppointmentModalProps) {
  const { activeProfessional } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<NewApptForm>({
    professionalId: initialData?.professionalId || activeProfessional?.id || '',
    serviceId: initialData?.serviceId || '',
    date: toDateStr(new Date()),
    startTime: '',
    clientId: initialData?.clientId || '',
    clientSearch: initialData?.clientName || '',
    notes: initialData?.notes || '',
    couponCode: '',
  });
  const [recurrence, setRecurrence] = useState({ enabled: false, daysOfWeek: [], endDate: toDateStr(new Date()) });
  const [error, setError] = useState('');

  const set = (k: keyof NewApptForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  const { data: professionals = [] } = useQuery({ queryKey: ['professionals', businessId], queryFn: () => apiFetch('/professionals'), enabled: !!businessId });
  const { data: services = [] } = useQuery({ queryKey: ['services', businessId], queryFn: () => apiFetch('/services'), enabled: !!businessId });
  const { data: clients = [] } = useQuery({ queryKey: ['clients', businessId], queryFn: () => apiFetch('/clients'), enabled: !!businessId });

  const canFetchSlots = !!form.professionalId && !!form.serviceId && !!form.date;
  const { data: slots = [], isFetching: fetchingSlots } = useQuery({
    queryKey: ['slots', form.professionalId, form.serviceId, form.date],
    queryFn: () => apiFetch(`/availability?serviceId=${form.serviceId}&professionalId=${form.professionalId}&date=${form.date}`),
    enabled: canFetchSlots,
  });

  const selectedService = services.find((s: any) => s.id === form.serviceId);
  const selectedProfessional = professionals.find((p: any) => p.id === form.professionalId);

  const filteredClients = form.clientSearch
    ? clients.filter((c: any) => c.name?.toLowerCase().includes(form.clientSearch.toLowerCase()) || c.phone?.includes(form.clientSearch))
    : clients.slice(0, 8);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiFetch('/appointments', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: any) => setError(e.message),
  });

  const handleSubmit = () => {
    setError('');
    if (!form.clientId) { setError('Selecciona un cliente.'); return; }
    createMutation.mutate({
      businessId,
      clientId: form.clientId,
      professionalId: form.professionalId,
      serviceId: form.serviceId,
      date: form.date,
      startTime: form.startTime,
      notes: form.notes || undefined,
      couponCode: form.couponCode || undefined,
      recurrence,
    });
  };

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all';
  const labelCls = 'block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5';
  const STEPS = ['Profesional & Servicio', 'Fecha & Horario', 'Cliente & Notas'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="p-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-600" />Nueva Reserva
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400"><X className="w-5 h-5" /></button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => {
              const s = (i + 1) as Step;
              const isActive = step === s;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className={`w-full h-1.5 rounded-full ${step >= s ? 'bg-brand-600' : 'bg-slate-100'}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-brand-700' : 'text-slate-400'}`}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* STEP 1: Profesional & Servicio */}
          {step === 1 && (
            <>
              <div>
                <label className={labelCls}>Profesional</label>
                <div className="grid grid-cols-1 gap-3">
                  {professionals.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => { set('professionalId', p.id); set('serviceId', ''); set('startTime', ''); }}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${form.professionalId === p.id ? 'border-brand-600 bg-brand-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm" style={{ backgroundColor: p.calendarColor || '#8b5cf6' }}>
                        {p.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900">{p.name}</p>
                        {p.description && <p className="text-xs text-slate-500 truncate">{p.description}</p>}
                      </div>
                      {form.professionalId === p.id && <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {form.professionalId && (
                <div>
                  <label className={labelCls}>Servicio</label>
                  <div className="grid grid-cols-1 gap-3">
                    {services
                      .filter((s: any) => s.active)
                      .filter((s: any) => {
                        const prof = professionals.find((p: any) => p.id === form.professionalId);
                        return !prof?.services?.length || prof.services.map((id: any) => id?.toString?.() || id).includes(s.id);
                      })
                      .map((s: any) => (
                        <button
                          key={s.id}
                          onClick={() => { set('serviceId', s.id); set('startTime', ''); }}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all ${form.serviceId === s.id ? 'border-brand-600 bg-brand-50 shadow-inner' : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'}`}
                        >
                          <div className='flex items-center gap-4'>
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                              <Scissors className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{s.name}</p>
                              <p className="text-xs text-slate-500 font-medium">{s.duration} min</p>
                            </div>
                          </div>
                          <div className='flex items-center gap-3'>
                            <p className="font-bold text-brand-700">${s.price?.toLocaleString('es-AR')}</p>
                            {form.serviceId === s.id && <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 2: Fecha, Horario & Recurrencia */}
          {step === 2 && (
            <>
              <div>
                <label className={labelCls}>Fecha</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.date}
                  min={toDateStr(new Date())}
                  onChange={e => { set('date', e.target.value); set('startTime', ''); }}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Horario disponible
                  {fetchingSlots && <Loader2 className="w-3 h-3 inline ml-2 animate-spin text-brand-400" />}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((slot: any) => (
                    <button
                      key={slot.startTime}
                      onClick={() => set('startTime', slot.startTime)}
                      className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all ${form.startTime === slot.startTime ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-700 border-slate-100 hover:border-brand-300 hover:bg-brand-50'}`}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              </div>

              <RecurrencePicker value={recurrence} onChange={setRecurrence} startDate={form.date} />
            </>
          )}

          {/* STEP 3: Cliente & Notas */}
          {step === 3 && (
            <>
              <div>
                <label className={labelCls}>Buscar Cliente</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    className={`${inputCls} pl-10`}
                    placeholder="Nombre o teléfono..."
                    value={form.clientSearch}
                    onChange={e => { set('clientSearch', e.target.value); set('clientId', ''); }}
                  />
                </div>
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {filteredClients.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => { set('clientId', c.id); set('clientSearch', c.name); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${form.clientId === c.id ? 'border-brand-600 bg-brand-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {c.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.phone}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Notas</label>
                <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Aclaraciones..." value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-sm space-y-3">
                <p className="font-bold text-slate-900 text-sm">Resumen</p>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Fecha</span><span className="font-semibold text-slate-900">{form.date} {form.startTime}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Profesional</span><span className="font-semibold text-slate-900">{selectedProfessional?.name}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Servicio</span><span className="font-semibold text-slate-900">{selectedService?.name}</span></div>
              </div>
            </>
          )}
        </div>

        {/* Footer navigation */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <button onClick={step > 1 ? () => setStep(s => (s - 1) as Step) : onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-white transition-all">
            {step > 1 ? 'Atrás' : 'Cancelar'}
          </button>

          <button
            onClick={step < 3 ? () => setStep(s => (s + 1) as Step) : handleSubmit}
            disabled={createMutation.isPending || (step === 3 && !form.clientId)}
            className="px-6 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/20"
          >
            {createMutation.isPending ? 'Guardando...' : step < 3 ? 'Siguiente' : 'Confirmar'}
          </button>
        </div>

        {error && <p className="text-center text-xs text-red-500 pb-4">{error}</p>}
      </div>
    </div>
  );
}
