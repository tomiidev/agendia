'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiFetch from '../../../lib/api/client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ClientLoginPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const router = useRouter();

  const requestOtp = useMutation({
    mutationFn: (data: any) => apiFetch('/auth/public/request-otp', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => setStep('verify'),
  });

  const verifyOtp = useMutation({
    mutationFn: (data: any) => apiFetch('/auth/public/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      router.push(`/client-dashboard`);
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white p-8 rounded-3xl shadow-premium">
        <h1 className="text-xl font-bold mb-6 text-center">Acceder a mis turnos</h1>
        {step === 'request' ? (
          <form onSubmit={(e) => { e.preventDefault(); requestOtp.mutate({ email }); }}>
            <input 
              type="email" placeholder="Tu email" className="w-full p-3 rounded-xl border mb-4" 
              value={email} onChange={e => setEmail(e.target.value)} required 
            />
            <button className="w-full bg-brand-600 text-white p-3 rounded-xl">Enviar código</button>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); verifyOtp.mutate({ email, code }); }}>
            <input 
              type="text" placeholder="Código de 6 dígitos" className="w-full p-3 rounded-xl border mb-4" 
              value={code} onChange={e => setCode(e.target.value)} required 
            />
            <button className="w-full bg-brand-600 text-white p-3 rounded-xl">Verificar</button>
          </form>
        )}
      </div>
    </div>
  );
}
