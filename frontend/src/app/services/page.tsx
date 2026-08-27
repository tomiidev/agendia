'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../providers/AuthProvider';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { FilterTabs } from '../../components/common/FilterTabs';
import apiFetch, { apiFetchPaginated } from '../../lib/api/client';
import {
  Scissors, Plus, Search,
} from 'lucide-react';
import { ServiceCard } from '../../components/services/ServiceCard';
import { SkeletonServiceCard } from '../../components/services/SkeletonServiceCard';
import { ServiceDrawer } from '../../components/services/ServiceDrawer';
import { AddServiceModal } from '../../components/services/AddServiceModal';

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const { activeBusiness } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['services', activeBusiness?.id, page, search, filterActive],
    queryFn: () => apiFetchPaginated(`/services?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${filterActive}`),
    enabled: !!activeBusiness?.id,
  });

  React.useEffect(() => {
    console.log('ServicesPage data:', data);
    console.log('ServicesPage error:', error);
  }, [data, error]);

  const services = data?.data || [];
  const meta = data?.meta || { totalPages: 1, page: 1, total: 0 };

  const handleUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['services'] });
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Servicios</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isLoading ? 'Cargando...' : `${meta.total} servicios en total`}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Nuevo Servicio
        </button>
      </div>

      {/* Tabs */}
      <FilterTabs
        tabs={[
          { id: 'all', label: 'Todos' },
          { id: 'active', label: 'Activos' },
          { id: 'inactive', label: 'Inactivos' },
        ]}
        activeTab={filterActive}
        onChange={setFilterActive}
      />

      {/* Search & Filter bar */}
      <div className="flex flex-col gap-3 mt-4">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, categoría..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm w-max">
            <Scissors className="w-3.5 h-3.5" />
            <span className="font-semibold text-slate-700">{meta.total}</span> resultados
        </div>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <SkeletonServiceCard key={i} />)}
        </div>
      ) : services.length === 0 ? (
        <div className="py-16 text-center">
          <Scissors className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">
            {search ? 'No se encontraron servicios' : 'No hay servicios configurados'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {search
              ? 'Intenta con otro término de búsqueda'
              : 'Creá tu primer servicio usando el botón "Nuevo Servicio"'}
          </p>
          {!search && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar servicio
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service: any) => (
              <ServiceCard
                key={service.id}
                service={service}
                onClick={() => setSelectedService(service)}
              />
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

      {/* Service Detail Drawer */}
      {selectedService && (
        <ServiceDrawer
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onUpdated={handleUpdated}
        />
      )}

      {/* Add Service Modal */}
      {showAddModal && (
        <AddServiceModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['services'] })}
        />
      )}
    </DashboardLayout>
  );
}
