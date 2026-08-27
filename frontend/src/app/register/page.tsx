'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../providers/AuthProvider';
import { registerSchema } from '@miturnouy/validation';

export default function RegisterPage() {
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    businessSlug: '',
    businessType: 'barberia',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Pre-validate via Zod
    const check = registerSchema.safeParse(formData);
    if (!check.success) {
      setError(check.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      await register(formData);
    } catch (err: any) {
      setError(err.message || 'Error al registrar la cuenta. Por favor verifica los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-4xl mb-2 select-none animate-pulse">✿</div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 font-sans">
          Crea tu cuenta en MiTurno
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-500 transition-colors">
            Inicia sesión aquí
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-premium rounded-2xl border border-slate-100 sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Tu nombre
              </label>
              <input
                name="name"
                type="text"
                required
                disabled={loading}
                value={formData.name}
                onChange={handleChange}
                placeholder="Nombre Completo"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/55 px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Correo electrónico
              </label>
              <input
                name="email"
                type="email"
                required
                disabled={loading}
                value={formData.email}
                onChange={handleChange}
                placeholder="ejemplo@correo.com"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/55 px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Contraseña
              </label>
              <input
                name="password"
                type="password"
                required
                disabled={loading}
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/55 px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all disabled:opacity-50"
              />
            </div>

            <div className="border-t border-slate-100 my-4 pt-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Datos del Negocio</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Nombre de tu Negocio
              </label>
              <input
                name="businessName"
                type="text"
                required
                disabled={loading}
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Ej. Barbería Classic"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/55 px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Dirección Web del Negocio (Slug)
              </label>
              <div className="flex rounded-xl bg-slate-50/55 border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/10 focus-within:border-brand-500 transition-all">
                <span className="flex select-none items-center pl-3 text-slate-400 text-xs font-medium">
                  miturno.com/book/
                </span>
                <input
                  name="businessSlug"
                  type="text"
                  required
                  disabled={loading}
                  value={formData.businessSlug}
                  onChange={handleChange}
                  placeholder="barberia-classic"
                  className="block w-full border-0 bg-transparent py-1.5 pl-1 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:ring-0 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Tipo de Negocio
              </label>
              <select
                name="businessType"
                disabled={loading}
                value={formData.businessType}
                onChange={handleChange}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/55 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all disabled:opacity-50"
              >
                <option value="barberia">Barbería / Peluquería</option>
                <option value="estetica">Centro de Estética</option>
                <option value="salud">Consultorio Médico / Nutricionista</option>
                <option value="veterinaria">Veterinaria</option>
                <option value="profesor">Clases / Entrenador</option>
                <option value="tatuajes">Estudio de Tatuajes</option>
                <option value="servicios">Servicios Profesionales</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none"
              >
                {loading ? 'Creando cuenta...' : 'Crear Cuenta y Registrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
