import React from 'react';

interface Tab {
  id: string;
  label: string;
}

interface FilterTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: any) => void;
}

export function FilterTabs({ tabs, activeTab, onChange }: FilterTabsProps) {
  return (
    <div className="flex border-b border-slate-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeTab === tab.id
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
