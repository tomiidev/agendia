'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../providers/AuthProvider';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import WaitlistPanel from '../../components/dashboard/WaitlistPanel';
import apiFetch from '../../lib/api/client';
import {
  Calendar,
  Users,
  TrendingUp,
  XCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

function StatCard({ label, value, sub, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 flex items-start gap-3 sm:gap-4 shadow-premium hover:shadow-premium-lg transition-shadow">
      <div className={`${bg} p-2 sm:p-2.5 rounded-xl`}>
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-slate-900">{value}</p>
        {sub && <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl skeleton-shimmer"></div>
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 rounded skeleton-shimmer"></div>
        <div className="h-7 w-16 rounded skeleton-shimmer"></div>
      </div>
    </div>
  );
}

function AppointmentRow({ apt }: { apt: any }) {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    CONFIRMED: 'bg-brand-50 text-brand-700 border-brand-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
    NO_SHOW: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmado',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
    NO_SHOW: 'No se presentó',
  };

  const client = apt.clientId;
  const service = apt.serviceId;
  const professional = apt.professionalId;

  return (
    <div className="flex items-center gap-3 py-3 px-3 sm:px-4 hover:bg-slate-50/70 rounded-xl transition-colors group">
      <div
        className="w-1 h-8 rounded-full shrink-0"
        style={{ backgroundColor: professional?.calendarColor || '#8b5cf6' }}
      ></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{client?.name || 'Cliente'}</p>
        <p className="text-xs text-slate-400 truncate">{service?.name || 'Servicio'}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs sm:text-sm font-bold text-slate-700">{apt.startTime}</p>
        <span className={`text-[10px] font-semibold px-2 py-0.5 sm:py-1 rounded-lg border block sm:inline mt-0.5 sm:mt-0 ${statusColors[apt.status] || 'bg-slate-100 text-slate-500'}`}>
          {statusLabels[apt.status] || apt.status}
        </span>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors hidden sm:block" />
    </div>
  );
}

export default function DashboardPage() {
  const { activeBusiness } = useAuth();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dateLabel = today.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', activeBusiness?.id],
    queryFn: () => apiFetch('/reports/stats'),
    enabled: !!activeBusiness?.id,
  });

  const { data: todayAppointments, isLoading: aptsLoading } = useQuery({
    queryKey: ['appointments-today', activeBusiness?.id, todayStr],
    queryFn: () => apiFetch(`/appointments?date=${todayStr}`),
    enabled: !!activeBusiness?.id,
  });

  const today_summary = stats?.todaySummary;
  const metrics = stats?.metrics;

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1 font-medium capitalize">
            <Calendar className="w-3.5 h-3.5" />
            {dateLabel}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {statsLoading
              ? 'Cargando resumen...'
              : `Hoy: ${today_summary?.total ?? 0} reservas · ${today_summary?.confirmed ?? 0} confirmadas`}
          </p>
        </div>
        <Link
          href="/agenda?new=1"
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Nueva Reserva
        </Link>
      </div>

      {/* TODAY STAT CARDS */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Resumen de Hoy</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statsLoading ? (
            Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard label="Total Hoy" value={today_summary?.total ?? 0} icon={Calendar} color="text-brand-600" bg="bg-brand-50" />
              <StatCard label="Confirmadas" value={today_summary?.confirmed ?? 0} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
              <StatCard label="Pendientes" value={today_summary?.pending ?? 0} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
              <StatCard label="Canceladas" value={today_summary?.cancelled ?? 0} icon={XCircle} color="text-red-600" bg="bg-red-50" />
              <StatCard label="No Show" value={today_summary?.noShow ?? 0} icon={AlertCircle} color="text-slate-600" bg="bg-slate-100" />
            </>
          )}
        </div>
      </section>

      {/* BUSINESS METRICS */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Métricas Generales</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsLoading ? (
            Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard
                label="Ingresos del Mes"
                value={`$${(metrics?.monthlyRevenue ?? 0).toLocaleString('es-AR')}`}
                sub="Solo turnos completados"
                icon={TrendingUp}
                color="text-brand-600"
                bg="bg-brand-50"
              />
              <StatCard
                label="Clientes Totales"
                value={metrics?.totalClients ?? 0}
                icon={Users}
                color="text-sky-600"
                bg="bg-sky-50"
              />
              <StatCard
                label="Ocupación Hoy"
                value={`${metrics?.occupancyRate ?? 0}%`}
                sub="Horas de trabajo cubiertas"
                icon={Calendar}
                color="text-violet-600"
                bg="bg-violet-50"
              />
              <StatCard
                label="Tasa Cancelación"
                value={`${metrics?.cancelRate ?? 0}%`}
                icon={XCircle}
                color="text-red-500"
                bg="bg-red-50"
              />
            </>
          )}
        </div>
      </section>

      {/* TODAY'S APPOINTMENTS & WAITLIST */}
      <div className="grid md:grid-cols-3 gap-6">
        <section className="md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Próximas Reservas de Hoy</h2>
            <Link href="/agenda" className="text-xs font-semibold text-brand-600 hover:text-brand-500 flex items-center gap-1 transition-colors">
              Ver agenda completa <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 shadow-premium">
            {aptsLoading ? (
              <div className="p-6 text-center">
                <div className="h-3 w-48 rounded skeleton-shimmer mx-auto mb-3"></div>
                <div className="h-3 w-32 rounded skeleton-shimmer mx-auto"></div>
              </div>
            ) : !todayAppointments || todayAppointments.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">No hay reservas para hoy</p>
                <p className="text-xs text-slate-400 mt-1">¡Un buen día para agregar nuevas reservas!</p>
                <Link
                  href="/agenda?new=1"
                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Crear Reserva
                </Link>
              </div>
            ) : (
              <div className="p-2">
                {todayAppointments.slice(0, 8).map((apt: any) => (
                  <AppointmentRow key={apt.id} apt={apt} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="md:col-span-1">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Lista de Espera</h2>
          <WaitlistPanel />
        </section>
      </div>
    </DashboardLayout>
  );
}
