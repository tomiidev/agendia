import React from 'react';

export function SkeletonServiceCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-premium">
      <div className="space-y-3">
        <div className="h-3 w-20 rounded skeleton-shimmer" />
        <div className="h-4 w-40 rounded skeleton-shimmer" />
        <div className="h-3 w-28 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}
