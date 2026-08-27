'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';
import apiFetch from '../../lib/api/client';
import {
  LayoutDashboard,
  Calendar,
  SlidersHorizontal,
  Users,
  Settings,
  Ticket,
  BarChart3,
  LogOut,
  Menu,
  ChevronDown,
  Building,
  Plus,
  UserCircle,
  ClipboardList
} from 'lucide-react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, activeBusiness, memberships, logout, activeProfessional, setActiveProfessional } = useAuth();
  const pathname = usePathname() || '';
  const [showProfDropdown, setShowProfDropdown] = useState(false);
  const [professionals, setProfessionals] = useState<any[]>([]);

  useEffect(() => {
    if (activeBusiness?.id) {
      apiFetch('/professionals').then(res => setProfessionals(res || []));
    }
  }, [activeBusiness?.id]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Agenda', href: '/agenda', icon: Calendar },
    { name: 'Presupuestos', href: '/quotes', icon: ClipboardList },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Servicios', href: '/services', icon: Settings },
    { name: 'Cupones & Promos', href: '/coupons', icon: Ticket },
    { name: 'Reportes', href: '/reports', icon: BarChart3 },
    { name: 'Configuración', href: '/settings', icon: SlidersHorizontal },
  ];

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden">
      {/* LEFT SIDEBAR ... (same as before) */}
      <aside className="w-16 md:w-20 h-screen bg-white border-r border-slate-100 flex flex-col justify-between items-center py-5 shrink-0 z-30 shadow-[1px_0_0_0_rgba(241,245,249,1)]">
        {/* Brand Logo & Nav Container */}
        <div className="flex flex-col items-center gap-6 w-full min-h-0 flex-1">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-brand-50 text-brand-600 font-bold text-lg select-none shrink-0">
            <span className="animate-pulse">✿</span>
            <div className="absolute inset-0 rounded-full border border-brand-200/50 scale-110"></div>
          </div>
          <div className="w-8 border-b border-slate-100 shrink-0"></div>
          {/* MAIN NAV SECTION */}
          <div className="flex flex-col gap-5 items-center w-full overflow-y-auto flex-1 min-h-0 no-scrollbar py-2">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  data-testid={`nav-${item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ & /g, '-').replace(/ /g, '-')}`}
                  className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all shrink-0 ${
                    isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[1.8]" />
                </Link>
              );
            })}
          </div>
        </div>
        {/* Bottom actions */}
        <div className="flex flex-col items-center gap-4 w-full shrink-0 pt-4 border-t border-slate-100/50 mt-4">
          <button onClick={logout} title="Cerrar sesión" className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer shrink-0">
            <LogOut className="w-5 h-5 stroke-[1.8]" />
          </button>
        </div>
      </aside>

      {/* RIGHT SIDE MAIN CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
          {/* Tenant Business Name Label */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span>{activeBusiness?.name || 'Mi Negocio'}</span>
            </div>
          </div>

          {/* Professional Session Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowProfDropdown(!showProfDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
            >
              <UserCircle className="w-4 h-4 text-slate-500" />
              <span>Sesión: {activeProfessional ? activeProfessional.name : user?.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            
            {showProfDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Profesionales</div>
                {activeProfessional && (
                  <button
                    onClick={() => {
                      setActiveProfessional(null);
                      setShowProfDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-brand-600 hover:bg-brand-50 border-b border-slate-100"
                  >
                    Restablecer a Admin
                  </button>
                )}
                <div className="max-h-[70vh] overflow-y-auto">
                  {professionals.map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActiveProfessional(p);
                          setShowProfDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                          activeProfessional?.id === p.id 
                            ? 'bg-slate-50 font-semibold text-brand-600' 
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                          {p.name}
                      </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
