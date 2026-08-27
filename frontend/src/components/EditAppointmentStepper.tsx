'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '../lib/api/client';
import { Calendar, Clock, User, Scissors, X } from 'lucide-react';

export default function EditAppointmentStepper({ appointment, onClose }: { appointment: any, onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    serviceId: appointment.serviceId?.id,
    professionalId: appointment.professionalId?.id,
    date: appointment.date,
    startTime: appointment.startTime,
  });
  const queryClient = useQueryClient();

  const { data: services } = useQuery({ queryKey: ['services', appointment.businessId], queryFn: () => apiFetch(`/public/${appointment.businessId}/services`) });
  const { data: professionals } = useQuery({ queryKey: ['professionals', appointment.businessId], queryFn: () => apiFetch(`/public/${appointment.businessId}/professionals`) });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiFetch(`/public/appointments/${appointment.id}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Modificar Reserva</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
            <X size={20} />
          </button>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex justify-between mb-8 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span className={step >= 1 ? 'text-blue-600' : ''}>1. Servicio</span>
          <span className={step >= 2 ? 'text-blue-600' : ''}>2. Profesional</span>
          <span className={step >= 3 ? 'text-blue-600' : ''}>3. Fecha</span>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {step === 1 && (
            <div className="space-y-3">
              {services?.map((s: any) => (
                <button key={s.id} onClick={() => setFormData({...formData, serviceId: s.id})} 
                        className={`w-full p-4 rounded-2xl border-2 transition flex justify-between items-center ${formData.serviceId === s.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Scissors size={18}/></div>
                      <div className='text-left'>
                          <p className="font-bold text-slate-900">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.duration} min</p>
                      </div>
                  </div>
                  <p className="font-semibold text-slate-900">${s.price}</p>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {professionals?.map((p: any) => (
                <button key={p.id} onClick={() => setFormData({...formData, professionalId: p.id})} 
                        className={`w-full p-4 rounded-2xl border-2 transition flex items-center gap-3 ${formData.professionalId === p.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                  <div className="p-2 bg-slate-100 rounded-full text-slate-600"><User size={20}/></div>
                  <p className="font-bold text-slate-900">{p.name}</p>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                      <label className='text-sm font-medium text-slate-500 flex items-center gap-2'><Calendar size={16}/> Fecha</label>
                      <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none" />
                  </div>
                  <div className='space-y-2'>
                      <label className='text-sm font-medium text-slate-500 flex items-center gap-2'><Clock size={16}/> Hora</label>
                      <input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none" />
                  </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Area */}
        <div className="mt-6 pt-4 border-t border-slate-100">
           {step === 1 && (
              <div className="flex gap-3">
                <button disabled className="flex-1 bg-slate-100 p-3 rounded-xl text-slate-400 font-semibold">Atrás</button>
                <button onClick={() => setStep(2)} className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-semibold hover:bg-blue-700 transition">Siguiente</button>
              </div>
           )}
           {step === 2 && (
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 bg-slate-200 p-3 rounded-xl text-slate-700 font-semibold hover:bg-slate-300 transition">Atrás</button>
                <button onClick={() => setStep(3)} className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-semibold hover:bg-blue-700 transition">Siguiente</button>
              </div>
           )}
           {step === 3 && (
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 bg-slate-200 p-3 rounded-xl text-slate-700 font-semibold hover:bg-slate-300 transition">Atrás</button>
                <button onClick={() => updateMutation.mutate(formData)} className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-semibold hover:bg-blue-700 transition">Guardar Cambios</button>
              </div>
           )}
           <button onClick={onClose} className="mt-4 text-sm text-slate-500 w-full text-center">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
