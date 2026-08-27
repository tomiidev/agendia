'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../providers/AuthProvider';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import apiFetch, { apiFetchPaginated } from '../../lib/api/client';
import {
  Ticket, Sparkles, Plus, X, Tag, Percent, DollarSign, Calendar,
  Clock, Users, Hash, ChevronRight, AlertCircle, Search, Edit3, Save,
  Loader2, ToggleLeft, ToggleRight, FileText, XCircle, Scissors,
} from 'lucide-react';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function formatDiscount(type: string, value: number) {
  return type === 'PERCENTAGE' ? `${value}%` : `$${value.toLocaleString('es-AR')}`;
}

function TypeBadge({ type }: { type: string }) {
  const isPerc = type === 'PERCENTAGE';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${isPerc ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
      {isPerc ? <Percent className="w-2.5 h-2.5" /> : <DollarSign className="w-2.5 h-2.5" />}
      {isPerc ? 'Porcentaje' : 'Fijo'}
    </span>
  );
}

const inputCls = 'block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all';
const labelCls = 'block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1';

// ─── SKELETON ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-premium space-y-3">
      <div className="h-3 w-24 rounded skeleton-shimmer" />
      <div className="h-4 w-36 rounded skeleton-shimmer" />
      <div className="h-3 w-28 rounded skeleton-shimmer" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUPONES
// ═══════════════════════════════════════════════════════════════════════════════

function CouponCard({ coupon, onClick }: { coupon: any; onClick: () => void }) {
  const usagePercent = coupon.maxUses ? Math.round((coupon.usedCount / coupon.maxUses) * 100) : 0;
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border ${coupon.active ? 'border-slate-100' : 'border-slate-100 opacity-60'} p-5 shadow-premium hover:shadow-premium-lg transition-all cursor-pointer group`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
            <Tag className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-slate-900 text-sm tracking-wider">{coupon.code}</span>
              <TypeBadge type={coupon.type} />
              {!coupon.active && (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">Inactivo</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Descuento: <span className="font-semibold text-slate-700">{formatDiscount(coupon.type, coupon.value)}</span>
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors shrink-0 mt-1" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-300" />
          <span>{coupon.startDate} → {coupon.endDate}</span>
        </div>
        {coupon.maxUses && (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-slate-300" />Usos: {coupon.usedCount} / {coupon.maxUses}</span>
              <span className="text-[10px] text-slate-400">{usagePercent}%</span>
            </div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-400 rounded-full transition-all" style={{ width: `${usagePercent}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COUPON DRAWER ────────────────────────────────────────────────────────────

function CouponDrawer({ coupon, onClose, onUpdated }: { coupon: any; onClose: () => void; onUpdated: () => void }) {
  const queryClient = useQueryClient();
  const { activeBusiness } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState('');

  const { data: services = [] } = useQuery({
    queryKey: ['services', activeBusiness?.id],
    queryFn: () => apiFetch('/services'),
    enabled: !!activeBusiness?.id,
  });

  const { data: fetchedCoupon, isLoading, error } = useQuery({
    queryKey: ['coupon', coupon.id],
    queryFn: () => apiFetch(`/coupons/${coupon.id}`),
    enabled: !!coupon.id,
  });

  const [form, setForm] = useState({
    code: coupon.code || '',
    type: coupon.type || 'PERCENTAGE',
    value: String(coupon.value ?? ''),
    startDate: coupon.startDate || '',
    endDate: coupon.endDate || '',
    maxUses: String(coupon.maxUses ?? ''),
    maxUsesPerClient: String(coupon.maxUsesPerClient ?? ''),
    minPurchaseAmount: String(coupon.minPurchaseAmount ?? '0'),
    specificServices: (coupon.specificServices || []) as string[],
    description: coupon.description || '',
  });

  React.useEffect(() => {
    if (fetchedCoupon) {
      setForm({
        code: fetchedCoupon.code || '',
        type: fetchedCoupon.type || 'PERCENTAGE',
        value: String(fetchedCoupon.value ?? ''),
        startDate: fetchedCoupon.startDate || '',
        endDate: fetchedCoupon.endDate || '',
        maxUses: String(fetchedCoupon.maxUses ?? ''),
        maxUsesPerClient: String(fetchedCoupon.maxUsesPerClient ?? ''),
        minPurchaseAmount: String(fetchedCoupon.minPurchaseAmount ?? '0'),
        specificServices: (fetchedCoupon.specificServices || []) as string[],
        description: fetchedCoupon.description || '',
      });
    }
  }, [fetchedCoupon]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => apiFetch(`/coupons/${coupon.id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupon', coupon.id] });
      setEditing(false);
      onUpdated();
    },
    onError: (e: any) => setFormError(e.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (active: boolean) => apiFetch(`/coupons/${coupon.id}`, { method: 'PUT', body: JSON.stringify({ active }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupon', coupon.id] });
      onUpdated();
    },
    onError: (e: any) => setFormError(e.message),
  });

  const handleSave = () => {
    setFormError('');
    if (!form.code || form.code.length < 3) { setFormError('El código debe tener al menos 3 caracteres.'); return; }
    if (!form.value || isNaN(Number(form.value))) { setFormError('El valor debe ser un número válido.'); return; }
    updateMutation.mutate({
      code: form.code.toUpperCase(),
      type: form.type,
      value: Number(form.value),
      startDate: form.startDate,
      endDate: form.endDate,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      maxUsesPerClient: form.maxUsesPerClient ? Number(form.maxUsesPerClient) : null,
      minPurchaseAmount: form.minPurchaseAmount ? Number(form.minPurchaseAmount) : 0,
      specificServices: form.specificServices,
      description: form.description || null,
    });
  };

  const handleToggleService = (serviceId: string) => {
    setForm(p => {
      const exists = p.specificServices.includes(serviceId);
      return { ...p, specificServices: exists ? p.specificServices.filter(id => id !== serviceId) : [...p.specificServices, serviceId] };
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
        <div className="w-full max-w-md bg-white shadow-2xl flex flex-col justify-center items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-sm text-slate-500 font-medium">Cargando cupón...</p>
        </div>
      </div>
    );
  }

  if (error || !fetchedCoupon) {
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
            <p className="text-sm font-semibold text-slate-700">No se pudo cargar el cupón</p>
            <p className="text-xs text-slate-400">{(error as any)?.message || 'Error inesperado.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const active = fetchedCoupon;
  const usagePercent = active.maxUses ? Math.round((active.usedCount / active.maxUses) * 100) : 0;
  const assignedServices = services.filter((s: any) => active.specificServices?.includes(s.id));

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm leading-tight font-mono tracking-wider">{active.code}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <TypeBadge type={active.type} />
                {!active.active && (
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full">Inactivo</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setEditing(!editing); setFormError(''); }}
              className={`p-2 rounded-lg transition-colors ${editing ? 'bg-slate-100 text-slate-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {editing ? (
            /* ── EDIT MODE ── */
            <div className="p-5 space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Editar Cupón</p>
              {formError && (
                <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 font-medium flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Código</label>
                  <input className={inputCls} value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <label className={labelCls}>Tipo</label>
                  <select className={inputCls} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                    <option value="PERCENTAGE">Porcentaje (%)</option>
                    <option value="FIXED">Monto fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Valor {form.type === 'PERCENTAGE' ? '(%)' : '($)'}</label>
                  <input type="number" min={1} className={inputCls} value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Fecha Inicio</label>
                  <input type="date" className={inputCls} value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Fecha Fin</label>
                  <input type="date" className={inputCls} value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Máx. Usos Totales</label>
                  <input type="number" min={1} className={inputCls} placeholder="Sin límite" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Máx. Usos por Cliente</label>
                  <input type="number" min={1} className={inputCls} placeholder="Sin límite" value={form.maxUsesPerClient} onChange={e => setForm(p => ({ ...p, maxUsesPerClient: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Mínimo de Compra ($)</label>
                  <input type="number" min={0} className={inputCls} placeholder="0" value={form.minPurchaseAmount} onChange={e => setForm(p => ({ ...p, minPurchaseAmount: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Descripción (opcional)</label>
                  <textarea rows={2} className={`${inputCls} resize-none`} placeholder="Descripción interna del cupón..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
              </div>

              {services.length > 0 && (
                <div>
                  <label className={labelCls}>Válido solo para servicios (vacío = todos)</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {services.map((s: any) => {
                      const selected = form.specificServices.includes(s.id);
                      return (
                        <button key={s.id} type="button" onClick={() => handleToggleService(s.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-xs transition-all ${selected ? 'border-brand-500 bg-brand-50/50 text-brand-900 font-semibold shadow-sm' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                          <Scissors className="w-3 h-3 shrink-0" />
                          <span className="truncate">{s.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button onClick={handleSave} disabled={updateMutation.isPending}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors disabled:opacity-50">
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
                  { label: 'Descuento', value: formatDiscount(active.type, active.value), icon: active.type === 'PERCENTAGE' ? Percent : DollarSign },
                  { label: 'Usos', value: `${active.usedCount}${active.maxUses ? ' / ' + active.maxUses : ''}`, icon: Hash },
                  { label: 'Estado', value: active.active ? 'Activo' : 'Inactivo', icon: active.active ? ToggleRight : ToggleLeft },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="p-4 text-center">
                    <Icon className="w-4 h-4 text-slate-300 mx-auto mb-1" />
                    <p className="text-sm font-bold text-slate-800">{value}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Usage bar */}
              {active.maxUses && (
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-medium">Progreso de uso</span>
                    <span className="font-bold text-slate-700">{usagePercent}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${usagePercent >= 90 ? 'bg-red-400' : usagePercent >= 60 ? 'bg-amber-400' : 'bg-brand-400'}`} style={{ width: `${usagePercent}%` }} />
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="p-5 space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detalles</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-400">Vigencia</p>
                      <p className="text-sm font-medium text-slate-700">{active.startDate} → {active.endDate}</p>
                    </div>
                  </div>
                  {active.minPurchaseAmount > 0 && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-slate-400">Mínimo de compra</p>
                        <p className="text-sm font-medium text-slate-700">${active.minPurchaseAmount.toLocaleString('es-AR')}</p>
                      </div>
                    </div>
                  )}
                  {active.maxUsesPerClient && (
                    <div className="flex items-start gap-3">
                      <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-slate-400">Usos máx. por cliente</p>
                        <p className="text-sm font-medium text-slate-700">{active.maxUsesPerClient}</p>
                      </div>
                    </div>
                  )}
                  {active.description && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-slate-400">Descripción</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{active.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Specific services */}
              {assignedServices.length > 0 && (
                <div className="p-5 space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Válido solo para</p>
                  <div className="flex flex-wrap gap-2">
                    {assignedServices.map((s: any) => (
                      <div key={s.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-brand-100 bg-brand-50 text-xs text-brand-700 font-medium">
                        <Scissors className="w-3 h-3 shrink-0" />{s.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Toggle active */}
              <div className="p-5">
                <button
                  onClick={() => toggleActiveMutation.mutate(!active.active)}
                  disabled={toggleActiveMutation.isPending}
                  className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${active.active ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                >
                  {toggleActiveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : active.active ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                  {active.active ? 'Desactivar Cupón' : 'Activar Cupón'}
                </button>
                {formError && <p className="text-xs text-red-500 text-center mt-2">{formError}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ADD COUPON MODAL ─────────────────────────────────────────────────────────

const EMPTY_COUPON = { code: '', type: 'PERCENTAGE', value: '', startDate: '', endDate: '', maxUses: '', maxUsesPerClient: '', minPurchaseAmount: '', specificServices: [] as string[], description: '' };

function AddCouponModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { activeBusiness } = useAuth();
  const [form, setForm] = useState(EMPTY_COUPON);
  const [error, setError] = useState('');

  const { data: services = [] } = useQuery({
    queryKey: ['services', activeBusiness?.id],
    queryFn: () => apiFetch('/services'),
    enabled: !!activeBusiness?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiFetch('/coupons', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: any) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!form.code || form.code.length < 3) { setError('El código debe tener al menos 3 caracteres.'); return; }
    if (!form.value || isNaN(Number(form.value))) { setError('El valor debe ser un número válido.'); return; }
    if (!form.startDate || !form.endDate) { setError('Las fechas de inicio y fin son obligatorias.'); return; }
    createMutation.mutate({
      code: form.code.toUpperCase(),
      type: form.type,
      value: Number(form.value),
      startDate: form.startDate,
      endDate: form.endDate,
      maxUses: form.maxUses ? Number(form.maxUses) : undefined,
      maxUsesPerClient: form.maxUsesPerClient ? Number(form.maxUsesPerClient) : undefined,
      minPurchaseAmount: form.minPurchaseAmount ? Number(form.minPurchaseAmount) : 0,
      specificServices: form.specificServices,
      description: form.description || undefined,
    });
  };

  const handleToggleService = (id: string) => setForm(p => ({
    ...p, specificServices: p.specificServices.includes(id) ? p.specificServices.filter(s => s !== id) : [...p.specificServices, id]
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center"><Tag className="w-4 h-4 text-brand-600" /></div>
            <h2 className="font-bold text-slate-800">Nuevo Cupón</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 font-medium flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Código *</label>
              <input className={inputCls} placeholder="BIENVENIDA10" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} required />
            </div>
            <div>
              <label className={labelCls}>Tipo *</label>
              <select className={inputCls} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="PERCENTAGE">Porcentaje (%)</option>
                <option value="FIXED">Monto fijo ($)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Valor {form.type === 'PERCENTAGE' ? '(%)' : '($)'} *</label>
              <input type="number" min={1} className={inputCls} placeholder={form.type === 'PERCENTAGE' ? '10' : '1000'} value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} required />
            </div>
            <div>
              <label className={labelCls}>Fecha Inicio *</label>
              <input type="date" className={inputCls} value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} required />
            </div>
            <div>
              <label className={labelCls}>Fecha Fin *</label>
              <input type="date" className={inputCls} value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} required />
            </div>
            <div>
              <label className={labelCls}>Máx. Usos Totales</label>
              <input type="number" min={1} className={inputCls} placeholder="Sin límite" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Máx. por Cliente</label>
              <input type="number" min={1} className={inputCls} placeholder="Sin límite" value={form.maxUsesPerClient} onChange={e => setForm(p => ({ ...p, maxUsesPerClient: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Mínimo de Compra ($)</label>
              <input type="number" min={0} className={inputCls} placeholder="0" value={form.minPurchaseAmount} onChange={e => setForm(p => ({ ...p, minPurchaseAmount: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Descripción (opcional)</label>
              <textarea rows={2} className={`${inputCls} resize-none`} placeholder="Descripción interna del cupón..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          {services.length > 0 && (
            <div>
              <label className={labelCls}>Válido solo para servicios (vacío = todos)</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {services.map((s: any) => {
                  const selected = form.specificServices.includes(s.id);
                  return (
                    <button key={s.id} type="button" onClick={() => handleToggleService(s.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-xs transition-all ${selected ? 'border-brand-500 bg-brand-50/50 text-brand-900 font-semibold shadow-sm' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                      <Scissors className="w-3 h-3 shrink-0" />
                      <span className="truncate">{s.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={createMutation.isPending} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors disabled:opacity-50">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Crear Cupón
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROMOCIONES
// ═══════════════════════════════════════════════════════════════════════════════

function PromotionCard({ promo, onClick }: { promo: any; onClick: () => void }) {
  const serviceName = promo.serviceId?.name ?? promo.serviceId ?? 'Servicio eliminado';
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border ${promo.active ? 'border-slate-100' : 'border-slate-100 opacity-60'} p-5 shadow-premium hover:shadow-premium-lg transition-all cursor-pointer group`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-slate-900 text-sm">{promo.name}</p>
              {!promo.active && (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">Inactivo</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <ChevronRight className="w-3 h-3" />{typeof serviceName === 'string' ? serviceName : serviceName.name}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors shrink-0 mt-1" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <TypeBadge type={promo.discountType} />
          <span className="text-sm font-bold text-slate-800">{formatDiscount(promo.discountType, promo.discountValue)} OFF</span>
        </div>
        {promo.startDayOfWeek !== undefined && promo.startDayOfWeek !== null && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-300" />
            <span>{DAY_NAMES[promo.startDayOfWeek]}</span>
            {promo.startTime && promo.endTime && (
              <><Clock className="w-3.5 h-3.5 text-slate-300 ml-1" /><span>{promo.startTime} - {promo.endTime}</span></>
            )}
          </div>
        )}
        {promo.forNewClients && (
          <div className="flex items-center gap-1.5 text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg w-fit">
            <Users className="w-3 h-3" />Solo nuevos clientes
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PROMOTION DRAWER ─────────────────────────────────────────────────────────

function PromotionDrawer({ promo, onClose, onUpdated }: { promo: any; onClose: () => void; onUpdated: () => void }) {
  const queryClient = useQueryClient();
  const { activeBusiness } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState('');

  const { data: services = [] } = useQuery({
    queryKey: ['services', activeBusiness?.id],
    queryFn: () => apiFetch('/services'),
    enabled: !!activeBusiness?.id,
  });

  const { data: fetchedPromo, isLoading, error } = useQuery({
    queryKey: ['promotion', promo.id],
    queryFn: () => apiFetch(`/promotions/${promo.id}`),
    enabled: !!promo.id,
  });

  const serviceIdStr = (p: any) => typeof p?.serviceId === 'object' ? p.serviceId?.id ?? '' : p?.serviceId ?? '';

  const [form, setForm] = useState({
    name: promo.name || '',
    serviceId: serviceIdStr(promo),
    discountType: promo.discountType || 'PERCENTAGE',
    discountValue: String(promo.discountValue ?? ''),
    startDayOfWeek: promo.startDayOfWeek !== undefined && promo.startDayOfWeek !== null ? String(promo.startDayOfWeek) : '',
    startTime: promo.startTime || '',
    endTime: promo.endTime || '',
    startDate: promo.startDate || '',
    endDate: promo.endDate || '',
    forNewClients: promo.forNewClients || false,
    description: promo.description || '',
  });

  React.useEffect(() => {
    if (fetchedPromo) {
      setForm({
        name: fetchedPromo.name || '',
        serviceId: serviceIdStr(fetchedPromo),
        discountType: fetchedPromo.discountType || 'PERCENTAGE',
        discountValue: String(fetchedPromo.discountValue ?? ''),
        startDayOfWeek: fetchedPromo.startDayOfWeek !== undefined && fetchedPromo.startDayOfWeek !== null ? String(fetchedPromo.startDayOfWeek) : '',
        startTime: fetchedPromo.startTime || '',
        endTime: fetchedPromo.endTime || '',
        startDate: fetchedPromo.startDate || '',
        endDate: fetchedPromo.endDate || '',
        forNewClients: fetchedPromo.forNewClients || false,
        description: fetchedPromo.description || '',
      });
    }
  }, [fetchedPromo]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => apiFetch(`/promotions/${promo.id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotion', promo.id] });
      setEditing(false);
      onUpdated();
    },
    onError: (e: any) => setFormError(e.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (active: boolean) => apiFetch(`/promotions/${promo.id}`, { method: 'PUT', body: JSON.stringify({ active }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotion', promo.id] });
      onUpdated();
    },
    onError: (e: any) => setFormError(e.message),
  });

  const handleSave = () => {
    setFormError('');
    if (!form.name || form.name.length < 2) { setFormError('El nombre debe tener al menos 2 caracteres.'); return; }
    if (!form.serviceId) { setFormError('Selecciona un servicio.'); return; }
    if (!form.discountValue || isNaN(Number(form.discountValue))) { setFormError('El descuento debe ser un número válido.'); return; }
    updateMutation.mutate({
      name: form.name,
      serviceId: form.serviceId,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      startDayOfWeek: form.startDayOfWeek !== '' ? Number(form.startDayOfWeek) : null,
      startTime: form.startTime || null,
      endTime: form.endTime || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      forNewClients: form.forNewClients,
      description: form.description || null,
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
        <div className="w-full max-w-md bg-white shadow-2xl flex flex-col justify-center items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          <p className="text-sm text-slate-500 font-medium">Cargando promoción...</p>
        </div>
      </div>
    );
  }

  if (error || !fetchedPromo) {
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
            <p className="text-sm font-semibold text-slate-700">No se pudo cargar la promoción</p>
            <p className="text-xs text-slate-400">{(error as any)?.message || 'Error inesperado.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const active = fetchedPromo;
  const serviceName = typeof active.serviceId === 'object' ? active.serviceId?.name : (services.find((s: any) => s.id === active.serviceId)?.name ?? '—');

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm leading-tight">{active.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <TypeBadge type={active.discountType} />
                {!active.active && (
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full">Inactivo</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => { setEditing(!editing); setFormError(''); }}
              className={`p-2 rounded-lg transition-colors ${editing ? 'bg-slate-100 text-slate-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}>
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {editing ? (
            /* ── EDIT MODE ── */
            <div className="p-5 space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Editar Promoción</p>
              {formError && (
                <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 font-medium flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Nombre</label>
                  <input className={inputCls} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Servicio</label>
                  <select className={inputCls} value={form.serviceId} onChange={e => setForm(p => ({ ...p, serviceId: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {services.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Tipo de Descuento</label>
                  <select className={inputCls} value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}>
                    <option value="PERCENTAGE">Porcentaje (%)</option>
                    <option value="FIXED">Monto fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Valor {form.discountType === 'PERCENTAGE' ? '(%)' : '($)'}</label>
                  <input type="number" min={1} className={inputCls} value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Día de la semana</label>
                  <select className={inputCls} value={form.startDayOfWeek} onChange={e => setForm(p => ({ ...p, startDayOfWeek: e.target.value }))}>
                    <option value="">Todos los días</option>
                    {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Hora inicio</label>
                  <input type="time" className={inputCls} value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Hora fin</label>
                  <input type="time" className={inputCls} value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Vigencia desde</label>
                  <input type="date" className={inputCls} value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Vigencia hasta</label>
                  <input type="date" className={inputCls} value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Descripción (opcional)</label>
                  <textarea rows={2} className={`${inputCls} resize-none`} placeholder="Descripción interna de la promoción..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-3 py-1">
                <input type="checkbox" id="editForNewClients" checked={form.forNewClients} onChange={e => setForm(p => ({ ...p, forNewClients: e.target.checked }))} className="w-4 h-4 rounded accent-brand-600" />
                <label htmlFor="editForNewClients" className="text-xs font-medium text-slate-600">Solo nuevos clientes</label>
              </div>
              <button onClick={handleSave} disabled={updateMutation.isPending}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-colors disabled:opacity-50">
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
                  { label: 'Descuento', value: formatDiscount(active.discountType, active.discountValue), icon: active.discountType === 'PERCENTAGE' ? Percent : DollarSign },
                  { label: 'Estado', value: active.active ? 'Activo' : 'Inactivo', icon: active.active ? ToggleRight : ToggleLeft },
                  { label: 'Nuevos', value: active.forNewClients ? 'Sí' : 'Todos', icon: Users },
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
                    <Scissors className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-400">Servicio</p>
                      <p className="text-sm font-medium text-slate-700">{serviceName}</p>
                    </div>
                  </div>
                  {(active.startDayOfWeek !== undefined && active.startDayOfWeek !== null) && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-slate-400">Día de aplicación</p>
                        <p className="text-sm font-medium text-slate-700">{DAY_NAMES[active.startDayOfWeek]}</p>
                      </div>
                    </div>
                  )}
                  {(active.startTime || active.endTime) && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-slate-400">Horario</p>
                        <p className="text-sm font-medium text-slate-700">{active.startTime || '—'} → {active.endTime || '—'}</p>
                      </div>
                    </div>
                  )}
                  {(active.startDate || active.endDate) && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-slate-400">Vigencia</p>
                        <p className="text-sm font-medium text-slate-700">{active.startDate || '—'} → {active.endDate || '—'}</p>
                      </div>
                    </div>
                  )}
                  {active.description && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-slate-400">Descripción</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{active.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Toggle active */}
              <div className="p-5">
                <button
                  onClick={() => toggleActiveMutation.mutate(!active.active)}
                  disabled={toggleActiveMutation.isPending}
                  className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${active.active ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                >
                  {toggleActiveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : active.active ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                  {active.active ? 'Desactivar Promoción' : 'Activar Promoción'}
                </button>
                {formError && <p className="text-xs text-red-500 text-center mt-2">{formError}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ADD PROMOTION MODAL ──────────────────────────────────────────────────────

const EMPTY_PROMO = { name: '', serviceId: '', discountType: 'PERCENTAGE', discountValue: '', startDayOfWeek: '', startTime: '', endTime: '', startDate: '', endDate: '', forNewClients: false, description: '' };

function AddPromotionModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { activeBusiness } = useAuth();
  const [form, setForm] = useState(EMPTY_PROMO);
  const [error, setError] = useState('');

  const { data: services = [] } = useQuery({
    queryKey: ['services', activeBusiness?.id],
    queryFn: () => apiFetch('/services'),
    enabled: !!activeBusiness?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiFetch('/promotions', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: any) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!form.name || form.name.length < 2) { setError('El nombre debe tener al menos 2 caracteres.'); return; }
    if (!form.serviceId) { setError('Selecciona un servicio.'); return; }
    if (!form.discountValue || isNaN(Number(form.discountValue))) { setError('El valor del descuento debe ser un número válido.'); return; }
    createMutation.mutate({
      name: form.name,
      serviceId: form.serviceId,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      startDayOfWeek: form.startDayOfWeek !== '' ? Number(form.startDayOfWeek) : undefined,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      forNewClients: form.forNewClients,
      description: form.description || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center"><Sparkles className="w-4 h-4 text-violet-600" /></div>
            <h2 className="font-bold text-slate-800">Nueva Promoción</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 font-medium flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Nombre *</label>
              <input className={inputCls} placeholder="Ej. Miércoles de Barba" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Servicio *</label>
              <select className={inputCls} value={form.serviceId} onChange={e => setForm(p => ({ ...p, serviceId: e.target.value }))} required>
                <option value="">Seleccionar...</option>
                {services.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Tipo de Descuento *</label>
              <select className={inputCls} value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}>
                <option value="PERCENTAGE">Porcentaje (%)</option>
                <option value="FIXED">Monto fijo ($)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Valor {form.discountType === 'PERCENTAGE' ? '(%)' : '($)'} *</label>
              <input type="number" min={1} className={inputCls} placeholder="15" value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))} required />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Día de la semana (opcional)</label>
              <select className={inputCls} value={form.startDayOfWeek} onChange={e => setForm(p => ({ ...p, startDayOfWeek: e.target.value }))}>
                <option value="">Todos los días</option>
                {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Hora Inicio</label>
              <input type="time" className={inputCls} value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Hora Fin</label>
              <input type="time" className={inputCls} value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Vigencia desde</label>
              <input type="date" className={inputCls} value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Vigencia hasta</label>
              <input type="date" className={inputCls} value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Descripción (opcional)</label>
              <textarea rows={2} className={`${inputCls} resize-none`} placeholder="Descripción interna de la promoción..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="addForNewClients" checked={form.forNewClients} onChange={e => setForm(p => ({ ...p, forNewClients: e.target.checked }))} className="w-4 h-4 rounded accent-brand-600" />
            <label htmlFor="addForNewClients" className="text-xs font-medium text-slate-600">Solo para nuevos clientes</label>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={createMutation.isPending} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-colors disabled:opacity-50">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Crear Promoción
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

type Tab = 'coupons' | 'promotions';

export default function CouponsPage() {
  const { activeBusiness } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('coupons');
  const [search, setSearch] = useState('');
  const [couponPage, setCouponPage] = useState(1);
  const [promoPage, setPromoPage] = useState(1);
  const [limit] = useState(10);
  const [filterState, setFilterState] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedCoupon, setSelectedCoupon] = useState<any | null>(null);
  const [selectedPromo, setSelectedPromo] = useState<any | null>(null);
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [showAddPromo, setShowAddPromo] = useState(false);

  const { data: couponsData, isLoading: loadingCoupons } = useQuery({
    queryKey: ['coupons', activeBusiness?.id, couponPage, search, filterState],
    queryFn: () => apiFetchPaginated(`/coupons?page=${couponPage}&limit=${limit}&search=${encodeURIComponent(search)}&status=${filterState}`),
    enabled: !!activeBusiness?.id,
  });

  const { data: promosData, isLoading: loadingPromos } = useQuery({
    queryKey: ['promotions', activeBusiness?.id, promoPage, search, filterState],
    queryFn: () => apiFetchPaginated(`/promotions?page=${promoPage}&limit=${limit}&search=${encodeURIComponent(search)}&status=${filterState}`),
    enabled: !!activeBusiness?.id,
  });

  const coupons = couponsData?.data || [];
  const couponsMeta = couponsData?.meta || { totalPages: 1, page: 1, total: 0 };

  const promotions = promosData?.data || [];
  const promosMeta = promosData?.meta || { totalPages: 1, page: 1, total: 0 };

  const handleUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['coupons'] });
    queryClient.invalidateQueries({ queryKey: ['promotions'] });
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cupones & Promociones</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loadingCoupons || loadingPromos ? 'Cargando...' : `${couponsMeta.total} cupones · ${promosMeta.total} promociones activas`}
          </p>
        </div>
        <button
          onClick={() => activeTab === 'coupons' ? setShowAddCoupon(true) : setShowAddPromo(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          {activeTab === 'coupons' ? 'Nuevo Cupón' : 'Nueva Promoción'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {([
          ['coupons', 'Cupones', Ticket],
          ['promotions', 'Promociones', Sparkles],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id as Tab); setSearch(''); setFilterState('all'); setCouponPage(1); setPromoPage(1); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Icon className="w-4 h-4" />{label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === id ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500'}`}>
              {id === 'coupons' ? couponsMeta.total : promosMeta.total}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col gap-3">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'coupons' ? 'Buscar por código...' : 'Buscar por nombre o servicio...'}
            value={search}
            onChange={e => { setSearch(e.target.value); setCouponPage(1); setPromoPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {(['all', 'active', 'inactive'] as const).map(opt => (
              <button
                key={opt}
                onClick={() => { setFilterState(opt); setCouponPage(1); setPromoPage(1); }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${filterState === opt ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                {opt === 'all' ? 'Todos' : opt === 'active' ? 'Activos' : 'Inactivos'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            {activeTab === 'coupons' ? <Ticket className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span className="font-semibold text-slate-700">{activeTab === 'coupons' ? couponsMeta.total : promosMeta.total}</span> resultados
          </div>
        </div>
      </div>

      {/* ── COUPONS ── */}
      {activeTab === 'coupons' && (
        <>
          {loadingCoupons ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : coupons.length === 0 ? (
            <div className="py-16 text-center">
              <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">{search ? 'No se encontraron cupones' : 'No hay cupones configurados'}</p>
              <p className="text-xs text-slate-400 mt-1">{search ? 'Intenta con otro término' : 'Crea tu primer cupón para ofrecer descuentos'}</p>
              {!search && (
                <button onClick={() => setShowAddCoupon(true)} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Agregar cupón
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map((c: any) => (
                  <CouponCard key={c.id} coupon={c} onClick={() => setSelectedCoupon(c)} />
                ))}
              </div>
              {couponsMeta.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button disabled={couponPage === 1} onClick={() => setCouponPage(p => p - 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-slate-50">Anterior</button>
                  <span className="flex items-center px-4 text-sm font-medium text-slate-600">Página {couponsMeta.page} de {couponsMeta.totalPages}</span>
                  <button disabled={couponPage === couponsMeta.totalPages} onClick={() => setCouponPage(p => p + 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-slate-50">Siguiente</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── PROMOTIONS ── */}
      {activeTab === 'promotions' && (
        <>
          {loadingPromos ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : promotions.length === 0 ? (
            <div className="py-16 text-center">
              <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">{search ? 'No se encontraron promociones' : 'No hay promociones configuradas'}</p>
              <p className="text-xs text-slate-400 mt-1">{search ? 'Intenta con otro término' : 'Crea promociones por día, horario o tipo de cliente'}</p>
              {!search && (
                <button onClick={() => setShowAddPromo(true)} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Agregar promoción
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {promotions.map((p: any) => (
                  <PromotionCard key={p.id} promo={p} onClick={() => setSelectedPromo(p)} />
                ))}
              </div>
              {promosMeta.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button disabled={promoPage === 1} onClick={() => setPromoPage(p => p - 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-slate-50">Anterior</button>
                  <span className="flex items-center px-4 text-sm font-medium text-slate-600">Página {promosMeta.page} de {promosMeta.totalPages}</span>
                  <button disabled={promoPage === promosMeta.totalPages} onClick={() => setPromoPage(p => p + 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-slate-50">Siguiente</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Drawers ── */}
      {selectedCoupon && (
        <CouponDrawer
          coupon={selectedCoupon}
          onClose={() => setSelectedCoupon(null)}
          onUpdated={handleUpdated}
        />
      )}
      {selectedPromo && (
        <PromotionDrawer
          promo={selectedPromo}
          onClose={() => setSelectedPromo(null)}
          onUpdated={handleUpdated}
        />
      )}

      {/* ── Modals ── */}
      {showAddCoupon && (
        <AddCouponModal
          onClose={() => setShowAddCoupon(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['coupons'] })}
        />
      )}
      {showAddPromo && (
        <AddPromotionModal
          onClose={() => setShowAddPromo(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['promotions'] })}
        />
      )}
    </DashboardLayout>
  );
}
