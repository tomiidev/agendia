'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiFetch from '../../lib/api/client';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Users, TrendingUp, XCircle, Tag, Award } from 'lucide-react';

export default function ReportsPage() {
  const [range, setRange] = useState('30d');
  const { data: stats, isLoading } = useQuery({
    queryKey: ['reports-stats', range],
    queryFn: () => apiFetch(`/reports/stats?range=${range}`),
  });

  if (isLoading) return <DashboardLayout><div className="p-8 text-center">Cargando reportes...</div></DashboardLayout>;

  const { metrics, professionalPerformance, cancellationReasons, couponImpact } = stats;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reportes y Estadísticas</h1>
            <p className="text-sm text-slate-500">Análisis detallado de tu negocio</p>
          </div>
          <select
            className="p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="30d">Últimos 30 días</option>
            <option value="3m">Últimos 3 meses</option>
            <option value="6m">Últimos 6 meses</option>
            <option value="1y">Último año</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Total Clientes" value={metrics.totalClients} icon={<Users className="text-brand-600" />} />
          <StatCard title="Tasa Retención" value={`${metrics.retentionRate}%`} icon={<TrendingUp className="text-emerald-600" />} />
          <StatCard title="Clientes Nuevos" value={metrics.newClients} icon={<Users className="text-blue-600" />} />
          <StatCard title="Clientes Recurrentes" value={metrics.returningClients} icon={<Award className="text-amber-600" />} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Prof Performance */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Rendimiento por Profesional</h2>
            <div className="space-y-4">
              {professionalPerformance.map((p: any) => (
                <div key={p.name} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                  <p className="font-semibold text-slate-800">{p.name}</p>
                  <div className='text-right'>
                    <p className="text-sm font-bold text-brand-700">${p.revenue.toLocaleString('es-AR')}</p>
                    <p className="text-xs text-slate-500">{p.count} turnos</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cancellations & Coupons */}
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><XCircle className="text-red-500" size={20} /> Motivos de Cancelación</h2>
              <div className="space-y-3">
                {Object.entries(cancellationReasons).map(([reason, count]: any) => (
                  <div key={reason} className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">{reason}</span>
                    <span className="font-bold text-slate-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><Tag className="text-brand-500" size={20} /> Impacto de Cupones</h2>
              <div className="flex justify-between p-4 bg-brand-50 rounded-2xl">
                <div>
                  <p className="text-xs text-brand-700 font-bold uppercase">Cupones usados</p>
                  <p className="text-2xl font-black text-brand-900">{couponImpact.totalUsed}</p>
                </div>
                <div className='text-right'>
                  <p className="text-xs text-brand-700 font-bold uppercase">Dinero descontado</p>
                  <p className="text-2xl font-black text-brand-900">${couponImpact.totalDiscounted.toLocaleString('es-AR')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}
