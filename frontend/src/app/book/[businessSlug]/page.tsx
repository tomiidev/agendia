'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import apiFetch from '../../../lib/api/client';
import { ChevronRight, ArrowLeft, Check, ClipboardList } from 'lucide-react';
import RecurrencePicker from '../../../components/RecurrencePicker';

type Step = 'service' | 'choice' | 'professional' | 'date' | 'time' | 'details' | 'confirm' | 'quoteDetails';

export default function PublicBookingPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const [step, setStep] = useState<Step>('service');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientData, setClientData] = useState({ name: '', phone: '', email: '', notes: '' });
  const [recurrence, setRecurrence] = useState({ enabled: false, daysOfWeek: [], endDate: new Date().toISOString().split('T')[0] });
  const [couponCode, setCouponCode] = useState('');
  const [bookingDone, setBookingDone] = useState(false);
  const [isQuoteFlow, setIsQuoteFlow] = useState(false);
  const [quoteDescription, setQuoteDescription] = useState('');
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);

  const { data: business, isLoading: bizLoading, error: bizError } = useQuery({
    queryKey: ['public-business', businessSlug],
    queryFn: () => apiFetch(`/public/by-slug/${businessSlug}`),
    enabled: !!businessSlug,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['public-services', business?.id],
    queryFn: () => apiFetch(`/public/${business?.id}/services`),
    enabled: !!business?.id,
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ['public-professionals', business?.id],
    queryFn: () => apiFetch(`/public/${business?.id}/professionals`),
    enabled: !!business?.id,
  });

  const availableProfs = selectedService ? professionals.filter((p: any) => p.services.includes(selectedService.id)) : professionals;

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['public-slots', business?.id, selectedService?.id, selectedProfessional?.id, selectedDate],
    queryFn: () => apiFetch(`/public/${business?.id}/availability?serviceId=${selectedService?.id}&professionalId=${selectedProfessional?.id}&date=${selectedDate}`),
    enabled: !!business?.id && !!selectedService?.id && !!selectedProfessional?.id && !!selectedDate,
  });

  const bookMutation = useMutation({
    mutationFn: (data: any) => apiFetch('/appointments', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => setBookingDone(true),
  });

  const quoteMutation = useMutation({
    mutationFn: (data: any) => apiFetch(`/public/${business?.id}/quote-requests`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => setQuoteSubmitted(true),
  });

  const handleBook = () => {
    bookMutation.mutate({
      businessId: business?.id,
      serviceId: selectedService?.id,
      professionalId: selectedProfessional?.id,
      date: selectedDate,
      startTime: selectedTime,
      clientName: clientData.name,
      clientPhone: clientData.phone,
      clientEmail: clientData.email,
      notes: clientData.notes,
      couponCode: couponCode || undefined,
      recurrence,
    });
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientData.name || !clientData.phone || !clientData.email || !quoteDescription) return;

    quoteMutation.mutate({
      serviceId: selectedService?.id,
      name: clientData.name,
      phone: clientData.phone,
      email: clientData.email,
      description: quoteDescription,
    });
  };

  const handleBack = () => {
    if (step === 'choice') {
      setStep('service');
    } else if (step === 'quoteDetails') {
      if (selectedService?.bookingMode === 'BOTH') {
        setStep('choice');
      } else {
        setStep('service');
      }
    } else if (step === 'professional') {
      if (selectedService?.bookingMode === 'BOTH') {
        setStep('choice');
      } else {
        setStep('service');
      }
    } else {
      const stepsList: Step[] = ['service', 'professional', 'date', 'time', 'details', 'confirm'];
      const idx = stepsList.indexOf(step);
      if (idx > 0) {
        setStep(stepsList[idx - 1]);
      } else {
        setStep('service');
      }
    }
  };

  const stepsList: Step[] = ['service', 'professional', 'date', 'time', 'details', 'confirm'];

  const getStepIndicatorText = () => {
    if (isQuoteFlow) {
      const current = step === 'service' ? 1 : step === 'choice' ? 2 : (selectedService?.bookingMode === 'BOTH' ? 3 : 2);
      const total = selectedService?.bookingMode === 'BOTH' ? 3 : 2;
      return `Paso ${current} / ${total}`;
    } else {
      const offset = selectedService?.bookingMode === 'BOTH' ? 1 : 0;
      let current = 1;
      if (step === 'choice') current = 2;
      else if (step === 'professional') current = 2 + offset;
      else if (step === 'date') current = 3 + offset;
      else if (step === 'time') current = 4 + offset;
      else if (step === 'details') current = 5 + offset;
      else if (step === 'confirm') current = 6 + offset;

      const total = selectedService?.bookingMode === 'BOTH' ? 7 : 6;
      return `Paso ${current} / ${total}`;
    }
  };

  if (bizLoading) return <div className="p-10 text-center text-slate-500">Cargando...</div>;
  if (bizError || !business) return <div className="p-10 text-center text-red-500">Negocio no encontrado</div>;

  if (bookingDone) return <div className="p-10 text-center font-bold text-emerald-600 text-xl">¡Reserva confirmada!</div>;

  if (quoteSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex items-center justify-center p-5">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">¡Solicitud enviada!</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Recibimos tus datos.<br />El negocio se pondrá en contacto contigo para enviarte el presupuesto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-md mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-bold text-lg">{business.name.slice(0, 1)}</div>
            <div><h1 className="text-base font-bold tracking-tight text-slate-900">{business.name}</h1><p className="text-xs text-slate-500">Reserva de turno</p></div>
          </div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{getStepIndicatorText()}</div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 py-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          {step === 'service' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">¿Qué servicio buscas?</h2>
              {services.map((s: any) => (
                <button key={s.id} data-testid={`service-${s.id}`} onClick={() => {
                  setSelectedService(s);
                  if (s.bookingMode === 'QUOTE') {
                    setIsQuoteFlow(true);
                    setStep('quoteDetails');
                  } else if (s.bookingMode === 'BOTH') {
                    setStep('choice');
                  } else {
                    setIsQuoteFlow(false);
                    setStep('professional');
                  }
                }}
                  className={`flex justify-between items-center w-full p-4 rounded-2xl border ${selectedService?.id === s.id ? 'border-brand-500 bg-brand-50' : 'border-slate-100 hover:border-brand-200'}`}>
                  <span className="font-semibold text-slate-800 text-left">{s.name}</span>
                  {selectedService?.id === s.id && <Check className="w-5 h-5 text-brand-600" />}
                </button>
              ))}
            </div>
          )}

          {step === 'choice' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Elige una opción</h2>
                <p className="text-sm text-slate-500">¿Cómo deseas contratar el servicio <strong>{selectedService?.name}</strong>?</p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  data-testid="choice-book"
                  onClick={() => {
                    setIsQuoteFlow(false);
                    setStep('professional');
                  }}
                  className="flex flex-col p-5 rounded-2xl border border-slate-100 hover:border-brand-500 hover:bg-brand-50/30 transition-all text-left"
                >
                  <span className="font-bold text-slate-800 text-lg">Reservar turno</span>
                  <span className="text-xs text-slate-500 mt-1">Elige profesional, fecha y hora para reservar tu lugar de forma directa.</span>
                </button>
                <button
                  data-testid="choice-quote"
                  onClick={() => {
                    setIsQuoteFlow(true);
                    setStep('quoteDetails');
                  }}
                  className="flex flex-col p-5 rounded-2xl border border-slate-100 hover:border-brand-500 hover:bg-brand-50/30 transition-all text-left"
                >
                  <span className="font-bold text-slate-800 text-lg">Pedir presupuesto</span>
                  <span className="text-xs text-slate-500 mt-1">Envíanos tus datos y lo que necesitas para que nos contactemos contigo con una cotización.</span>
                </button>
              </div>
            </div>
          )}

          {step === 'professional' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">¿Con quién?</h2>

              {Array.isArray(availableProfs) && availableProfs.length > 0 ? (
                availableProfs.map((p: any) => (
                  <button key={p.id} data-testid={`professional-${p.id}`} onClick={() => setSelectedProfessional(p)}
                    className={`flex items-center gap-4 w-full p-4 rounded-2xl border ${selectedProfessional?.id === p.id ? 'border-brand-500 bg-brand-50' : 'border-slate-100 hover:border-brand-200'}`}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: p.calendarColor || '#8b5cf6' }}>{p.name.slice(0, 1)}</div>
                    <span className="font-semibold text-slate-800 text-left">{p.name}</span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-500">No hay profesionales disponibles.</p>
              )}
            </div>
          )}

          {step === 'date' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">¿Qué día?</h2>

              <input type="date" data-testid="date-input" min={new Date().toISOString().split('T')[0]} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full p-4 rounded-2xl border border-slate-200 text-lg" />
            </div>
          )}

          {step === 'time' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">¿Qué hora?</h2>

              {slotsLoading ? <p className="text-sm text-slate-500">Cargando...</p> : (
                Array.isArray(slots) && slots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((s: any) => (
                      <button key={s.startTime} data-testid={`time-${s.startTime}`} onClick={() => setSelectedTime(s.startTime)} className={`p-3 rounded-xl border font-medium ${selectedTime === s.startTime ? 'bg-brand-600 text-white' : 'hover:border-brand-400'}`}>{s.startTime}</button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No hay horarios disponibles para este día.</p>
                )
              )}
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Tus datos</h2>
              <input data-testid="input-name" className="w-full p-3 rounded-xl border border-slate-200" placeholder="Nombre completo" value={clientData.name} onChange={e => setClientData({ ...clientData, name: e.target.value })} />
              <input data-testid="input-phone" className="w-full p-3 rounded-xl border border-slate-200" placeholder="Teléfono" value={clientData.phone} onChange={e => setClientData({ ...clientData, phone: e.target.value })} />
              <input data-testid="input-email" className="w-full p-3 rounded-xl border border-slate-200" placeholder="Email (opcional)" value={clientData.email} onChange={e => setClientData({ ...clientData, email: e.target.value })} />
              <textarea data-testid="input-notes" className="w-full p-3 rounded-xl border border-slate-200" placeholder="Notas adicionales" value={clientData.notes} onChange={e => setClientData({ ...clientData, notes: e.target.value })} rows={2} />
              <RecurrencePicker value={recurrence} onChange={setRecurrence} startDate={selectedDate} />
            </div>
          )}

          {step === 'quoteDetails' && (
            <form onSubmit={handleQuoteSubmit} className="space-y-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Solicitar Presupuesto</h2>
              <p className="text-sm text-slate-500">Completá el formulario para el servicio: <strong>{selectedService?.name}</strong></p>

              <div className="space-y-3 mt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre completo *</label>
                  <input
                    required
                    data-testid="quote-name"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-none"
                    placeholder="Nombre completo"
                    value={clientData.name}
                    onChange={e => setClientData({ ...clientData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono *</label>
                  <input
                    required
                    data-testid="quote-phone"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-none"
                    placeholder="Teléfono"
                    value={clientData.phone}
                    onChange={e => setClientData({ ...clientData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
                  <input
                    required
                    type="email"
                    data-testid="quote-email"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-none"
                    placeholder="ejemplo@correo.com"
                    value={clientData.email}
                    onChange={e => setClientData({ ...clientData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">¿Qué necesitas? (Mínimo 10 caracteres) *</label>
                  <textarea
                    required
                    data-testid="quote-description"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-none resize-none"
                    placeholder="Describe brevemente lo que necesitas..."
                    value={quoteDescription}
                    onChange={e => setQuoteDescription(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </form>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Confirmar</h2>
              <div className="text-sm space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-slate-600">Servicio: <strong className="text-slate-900">{selectedService?.name}</strong></p>
                <p className="text-slate-600">Profesional: <strong className="text-slate-900">{selectedProfessional?.name}</strong></p>
                <p className="text-slate-600">Fecha: <strong className="text-slate-900">{selectedDate}</strong> a las <strong className="text-slate-900">{selectedTime}</strong></p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 p-4 z-30">
        <div className="max-w-md mx-auto flex gap-4">
          {step !== 'service' && <button data-testid="btn-back" onClick={handleBack} className="flex-1 p-4 rounded-2xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200">Atrás</button>}

          {step === 'quoteDetails' ? (
            <button
              data-testid="btn-quote-submit"
              disabled={
                quoteMutation.isPending ||
                !clientData.name ||
                !clientData.phone ||
                !clientData.email ||
                !quoteDescription ||
                quoteDescription.length < 10
              }
              onClick={handleQuoteSubmit}
              className="flex-[2] p-4 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/20 disabled:opacity-50"
            >
              {quoteMutation.isPending ? 'Enviando...' : 'Pedir Presupuesto'}
            </button>
          ) : step === 'confirm' ? (
            <button data-testid="btn-confirm" onClick={handleBook} className="flex-[2] p-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">Confirmar</button>
          ) : step === 'choice' ? (
            null
          ) : (
            <button data-testid="btn-continue" onClick={() => setStep(stepsList[stepsList.indexOf(step) + 1] || 'confirm')} className="flex-[2] p-4 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/20">Continuar</button>
          )}
        </div>
      </footer>
    </div>
  );
}
