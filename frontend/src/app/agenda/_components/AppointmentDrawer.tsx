'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Clock, User, Scissors, Loader2, XCircle } from 'lucide-react';
import apiFetch from '../../../lib/api/client';
import { STATUS_STYLES } from './calendarUtils';
import { WhatsAppConfirmModal } from './WhatsAppConfirmModal';

interface AppointmentDrawerProps {
  apt: any;
  onClose: () => void;
  onStatusChange: (id: string, status: string, comment?: string) => void;
  onRebook: (apt: any) => void;
}

export function AppointmentDrawer({ apt, onClose, onStatusChange, onRebook }: AppointmentDrawerProps) {
  const [comment, setComment] = useState('');
  const [showWAConfirm, setShowWAConfirm] = useState(false);

  const { data: fullApt, isLoading, error } = useQuery({
    queryKey: ['appointment', apt.id],
    queryFn: () => apiFetch(`/appointments/${apt.id}`),
    enabled: !!apt.id,
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
        <div className="w-full max-w-md bg-white shadow-2xl flex flex-col justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-2" />
          <p className="text-sm text-slate-500 font-medium">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  if (error || !fullApt) {
    return (
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
        <div className="w-full max-w-md bg-white shadow-2xl flex flex-col p-5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-800">Error</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <XCircle className="w-12 h-12 text-red-500 mb-3" />
            <p className="text-sm font-semibold text-slate-800">No se pudo cargar el turno</p>
            <p className="text-xs text-slate-400 mt-1">{(error as any)?.message || 'Ocurrió un error inesperado.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[fullApt.status] || STATUS_STYLES.PENDING;
  const color = fullApt.professionalId?.calendarColor || '#8b5cf6';
  const aptDateTime = new Date(`${fullApt.date}T${fullApt.startTime}`);
  const isPast = aptDateTime < new Date();

  const histColorClass: Record<string, string> = {
    PENDING: 'bg-amber-500',
    CONFIRMED: 'bg-brand-600',
    COMPLETED: 'bg-emerald-500',
    CANCELLED: 'bg-red-500',
    NO_SHOW: 'bg-slate-500',
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <h2 className="font-bold text-slate-800 text-base">Detalle del Turno</h2>
            {isPast && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">PASADO</span>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <span className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full border ${statusStyle.bg} ${statusStyle.text}`}>{statusStyle.label}</span>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Cliente</p>
                <p className="text-sm font-semibold text-slate-800">{fullApt.clientId?.name || '—'}</p>
                <p className="text-xs text-slate-400">{fullApt.clientId?.phone || ''}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Scissors className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Servicio</p>
                <p className="text-sm font-semibold text-slate-800">{fullApt.serviceId?.name || '—'}</p>
                <p className="text-xs text-slate-400">${fullApt.finalPrice?.toLocaleString('es-AR')} · {fullApt.serviceId?.duration} min</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Profesional</p>
                <p className="text-sm font-semibold text-slate-800">{fullApt.professionalId?.name || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Fecha y Hora</p>
                <p className="text-sm font-semibold text-slate-800">{fullApt.date} · {fullApt.startTime} – {fullApt.endTime}</p>
              </div>
            </div>
            {fullApt.notes && <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 leading-relaxed">{fullApt.notes}</div>}
          </div>

          {/* Timeline */}
          {fullApt.statusHistory && fullApt.statusHistory.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Historial de cambios</p>
              <div className="space-y-4">
                {fullApt.statusHistory.map((h: any, i: number) => (
                  <div key={i} className="flex gap-3 relative">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${histColorClass[h.status] || 'bg-slate-300'}`} />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-800">{STATUS_STYLES[h.status]?.label || h.status}</p>
                      <p className="text-[10px] text-slate-400">{new Date(h.timestamp).toLocaleString('es-AR')}</p>
                      {h.comment && <p className="text-[10px] text-slate-500 mt-0.5 italic">{h.comment}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fullApt.status === 'COMPLETED' && (
            <button onClick={() => onRebook(fullApt)} className="w-full text-sm text-brand-600 font-semibold bg-brand-50 hover:bg-brand-100 py-3 rounded-xl transition">
              Reservar de nuevo
            </button>
          )}

          {fullApt.status !== 'COMPLETED' && fullApt.status !== 'CANCELLED' && fullApt.status !== 'NO_SHOW' && !isPast && (
            <div className="border-t border-slate-100 pt-4 space-y-4">
              {fullApt.status !== 'CONFIRMED' && (
                <button onClick={() => onStatusChange(fullApt.id, 'CONFIRMED', comment)} className="w-full text-sm text-brand-600 font-semibold bg-brand-50 hover:bg-brand-100 py-3 rounded-xl transition">
                  Confirmar
                </button>
              )}
              <button onClick={() => onStatusChange(fullApt.id, 'COMPLETED', comment)} className="w-full text-sm text-emerald-600 font-semibold bg-emerald-50 hover:bg-emerald-100 py-3 rounded-xl transition">
                Completar
              </button>
              <button onClick={() => onStatusChange(fullApt.id, 'NO_SHOW', comment)} className="w-full text-sm text-slate-600 font-semibold bg-slate-100 hover:bg-slate-200 py-3 rounded-xl transition">
                No Show
              </button>
              <button onClick={() => onStatusChange(fullApt.id, 'CANCELLED', comment)} className="w-full text-sm text-red-600 font-semibold bg-red-50 hover:bg-red-100 py-3 rounded-xl transition">
                Cancelar
              </button>
            </div>
          )}

          {fullApt.clientId?.phone && (
            <div className="border-t border-slate-100 pt-4">
              <button
                onClick={() => setShowWAConfirm(true)}
                className="w-full flex items-center justify-center gap-2 text-sm text-white font-semibold bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl transition shadow-md shadow-emerald-600/10"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16">
                  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                </svg>
                Contactar por WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>
      {showWAConfirm && <WhatsAppConfirmModal phone={fullApt.clientId?.phone} onClose={() => setShowWAConfirm(false)} />}
    </div>
  );
}
