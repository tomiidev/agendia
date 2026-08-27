import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '../../lib/api/client';
import { Clock, User, Scissors, Trash2, Loader2, Calendar } from 'lucide-react';
import { ConfirmationDialog } from '../ConfirmationDialog';

export default function WaitlistPanel() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: waitlist = [], isLoading } = useQuery({
    queryKey: ['waitlist'],
    queryFn: () => apiFetch('/waitlist'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/waitlist/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      setDeleteId(null);
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-600" />
          Lista de Espera ({waitlist.length})
        </h2>
      </div>
      
      {waitlist.length === 0 ? (
        <div className="p-10 text-center text-slate-500">
          <p className="text-sm">No hay clientes en lista de espera.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {waitlist.map((entry: any) => (
            <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">
                  {entry.clientId?.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{entry.clientId?.name || 'Cliente'}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Scissors className="w-3 h-3" />
                    <span>{entry.serviceId?.name}</span>
                    <span className="text-slate-300">•</span>
                    <Clock className="w-3 h-3" />
                    <span>{entry.requestedDate}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDeleteId(entry.id)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar de la lista"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmationDialog
        isOpen={!!deleteId}
        title="Eliminar de la lista"
        message="¿Estás seguro de que deseas eliminar este cliente de la lista de espera? Esta acción no se puede deshacer."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
