'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../providers/AuthProvider';
import apiFetch from '../../lib/api/client';
import { Scissors, X, Loader2, AlertCircle, Check, Plus } from 'lucide-react';

export function AddServiceModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { activeBusiness } = useAuth();
  const [form, setForm] = useState({
    name: '', description: '', category: '', price: '', duration: '30', bufferBefore: '0', bufferAfter: '0',
    bookingMode: 'DIRECT',
    professionalsConfig: [] as { professionalId: string, availabilityDays: number[] }[],
  });
  const [error, setError] = useState('');

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

  const createMutation = useMutation({
    mutationFn: (data: any) => apiFetch('/services', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: any) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || form.name.length < 2) { setError('El nombre debe tener al menos 2 caracteres.'); return; }
    if (!form.category) { setError('La categoría es obligatoria.'); return; }
    if (!form.price || isNaN(Number(form.price))) { setError('El precio debe ser un número válido.'); return; }
    if (form.professionalsConfig.length === 0) { setError('Debes asignar al menos un profesional.'); return; }

    createMutation.mutate({
      name: form.name,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      duration: Number(form.duration),
      bufferBefore: Number(form.bufferBefore),
      bufferAfter: Number(form.bufferAfter),
      bookingMode: form.bookingMode,
      professionalsConfig: form.professionalsConfig,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] sm:max-h-[75vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-brand-600" />
            </div>
            <h2 className="font-bold text-slate-800">Nuevo Servicio</h2>
          </div>
          <button data-testid="add-service-close" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 font-medium flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Nombre del Servicio *', key: 'name', type: 'text', placeholder: 'Ej. Corte de Cabello', col2: true },
              { label: 'Categoría *', key: 'category', type: 'text', placeholder: 'Ej. Corte, Coloración...', col2: false },
              { label: 'Precio ($) *', key: 'price', type: 'number', placeholder: '2500', col2: false },
              { label: 'Duración (min)', key: 'duration', type: 'number', placeholder: '30', col2: false },
              { label: 'Buffer Antes (min)', key: 'bufferBefore', type: 'number', placeholder: '0', col2: false },
              { label: 'Buffer Después (min)', key: 'bufferAfter', type: 'number', placeholder: '0', col2: false },
            ].map(({ label, key, type, placeholder, col2 }) => (
              <div key={key} className={col2 ? 'col-span-2' : ''}>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
                <input
                  type={type}
                  value={(form as any)[key]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all"
                />
              </div>
            ))}

            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Modo de Contratación *</label>
              <select
                value={form.bookingMode}
                onChange={(e) => setForm((p) => ({ ...p, bookingMode: e.target.value }))}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all"
              >
                <option value="DIRECT">Reservar turno directamente</option>
                <option value="QUOTE">Pedir presupuesto solamente</option>
                <option value="BOTH">Ambos (Reservar o Pedir presupuesto)</option>
              </select>
            </div>

            <div className="col-span-2">
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
                <div className="space-y-2 mt-1">
                  {professionals.map((prof: any) => {
                    const config = form.professionalsConfig.find(pc => pc.professionalId === prof.id);
                    return (
                      <div key={prof.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                        <button
                          data-testid={`prof-toggle-${prof.id}`}
                          type="button"
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
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Descripción</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Descripción breve del servicio..."
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all resize-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Crear Servicio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
