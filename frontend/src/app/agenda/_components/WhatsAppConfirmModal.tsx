'use client';

export function WhatsAppConfirmModal({ phone, onClose }: { phone: string; onClose: () => void }) {
  const cleanPhone = phone.replace(/\D/g, '');
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h3 className="font-bold text-slate-900 text-lg">Contactar por WhatsApp</h3>
        <p className="text-sm text-slate-600">Se redirigirá a WhatsApp Web en una nueva pestaña para contactar al cliente.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200">Cancelar</button>
          <a
            href={`https://wa.me/${cleanPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 text-center"
          >
            Continuar
          </a>
        </div>
      </div>
    </div>
  );
}
