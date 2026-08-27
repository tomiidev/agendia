'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../providers/AuthProvider';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { FilterTabs } from '../../components/common/FilterTabs';
import apiFetch, { apiFetchPaginated } from '../../lib/api/client';
import {
  ClipboardList, Phone, Mail, MessageCircle, CheckCircle2,
  XCircle, Calendar, Clock, AlertCircle, Loader2, ArrowUpRight
} from 'lucide-react';

export default function QuotesPage() {
  const { activeBusiness } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'PENDING' | 'CONTACTED' | 'CLOSED'>('PENDING');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['quote-requests', activeBusiness?.id, activeTab, page],
    queryFn: () => apiFetchPaginated(`/quote-requests?status=${activeTab}&page=${page}&limit=${limit}`),
    enabled: !!activeBusiness?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'PENDING' | 'CONTACTED' | 'CLOSED' }) =>
      apiFetch(`/quote-requests/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-requests'] });
    },
  });

  const quotes = response?.data || [];
  const meta = response?.meta || { totalPages: 1, page: 1, total: 0 };

  const handleUpdateStatus = (id: string, newStatus: 'PENDING' | 'CONTACTED' | 'CLOSED') => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const getCleanPhone = (phone: string) => {
    return phone.replace(/[^0-9]/g, '');
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Solicitudes de Presupuesto</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gestioná las solicitudes recibidas y contactá a tus clientes manualmente
          </p>
        </div>
      </div>

      {/* Tabs */}
      <FilterTabs
        tabs={[
          { id: 'PENDING', label: 'Pendientes' },
          { id: 'CONTACTED', label: 'Contactadas' },
          { id: 'CLOSED', label: 'Cerradas' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Main Content */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error al cargar las solicitudes de presupuesto. Intenta nuevamente.</span>
        </div>
      ) : quotes.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-100 rounded-2xl shadow-sm">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">No hay solicitudes en esta sección</p>
          <p className="text-xs text-slate-400 mt-1">
            {activeTab === 'PENDING'
              ? 'Las solicitudes nuevas aparecerán aquí.'
              : activeTab === 'CONTACTED'
                ? 'Las solicitudes que marques como contactadas se mostrarán aquí.'
                : 'Las solicitudes resueltas se archivarán aquí.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotes.map((quote: any) => (
              <div
                key={quote.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                {/* ... existing card content ... */}
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-slate-50 pb-3 mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{quote.name}</h3>
                      <span className="inline-block text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full mt-1.5 border border-brand-100">
                        Servicio: {quote.serviceId?.name || 'Servicio Eliminado'}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <Calendar className="w-3 h-3" /> {formatDate(quote.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{quote.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{quote.email}</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mt-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Descripción de lo solicitado:
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {quote.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="border-t border-slate-50 pt-4 flex flex-col sm:flex-row gap-2 justify-between">
                  {/* Contact Links */}
                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/${getCleanPhone(quote.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-xs font-semibold"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp <ArrowUpRight className="w-3 h-3 opacity-60" />
                    </a>
                    <a
                      href={`mailto:${quote.email}?subject=Presupuesto%20-%20${encodeURIComponent(
                        quote.serviceId?.name || ''
                      )}`}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors text-xs font-semibold border border-slate-200/50"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </a>
                  </div>

                  {/* Status Transitions */}
                  <div className="flex gap-2">
                    {quote.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateStatus(quote.id, 'CONTACTED')}
                        className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition-colors text-xs font-semibold shadow-sm shadow-brand-500/10"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Contactado
                      </button>
                    )}
                    {quote.status !== 'CLOSED' && (
                      <button
                        onClick={() => handleUpdateStatus(quote.id, 'CLOSED')}
                        className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors text-xs font-semibold"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cerrar
                      </button>
                    )}
                  </div>
                </div>
              </div>
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
    </DashboardLayout>
  );
}
