'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../providers/AuthProvider';
import apiFetch from '../../lib/api/client';
import {
  Scissors, Edit3, X,
  Save, Loader2, AlertCircle, ToggleLeft, ToggleRight,
  Tag, FileText, Timer, XCircle,
  Check, DollarSign, Clock,
} from 'lucide-react';
import { getCategoryColor } from './utils';

export function ServiceDrawer({
  service,
  onClose,
  onUpdated,
}: {
  service: any;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const queryClient = useQueryClient();
  const { activeBusiness } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: service.name || '',
    description: service.description || '',
    category: service.category || '',
    price: String(service.price ?? ''),
    duration: String(service.duration ?? '30'),
    bufferBefore: String(service.bufferBefore ?? '0'),
    bufferAfter: String(service.bufferAfter ?? '0'),
    bookingMode: service.bookingMode || 'DIRECT',
    professionalsConfig: (service.professionalsConfig || []) as { professionalId: string, availabilityDays: number[] }[],
  });
  const [formError, setFormError] = useState('');

  const toggleProfessional = (profId: string) => {
    setForm(p => {
      const exists = p.professionalsConfig.find(pc => pc.professionalId === profId);
      const updated = exists
        ? p.professionalsConfig.filter(pc => pc.professionalId !== profId)
        : [...p.professionalsConfig, { professionalId: profId, availabilityDays: [0, 1, 2, 3, 4, 5, 6] }];
      return { ...p, professionalsConfig: updated };
    });
  };

  const setProfessionalDays = (profId: string, days: number[]) => {
    setForm(p => ({
      ...p,
      professionalsConfig: p.professionalsConfig.map(pc =>
        pc.professionalId === profId ? { ...pc, availabilityDays: days } : pc
      )
    }));
  };

  const { data: professionals = [], isLoading: isLoadingProfessionals } = useQuery({
    queryKey: ['professionals', activeBusiness?.id],
    queryFn: () => apiFetch('/professionals'),
    enabled: !!activeBusiness?.id,
  });

  const { data: fetchedService, isLoading, error } = useQuery({
    queryKey: ['service', service.id],
    queryFn: () => apiFetch(`/services/${service.id}`),
    enabled: !!service.id,
  });

  React.useEffect(() => {
    if (fetchedService) {
      setForm({
        name: fetchedService.name || '',
        description: fetchedService.description || '',
        category: fetchedService.category || '',
        price: String(fetchedService.price ?? ''),
        duration: String(fetchedService.duration ?? '30'),
        bufferBefore: String(fetchedService.bufferBefore ?? '0'),
        bufferAfter: String(fetchedService.bufferAfter ?? '0'),
        bookingMode: fetchedService.bookingMode || 'DIRECT',
        professionalsConfig: (fetchedService.professionalsConfig || []) as { professionalId: string, availabilityDays: number[] }[],
      });
    }
  }, [fetchedService]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) =>
      apiFetch(`/services/${service.id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service', service.id] });
      setEditing(false);
      onUpdated();
    },
    onError: (e: any) => setFormError(e.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (newActiveState: boolean) =>
      apiFetch(`/services/${service.id}`, {
        method: 'PUT',
        body: JSON.stringify({ active: newActiveState }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service', service.id] });
      onUpdated();
    },
    onError: (e: any) => setFormError(e.message),
  });

  const handleSave = () => {
    setFormError('');
    
    // Perform validation
    if (!form.name || form.name.length < 2) { 
        setFormError('El nombre debe tener al menos 2 caracteres.'); 
        return; 
    }
    if (!form.category) { 
        setFormError('La categoría es obligatoria.'); 
        return; 
    }
    if (!form.price || isNaN(Number(form.price))) { 
        setFormError('El precio debe ser un número válido.'); 
        return; 
    }
    if (form.professionalsConfig.length === 0) { 
      setFormError('Debes asignar al menos un profesional.'); 
      return; 
    }

    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      duration: Number(form.duration),
      bufferBefore: Number(form.bufferBefore),
      bufferAfter: Number(form.bufferAfter),
      bookingMode: form.bookingMode,
      professionalsConfig: form.professionalsConfig,
    };

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
        <div className="w-full max-w-md bg-white shadow-2xl flex flex-col justify-center items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-sm text-slate-500 font-medium">Cargando servicio...</p>
        </div>
      </div>
    );
  }

  if (error || !fetchedService) {
    return (
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
        <div className="w-full max-w-md bg-white shadow-2xl flex flex-col p-5 gap-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="font-bold text-slate-800">Error</h2>
            <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
            <XCircle className="w-12 h-12 text-red-400" />
            <p className="text-sm font-semibold text-slate-700">No se pudo cargar el servicio</p>
            <p className="text-xs text-slate-400">{(error as any)?.message || 'Error inesperado.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const activeService = fetchedService;
  const catColor = getCategoryColor(activeService.category || '');
  const configs = activeService.professionalsConfig || [];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
              <Scissors className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm leading-tight">{activeService.name}</h2>
              {activeService.category && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${catColor}`}>
                  {activeService.category}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setEditing(!editing); setFormError(''); }}
              title={editing ? 'Cancelar edición' : 'Editar servicio'}
              className={`p-2 rounded-lg transition-colors ${editing ? 'bg-slate-100 text-slate-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button data-testid="drawer-close" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ── EDIT MODE ── */}
          {editing ? (
            <div className="p-5 space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Editar Servicio</p>
              {formError && (
                <div data-testid="service-error" className="rounded-xl bg-red-50 p-3 text-xs text-red-600 font-medium flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{formError}
                </div>
              )}
              {[
                { label: 'Nombre', key: 'name', type: 'text', placeholder: 'Ej. Corte de Cabello' },
                { label: 'Categoría', key: 'category', type: 'text', placeholder: 'Ej. Corte, Coloración...' },
                { label: 'Precio ($)', key: 'price', type: 'number', placeholder: '2500' },
                { label: 'Duración (min)', key: 'duration', type: 'number', placeholder: '30' },
                { label: 'Buffer Antes (min)', key: 'bufferBefore', type: 'number', placeholder: '0' },
                { label: 'Buffer Después (min)', key: 'bufferAfter', type: 'number', placeholder: '0' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
                  <input
                    type={type}
                    value={(form as any)[key]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Modo de Contratación *</label>
                <select
                  value={form.bookingMode}
                  onChange={(e) => setForm((p) => ({ ...p, bookingMode: e.target.value }))}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all"
                >
                  <option value="DIRECT">Reservar turno directamente</option>
                  <option value="QUOTE">Pedir presupuesto solamente</option>
                  <option value="BOTH">Ambos (Reservar o Pedir presupuesto)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Descripción breve del servicio..."
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Profesionales y días de disponibilidad
                </label>
                {isLoadingProfessionals ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando profesionales...
                  </div>
                ) : professionals.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No hay profesionales registrados aún.</p>
                ) : (
                  <div className="space-y-4">
                    {professionals.map((prof: any) => {
                      const config = form.professionalsConfig.find(pc => pc.professionalId === prof.id);
                      return (
                        <div key={prof.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                          <button
                            type="button"
                            data-testid={`prof-toggle-${prof.id}`}
                            onClick={() => toggleProfessional(prof.id)}
                            className="flex items-center gap-2 w-full text-left"
                          >
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center ${config ? 'bg-brand-600' : 'bg-slate-200'}`}
                            >
                              {config && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{prof.name}</span>
                          </button>
                          
                          {config && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, i) => {
                                const isSelected = config.availabilityDays.includes(i);
                                const toggleDay = () => {
                                  const newDays = isSelected
                                    ? config.availabilityDays.filter(d => d !== i)
                                    : [...config.availabilityDays, i].sort();
                                  setProfessionalDays(prof.id, newDays);
                                };
                                return (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={toggleDay}
                                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-semibold transition-all ${
                                      isSelected
                                        ? 'bg-brand-600 text-white'
                                        : 'bg-white border border-slate-200 text-slate-500 hover:border-brand-300'
                                    }`}
                                  >
                                    {day[0]}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors disabled:opacity-50"
              >
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Cambios
              </button>
            </div>
          ) : (
            /* ── VIEW MODE ── */
            <div className="divide-y divide-slate-50">
              {/* Stats */}
              <div className="grid grid-cols-3 divide-x divide-slate-100">
                {[
                  { label: 'Precio', value: `$${(activeService.price ?? 0).toLocaleString('es-AR')}`, icon: DollarSign },
                  { label: 'Duración', value: `${activeService.duration ?? 0} min`, icon: Clock },
                  { label: 'Estado', value: activeService.active ? 'Activo' : 'Inactivo', icon: activeService.active ? ToggleRight : ToggleLeft },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="p-4 text-center">
                    <Icon className="w-4 h-4 text-slate-300 mx-auto mb-1" />
                    <p className="text-sm font-bold text-slate-800">{value}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Details */}
              <div className="p-5 space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detalles</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Tag className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-400">Categoría</p>
                      <p className="text-sm font-medium text-slate-700">{activeService.category || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Timer className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-400">Buffer (antes / después)</p>
                      <p className="text-sm font-medium text-slate-700">
                        {activeService.bufferBefore ?? 0} min / {activeService.bufferAfter ?? 0} min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-400">Modo de Contratación</p>
                      <p className="text-sm font-medium text-slate-700">
                        {activeService.bookingMode === 'QUOTE' 
                          ? 'Solo presupuesto (QUOTE)' 
                          : activeService.bookingMode === 'BOTH' 
                            ? 'Ambos (DIRECT & QUOTE)' 
                            : 'Reservas directas (DIRECT)'}
                      </p>
                    </div>
                  </div>
                  {activeService.description && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-slate-400">Descripción</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{activeService.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Professionals */}
              <div className="p-5 space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Profesionales y Días</p>
                {isLoadingProfessionals ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando...
                  </div>
                ) : professionals.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No hay profesionales registrados aún.</p>
                ) : (
                  <div className="space-y-4">
                    {professionals.map((prof: any) => {
                      const config = configs.find((pc: any) => pc.professionalId === prof.id);
                      if (!config) return null;
                      return (
                        <div key={prof.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                            <span className="text-sm font-semibold text-slate-700">{prof.name}</span>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, i) => {
                                const isSelected = config.availabilityDays.includes(i);
                                return (
                                  <div
                                    key={i}
                                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-semibold ${
                                      isSelected
                                        ? 'bg-brand-600 text-white'
                                        : 'bg-white border border-slate-200 text-slate-400'
                                    }`}
                                  >
                                    {day[0]}
                                  </div>
                                );
                              })}
                            </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Toggle active */}
              <div className="p-5">
                <button
                  onClick={() => toggleActiveMutation.mutate(!activeService.active)}
                  disabled={toggleActiveMutation.isPending}
                  className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${activeService.active
                    ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                >
                  {toggleActiveMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : activeService.active
                      ? <ToggleLeft className="w-4 h-4" />
                      : <ToggleRight className="w-4 h-4" />
                  }
                  {activeService.active ? 'Desactivar Servicio' : 'Activar Servicio'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
