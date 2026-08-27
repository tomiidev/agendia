import React from 'react';
import { ChevronRight, DollarSign, Clock } from 'lucide-react';
import { getCategoryColor } from './utils';

export function ServiceCard({ service, onClick }: { service: any; onClick: () => void }) {
  const catColor = getCategoryColor(service.category || '');

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border ${service.active ? 'border-slate-100' : 'border-slate-100 opacity-60'} p-5 hover:shadow-premium-lg transition-all shadow-premium cursor-pointer group`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {service.category && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${catColor}`}>
                {service.category}
              </span>
            )}
            {!service.active && (
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                Inactivo
              </span>
            )}
          </div>
          <h3 className="font-semibold text-slate-800 text-sm group-hover:text-brand-600 transition-colors">
            {service.name}
          </h3>
          {service.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{service.description}</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors shrink-0 mt-0.5" />
      </div>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50 flex-wrap">
        <span className="flex items-center gap-1 text-sm font-bold text-slate-800">
          <DollarSign className="w-3.5 h-3.5 text-brand-500" />
          {service.price?.toLocaleString('es-AR')}
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
          <Clock className="w-3 h-3" /> {service.duration} min
        </span>
        {(service.bufferBefore || service.bufferAfter) && (
          <span className="text-[10px] text-slate-300 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
            Buffer: {service.bufferBefore ?? 0}' / {service.bufferAfter ?? 0}'
          </span>
        )}
      </div>
    </div>
  );
}
