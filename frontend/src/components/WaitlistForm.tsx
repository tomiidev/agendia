'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiFetch from '../lib/api/client';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface WaitlistFormProps {
  businessId: string;
  serviceId: string;
  professionalId: string;
  requestedDate: string;
  onSuccess?: () => void;
}

export default function WaitlistForm({
  businessId,
  serviceId,
  professionalId,
  requestedDate,
  onSuccess,
}: WaitlistFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) =>
      apiFetch('/waitlist', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      setSubmitted(true);
      if (onSuccess) onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    mutation.mutate({
      businessId,
      serviceId,
      professionalId,
      requestedDate,
      contactEmail: email,
      contactPhone: phone,
    });
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-emerald-900">¡Te has unido a la lista!</h3>
        <p className="text-sm text-emerald-700 mt-1">
          Te avisaremos si se libera un espacio para la fecha solicitada.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-slate-900 mb-1">¿Sin disponibilidad?</h3>
      <p className="text-sm text-slate-500 mb-4">
        Únete a la lista de espera y te contactaremos si alguien cancela.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          data-testid="waitlist-email"
          placeholder="Tu email (obligatorio)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
        />
        <input
          type="tel"
          data-testid="waitlist-phone"
          placeholder="WhatsApp (opcional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
        />

        <button
          type="submit"
          data-testid="waitlist-submit"
          disabled={mutation.isPending || !email}
          className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
            </>
          ) : (
            'Unirme a la lista de espera'
          )}
        </button>
      </form>
      {mutation.isError && (
        <p className="text-xs text-red-500 mt-2 text-center">
          Ocurrió un error. Inténtalo de nuevo.
        </p>
      )}
    </div>
  );
}
