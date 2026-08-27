'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '../../lib/api/client';
import { getStatusLabel } from '../../lib/utils/appointmentStatus';
import EditAppointmentStepper from '../../components/EditAppointmentStepper';

export default function ClientDashboardPage() {
  const queryClient = useQueryClient();
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: () => apiFetch(`/public/my-appointments`),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/public/appointments/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-appointments'] }),
  });

  if (isLoading) return <div className="p-6 text-center text-slate-500">Cargando tus turnos...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mis Turnos</h1>
          <button className="text-sm text-slate-500 hover:text-slate-900 transition">Cerrar sesión</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6">
        {editingAppointment && (
          <EditAppointmentStepper appointment={editingAppointment} onClose={() => setEditingAppointment(null)} />
        )}

        <div className="space-y-4">
          {appointments?.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-500">No tienes turnos registrados.</p>
            </div>
          )}

          {appointments?.map((app: any) => {
            const aptDateTime = new Date(`${app.date}T${app.startTime}`);
            const isPast = aptDateTime < new Date();
            return (
              <div key={app.id} className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isPast ? 'opacity-70' : ''}`}>
                <div className="flex-1 space-y-1">
                  <p className="text-lg font-semibold text-slate-900">{app.serviceId?.name || 'Servicio'}</p>
                  <div className="flex items-center text-sm text-slate-500 gap-2">
                    <span>{app.date} • {app.startTime}</span>
                    <span className="text-slate-300">•</span>
                    <span>{app.professionalId?.name}</span>
                  </div>
                  <div className="pt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide 
                      ${app.status === 'CONFIRMED' ? 'bg-green-50 text-green-700' : 
                        app.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {getStatusLabel(app.status)}
                    </span>
                  </div>
                </div>
                {app.status !== 'CANCELLED' && app.status !== 'COMPLETED' && !isPast && (
                  <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto pt-2 sm:pt-0">
                    <button 
                      onClick={() => setEditingAppointment(app)}
                      className="flex-1 sm:flex-none text-sm text-blue-600 font-semibold hover:text-blue-700 bg-blue-50/50 hover:bg-blue-100/50 px-5 py-2.5 rounded-xl transition"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => cancelMutation.mutate(app.id)}
                      className="flex-1 sm:flex-none text-sm text-red-600 font-semibold hover:text-red-700 bg-red-50/50 hover:bg-red-100/50 px-5 py-2.5 rounded-xl transition"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
                {app.status === 'COMPLETED' && (
                  <div className="pt-2 sm:pt-0">
                    <button 
                      onClick={() => window.location.href = `/book/${app.businessId}`} 
                      className="text-sm text-brand-600 font-semibold bg-brand-50/50 hover:bg-brand-100/50 px-5 py-2.5 rounded-xl transition"
                    >
                      Reservar de nuevo
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
