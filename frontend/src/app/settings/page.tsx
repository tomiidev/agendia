'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../providers/AuthProvider';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import apiFetch from '../../lib/api/client';
import {
  Building2,
  Clock,
  Palette,
  Save,
  CheckCircle2,
  AlertCircle,
  Globe,
  Phone,
  Mail,
  MapPin,
  FileText,
  Hash,
  ChevronRight,
} from 'lucide-react';

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

const defaultHours = {
  days: [
    { dayOfWeek: 0, isOpen: false, slots: [{ startTime: '09:00', endTime: '18:00' }] },
    { dayOfWeek: 1, isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
    { dayOfWeek: 2, isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
    { dayOfWeek: 3, isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
    { dayOfWeek: 4, isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
    { dayOfWeek: 5, isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
    { dayOfWeek: 6, isOpen: true, slots: [{ startTime: '09:00', endTime: '15:00' }] },
  ],
};

type SectionId = 'general' | 'hours' | 'appearance';

function SectionTab({ id, label, icon: Icon, active, onClick }: { id: SectionId; label: string; icon: any; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all w-full text-left ${active ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
      <Icon className="w-4 h-4 shrink-0" />{label}
    </button>
  );
}

export default function SettingsPage() {
  const { activeBusiness } = useAuth();
  const queryClient = useQueryClient();
  const [section, setSection] = useState<SectionId>('general');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [general, setGeneral] = useState({ name: '', type: '', description: '', phone: '', email: '', address: '' });
  const [hours, setHours] = useState(defaultHours);
  const [calendarSettings, setCalendarSettings] = useState({
    primaryColor: '#7C3AED',
    theme: 'system',
    viewMode: 'week',
    showWeekends: true,
  });

  const { data: business, isLoading } = useQuery({
    queryKey: ['business-settings', activeBusiness?.id],
    queryFn: () => apiFetch('/businesses/my'),
    enabled: !!activeBusiness?.id,
  });

  useEffect(() => {
    if (!business) return;
    setGeneral({ name: business.name || '', type: business.type || '', description: business.description || '', phone: business.phone || '', email: business.email || '', address: business.address || '' });
    if (business.settings?.businessHours) setHours(business.settings.businessHours);
    if (business.settings?.calendar) setCalendarSettings(business.settings.calendar);
  }, [business]);

  // Update mutation logic
  const updateMutation = useMutation({
    mutationFn: (data: any) => apiFetch('/businesses/my', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });
      setSaved(true);
      setSaveError('');
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e: any) => setSaveError(e.message),
  });

  const handleSave = () => {
    setSaveError('');
    if (!business) return;
    updateMutation.mutate({
      name: general.name,
      slug: business.slug,
      type: general.type,
      description: general.description,
      phone: general.phone,
      email: general.email,
      address: general.address,
      settings: { 
        businessHours: hours, 
        timezone: business.settings?.timezone || 'America/Argentina/Buenos_Aires', 
        calendar: calendarSettings 
      },
    });
  };

  const toggleDay = (idx: number) => {
    setHours(prev => ({
      days: prev.days.map((d, i) => {
        if (i === idx) {
          const newIsOpen = !d.isOpen;
          // Si abrimos, nos aseguramos de tener al menos un slot.
          // Si estaba cerrado y no tenía slots, lo inicializamos.
          const currentSlots = d.slots && d.slots.length > 0 ? d.slots : [{ startTime: '09:00', endTime: '18:00' }];
          return { ...d, isOpen: newIsOpen, slots: newIsOpen ? currentSlots : [] };
        }
        return d;
      })
    }));
  };

  const setSlotTime = (dayIdx: number, slotIdx: number, field: 'startTime' | 'endTime', value: string) => {
    setHours(prev => ({
      days: prev.days.map((d, i) => {
        if (i === dayIdx) {
          const newSlots = [...d.slots];
          newSlots[slotIdx] = { ...newSlots[slotIdx], [field]: value };
          return { ...d, slots: newSlots };
        }
        return d;
      })
    }));
  };

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all';
  const labelCls = 'block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5';

  const sections: { id: SectionId; label: string; icon: any }[] = [
    { id: 'general', label: 'Informacion General', icon: Building2 },
    { id: 'hours', label: 'Horarios de Atencion', icon: Clock },
  ];

  const [activeMobileSection, setActiveMobileSection] = useState<SectionId | null>(null);

  // ... (rest of the component state and logic)

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {activeMobileSection ? (
              <button onClick={() => setActiveMobileSection(null)} className="sm:hidden mr-2">←</button>
            ) : null}
            {activeMobileSection
              ? sections.find(s => s.id === activeMobileSection)?.label
              : 'Configuracion'}
          </h1>
          {!activeMobileSection && (
            <p className="text-sm text-slate-500 mt-0.5">Administra los datos y preferencias de tu negocio</p>
          )}
        </div>
      </div>

      {saveError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-100 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />{saveError}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex gap-6">
        {/* Sidebar (desktop) / Mobile Menu */}
        <aside className={`w-full sm:w-52 shrink-0 ${activeMobileSection ? 'hidden sm:block' : 'block'}`}>
          <div className="bg-white rounded-2xl border border-slate-100 p-2 shadow-premium flex flex-col gap-1">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => { setSection(s.id); setActiveMobileSection(s.id); }}
                className={`flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all w-full text-left ${section === s.id ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
              >
                <span className="flex items-center gap-2">
                  <s.icon className="w-4 h-4 shrink-0" />{s.label}
                </span>
                <ChevronRight className="w-4 h-4 sm:hidden" />
              </button>
            ))}
          </div>
          {/* Save Button (Desktop Sidebar) */}
          <div className="hidden sm:block mt-4">
            <button onClick={handleSave} disabled={updateMutation.isPending || isLoading} className="flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors shadow-sm disabled:opacity-50">
              {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {updateMutation.isPending ? 'Guardando...' : saved ? 'Guardado!' : 'Guardar'}
            </button>
          </div>
        </aside>

        {/* Content Panel (desktop) / Mobile Screen */}
        <div className={`flex-1 min-w-0 ${activeMobileSection ? 'block' : 'hidden sm:block'}`}>
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-premium skeleton-shimmer h-64" />
          ) : (
            <>
              {/* SECTION CONTENT RENDERER */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-premium">
                {section === 'general' && (
                  <div className="space-y-5">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base pb-3 border-b border-slate-50"><Building2 className="w-4 h-4 text-brand-500" />Informacion General</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className={labelCls}><FileText className="w-3 h-3 inline mr-1" />Nombre del Negocio</label>
                        <input className={inputCls} value={general.name} onChange={e => setGeneral(p => ({ ...p, name: e.target.value }))} placeholder="Nombre de tu negocio" />
                      </div>
                      <div>
                        <label className={labelCls}><Hash className="w-3 h-3 inline mr-1" />Slug (URL)</label>
                        <input className={`${inputCls} bg-slate-50 text-slate-400 cursor-not-allowed`} value={business?.slug || ''} readOnly title="El slug no puede modificarse" />
                        <p className="text-[10px] text-slate-400 mt-1">miturno.uy/<span className="font-mono text-slate-600">{business?.slug}</span></p>
                      </div>
                      <div>
                        <label className={labelCls}><Globe className="w-3 h-3 inline mr-1" />Tipo de Negocio</label>
                        <input className={inputCls} value={general.type} onChange={e => setGeneral(p => ({ ...p, type: e.target.value }))} placeholder="barberia, spa, dentista..." />
                      </div>
                      <div>
                        <label className={labelCls}><Phone className="w-3 h-3 inline mr-1" />Telefono</label>
                        <input className={inputCls} value={general.phone} onChange={e => setGeneral(p => ({ ...p, phone: e.target.value }))} placeholder="+54 11 1234-5678" />
                      </div>
                      <div>
                        <label className={labelCls}><Mail className="w-3 h-3 inline mr-1" />Email</label>
                        <input type="email" className={inputCls} value={general.email} onChange={e => setGeneral(p => ({ ...p, email: e.target.value }))} placeholder="negocio@ejemplo.com" />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelCls}><MapPin className="w-3 h-3 inline mr-1" />Direccion</label>
                        <input className={inputCls} value={general.address} onChange={e => setGeneral(p => ({ ...p, address: e.target.value }))} placeholder="Av. Corrientes 1234, CABA" />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelCls}>Descripcion</label>
                        <textarea className={`${inputCls} resize-none`} rows={3} value={general.description} onChange={e => setGeneral(p => ({ ...p, description: e.target.value }))} placeholder="Describe brevemente tu negocio..." />
                      </div>
                    </div>
                  </div>
                )}
                {section === 'hours' && (
                  <div className="space-y-4">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base pb-3 border-b border-slate-50"><Clock className="w-4 h-4 text-brand-500" />Horarios de Atencion</h2>
                    <div className="space-y-3">
                      {hours.days.map((day, i) => (
                        <div key={i} className={`flex flex-col sm:flex-row items-center gap-3 p-4 rounded-xl border transition-all ${day.isOpen ? 'bg-white border-slate-100' : 'bg-slate-50/50 border-slate-100 opacity-60'}`}>
                          <div className="w-full sm:w-24 shrink-0 flex justify-between sm:block">
                            <span className="text-xs font-semibold text-slate-700">{DAY_LABELS[i]}</span>
                            <span className={`text-[10px] font-medium sm:hidden ${day.isOpen ? 'text-emerald-600' : 'text-slate-400'}`}>{day.isOpen ? 'Abierto' : 'Cerrado'}</span>
                          </div>
                          
                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
                            <button
                              onClick={() => toggleDay(i)}
                              className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${day.isOpen ? 'bg-brand-500' : 'bg-slate-200'}`}
                              aria-label={`Toggle ${DAY_LABELS[i]}`}
                            >
                              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${day.isOpen ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                            <span className={`text-xs font-medium shrink-0 w-14 hidden sm:block ${day.isOpen ? 'text-emerald-600' : 'text-slate-400'}`}>{day.isOpen ? 'Abierto' : 'Cerrado'}</span>
                          </div>
                          
                          {day.isOpen && (
                            <div className="flex items-center gap-2 w-full sm:flex-1 justify-center sm:justify-start">
                              {day.slots.map((slot, sIdx) => (
                                <div key={sIdx} className="flex items-center gap-2">
                                  <input type="time" className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm sm:text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 w-28 sm:w-auto" value={slot.startTime} onChange={e => setSlotTime(i, sIdx, 'startTime', e.target.value)} />
                                  <span className="text-slate-300 text-xs">-</span>
                                  <input type="time" className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm sm:text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 w-28 sm:w-auto" value={slot.endTime} onChange={e => setSlotTime(i, sIdx, 'endTime', e.target.value)} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {section === 'appearance' && (
                  <div className="space-y-6">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base pb-3 border-b border-slate-50"><Palette className="w-4 h-4 text-brand-500" />Apariencia</h2>
                    <div>
                      <label className={labelCls}>Color del Calendario</label>
                      <div className="flex items-center gap-4">
                        <input type="color" value={calendarSettings.primaryColor} onChange={e => setCalendarSettings(p => ({ ...p, primaryColor: e.target.value }))} className="w-16 h-16 rounded-2xl border-2 border-slate-200 cursor-pointer p-1 bg-white" />
                        <div className="flex gap-2 flex-wrap">
                          {['#7C3AED', '#DB2777', '#2563EB', '#059669', '#D97706', '#DC2626', '#0891B2'].map(c => (
                            <button key={c} onClick={() => setCalendarSettings(p => ({ ...p, primaryColor: c }))} className={`w-8 h-8 rounded-xl border-2 transition-all hover:scale-110 ${calendarSettings.primaryColor === c ? 'border-slate-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* New settings UI */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Tema visual</label>
                            <select className={inputCls} value={calendarSettings.theme} onChange={e => setCalendarSettings(p => ({ ...p, theme: e.target.value }))}>
                                <option value="light">Claro</option>
                                <option value="dark">Oscuro</option>
                                <option value="system">Sistema</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Vista predeterminada</label>
                            <select className={inputCls} value={calendarSettings.viewMode} onChange={e => setCalendarSettings(p => ({ ...p, viewMode: e.target.value }))}>
                                <option value="day">Dia</option>
                                <option value="week">Semana</option>
                                <option value="month">Mes</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500" checked={calendarSettings.showWeekends} onChange={e => setCalendarSettings(p => ({ ...p, showWeekends: e.target.checked }))} />
                            <label className="text-sm text-slate-700">Mostrar fines de semana</label>
                        </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button (Mobile) */}
              {activeMobileSection && (
                <div className="mt-6 sm:hidden">
                  <button onClick={handleSave} disabled={updateMutation.isPending || isLoading} className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors shadow-sm disabled:opacity-50">
                    {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {updateMutation.isPending ? 'Guardando...' : saved ? 'Guardado!' : 'Guardar Cambios'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
