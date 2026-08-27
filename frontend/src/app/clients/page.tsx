'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../providers/AuthProvider';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import apiFetch, { apiFetchPaginated } from '../../lib/api/client';
import {
  Users, Search, Phone, Mail, Tag, X, Plus, Loader2,
  CheckCircle2, XCircle, Clock, Calendar, TrendingUp,
  Edit3, Save, ChevronRight, AlertCircle, User,
} from 'lucide-react';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const TAG_COLORS = [
  'bg-brand-100 text-brand-700 border-brand-200',
  'bg-sky-100 text-sky-700 border-sky-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-pink-100 text-pink-700 border-pink-200',
];

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-amber-100 border-amber-300', text: 'text-amber-800', label: 'Pendiente' },
  CONFIRMED: { bg: 'bg-brand-100 border-brand-300', text: 'text-brand-800', label: 'Confirmado' },
  COMPLETED: { bg: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-800', label: 'Completado' },
  CANCELLED: { bg: 'bg-red-100 border-red-300', text: 'text-red-700', label: 'Cancelado' },
  NO_SHOW: { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-600', label: 'No Show' },
};

function getInitials(name: string) {
  return (name || '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CL';
}

// ─── CLIENT CARD ──────────────────────────────────────────────────────────────

function ClientCard({ client, onClick }: { client: any; onClick: () => void }) {
  const initials = getInitials(client.name);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-premium-lg transition-all shadow-premium cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-700 text-sm shrink-0 select-none">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-800 truncate group-hover:text-brand-600 transition-colors">
              {client.name}
            </h3>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors shrink-0 mt-0.5" />
          </div>
          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
            {client.phone && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Phone className="w-3 h-3" /> {client.phone}
              </span>
            )}
            {client.email && (
              <span className="flex items-center gap-1 text-xs text-slate-400 truncate">
                <Mail className="w-3 h-3" /> {client.email}
              </span>
            )}
          </div>
          {client.tags && client.tags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {client.tags.map((tag: string, i: number) => (
                <span
                  key={tag}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TAG_COLORS[i % TAG_COLORS.length]}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-50">
        <div className="text-center">
          <p className="text-xs font-bold text-slate-700">{client.appointmentCount ?? 0}</p>
          <p className="text-[10px] text-slate-400">Turnos</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-slate-700">${(client.totalSpent ?? 0).toLocaleString('es-AR')}</p>
          <p className="text-[10px] text-slate-400">Gastado</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-slate-700 truncate">{client.lastVisit ?? '—'}</p>
          <p className="text-[10px] text-slate-400">Última Visita</p>
        </div>
      </div>
    </div>
  );
}

function SkeletonClientCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-premium">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-full skeleton-shimmer shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-36 rounded skeleton-shimmer" />
          <div className="h-3 w-24 rounded skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

// ─── CLIENT DETAIL DRAWER ─────────────────────────────────────────────────────

function ClientDrawer({
  client,
  onClose,
  onUpdated,
}: {
  client: any;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: client.name || '',
    phone: client.phone || '',
    email: client.email || '',
    notes: client.notes || '',
    tags: (client.tags || []).join(', '),
  });
  const [formError, setFormError] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['client', client.id],
    queryFn: () => apiFetch(`/clients/${client.id}`),
    enabled: !!client.id,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) =>
      apiFetch(`/clients/${client.id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', client.id] });
      setEditing(false);
      onUpdated();
    },
    onError: (e: any) => setFormError(e.message),
  });

  const handleSave = () => {
    setFormError('');
    if (!form.name || form.name.length < 2) { setFormError('El nombre debe tener al menos 2 caracteres.'); return; }
    if (!form.phone || form.phone.length < 6) { setFormError('El teléfono debe tener al menos 6 caracteres.'); return; }
    const tags = form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
    updateMutation.mutate({ name: form.name, phone: form.phone, email: form.email, notes: form.notes, tags });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
        <div className="w-full max-w-md bg-white shadow-2xl flex flex-col justify-center items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-sm text-slate-500 font-medium">Cargando cliente...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
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
            <p className="text-sm font-semibold text-slate-700">No se pudo cargar el cliente</p>
            <p className="text-xs text-slate-400">{(error as any)?.message || 'Error inesperado.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const { client: fullClient, history = [] } = data;
  const initials = getInitials(fullClient.name);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-700 text-xs select-none">
              {initials}
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm leading-tight">{fullClient.name}</h2>
              <p className="text-[11px] text-slate-400">{fullClient.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              data-testid="client-edit-btn"
              onClick={() => { setEditing(!editing); setFormError(''); }}
              title={editing ? 'Cancelar edición' : 'Editar cliente'}
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
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Editar Datos</p>
              {formError && (
                <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 font-medium flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{formError}
                </div>
              )}
              {[
                { label: 'Nombre', key: 'name', type: 'text', placeholder: 'Nombre completo', testid: 'client-input-name' },
                { label: 'Teléfono', key: 'phone', type: 'tel', placeholder: '+598 99 123 456', testid: 'client-input-phone' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'opcional@email.com', testid: 'client-input-email' },
              ].map(({ label, key, type, placeholder, testid }) => (
                <div key={key}>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
                  <input
                    data-testid={testid}
                    type={type}
                    value={(form as any)[key]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all"
                  />
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Notas</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Observaciones internas..."
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Etiquetas <span className="lowercase text-slate-400">(separadas por coma)</span></label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                  placeholder="vip, regular, empresa"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all"
                />
              </div>
              <button
                data-testid="client-save-btn"
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
              <div className="grid grid-cols-3 gap-0 divide-x divide-slate-100">
                {[
                  { label: 'Turnos', value: history.length, icon: Calendar },
                  { label: 'Gastado', value: `$${history.filter((h: any) => h.status === 'COMPLETED').reduce((s: number, h: any) => s + (h.finalPrice || 0), 0).toLocaleString('es-AR')}`, icon: TrendingUp },
                  { label: 'Completados', value: history.filter((h: any) => h.status === 'COMPLETED').length, icon: CheckCircle2 },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="p-4 text-center">
                    <Icon className="w-4 h-4 text-slate-300 mx-auto mb-1" />
                    <p className="text-sm font-bold text-slate-800">{value}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Contact info */}
              <div className="p-5 space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Información de contacto</p>
                <div className="space-y-2.5">
                  {[
                    { icon: Phone, value: fullClient.phone, label: 'Teléfono' },
                    { icon: Mail, value: fullClient.email || '—', label: 'Email' },
                  ].map(({ icon: Icon, value, label }) => (
                    <div key={label} className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400">{label}</p>
                        <p className="text-sm font-medium text-slate-700">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {fullClient.tags && fullClient.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {fullClient.tags.map((tag: string, i: number) => (
                      <span key={tag} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TAG_COLORS[i % TAG_COLORS.length]}`}>{tag}</span>
                    ))}
                  </div>
                )}
                {fullClient.notes && (
                  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 leading-relaxed mt-2">
                    {fullClient.notes}
                  </div>
                )}
              </div>

              {/* Appointment history */}
              <div className="p-5 space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Historial de Turnos</p>
                {history.length === 0 ? (
                  <div className="py-8 text-center">
                    <Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Sin turnos registrados</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map((apt: any) => {
                      const s = STATUS_STYLES[apt.status] || STATUS_STYLES.PENDING;
                      return (
                        <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 hover:bg-slate-100/50 transition-colors">
                          <div className="shrink-0 text-center min-w-[42px]">
                            <p className="text-xs font-bold text-slate-700">{apt.startTime}</p>
                            <p className="text-[10px] text-slate-400">{apt.date}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-700 truncate">{apt.serviceId?.name || 'Servicio'}</p>
                            <p className="text-[10px] text-slate-400 truncate">{apt.professionalId?.name || 'Profesional'}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${s.bg} ${s.text}`}>
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ADD CLIENT MODAL ─────────────────────────────────────────────────────────

function AddClientModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { activeBusiness } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '', tags: '' });
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: (payload: any) =>
      apiFetch('/clients', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: any) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || form.name.length < 2) { setError('El nombre debe tener al menos 2 caracteres.'); return; }
    if (!form.phone || form.phone.length < 6) { setError('El teléfono debe tener al menos 6 caracteres.'); return; }
    const tags = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    createMutation.mutate({ name: form.name, phone: form.phone, email: form.email, notes: form.notes, tags });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
              <User className="w-4 h-4 text-brand-600" />
            </div>
            <h2 className="font-bold text-slate-800">Nuevo Cliente</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 font-medium flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
            </div>
          )}
          {[
            { label: 'Nombre completo *', key: 'name', type: 'text', placeholder: 'Juan Pérez', testid: 'add-client-input-name' },
            { label: 'Teléfono *', key: 'phone', type: 'tel', placeholder: '+598 99 123 456', testid: 'add-client-input-phone' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'opcional@email.com', testid: 'add-client-input-email' },
          ].map(({ label, key, type, placeholder, testid }) => (
            <div key={key}>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
              <input
                data-testid={testid}
                type={type}
                value={(form as any)[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all"
              />
            </div>
          ))}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notas internas</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Preferencias, alergias, observaciones..."
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Etiquetas <span className="lowercase text-slate-400">(separadas por coma)</span>
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
              placeholder="vip, regular, empresa"
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all"
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
              data-testid="add-client-submit-btn"
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Agregar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const { activeBusiness } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['clients', activeBusiness?.id, page, search],
    queryFn: () => apiFetchPaginated(`/clients?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),
    enabled: !!activeBusiness?.id,
  });

  const clients = data?.data || [];
  const meta = data?.meta || { totalPages: 1, page: 1, total: 0 };

  const handleUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isLoading ? 'Cargando...' : `${meta.total} clientes registrados`}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* Search & Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <Users className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-700">{meta.total}</span> resultados
        </div>
      </div>

      {/* Client Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <SkeletonClientCard key={i} />)}
        </div>
      ) : clients.length === 0 ? (
        <div className="py-16 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">
            {search ? 'No se encontraron clientes' : 'Aún no hay clientes registrados'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {search
              ? 'Intenta con otro término de búsqueda'
              : 'Agregá el primero usando el botón "Nuevo Cliente"'}
          </p>
          {!search && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar cliente
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client: any) => (
              <ClientCard key={client.id} client={client} onClick={() => setSelectedClient(client)} />
            ))}
          </div>
          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-slate-50"
              >
                Anterior
              </button>
              <span className="flex items-center px-4 text-sm font-medium text-slate-600">
                Página {meta.page} de {meta.totalPages}
              </span>
              <button
                disabled={page === meta.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-slate-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Client Detail Drawer */}
      {selectedClient && (
        <ClientDrawer
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onUpdated={handleUpdated}
        />
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['clients'] })}
        />
      )}
    </DashboardLayout>
  );
}
