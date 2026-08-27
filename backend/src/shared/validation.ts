import { z } from 'zod';

// Time validator HH:MM
const timeStringSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
  message: 'Time must be in HH:MM format',
});

// Date validator YYYY-MM-DD
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Date must be in YYYY-MM-DD format',
});

// Slot schema
export const slotSchema = z.object({
  startTime: timeStringSchema,
  endTime: timeStringSchema,
});

// Day schedule schema
export const dayScheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  isOpen: z.boolean(),
  slots: z.array(slotSchema),
});

// Weekly schedule schema
export const weeklyScheduleSchema = z.object({
  days: z.array(dayScheduleSchema).length(7),
});

// Exception schema
export const scheduleExceptionSchema = z.object({
  date: dateStringSchema,
  isOpen: z.boolean(),
  slots: z.array(slotSchema),
});

// Auth validation
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  businessName: z.string().min(2, 'El nombre del negocio debe tener al menos 2 caracteres'),
  businessSlug: z.string().min(2, 'El slug del negocio debe tener al menos 2 caracteres')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  businessType: z.string().min(2, 'Selecciona un tipo de negocio'),
});

// Business validation
export const businessSettingsSchema = z.object({
  businessHours: weeklyScheduleSchema,
  timezone: z.string().default('America/Argentina/Buenos_Aires'),
  calendarColor: z.string().optional(),
});

export const businessSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  slug: z.string().min(2, 'Slug requerido').regex(/^[a-z0-9-]+$/),
  type: z.string().min(2, 'Tipo requerido'),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  settings: businessSettingsSchema,
});

// Client validation
export const clientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().min(6, 'El teléfono debe tener al menos 6 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Professional validation
export const professionalSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  description: z.string().optional(),
  photoUrl: z.string().url('URL de foto inválida').optional().or(z.literal('')),
  specialties: z.array(z.string()).default([]),
  services: z.array(z.string()).default([]),
  calendarColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido'),
  active: z.boolean().default(true),
  schedule: weeklyScheduleSchema,
  exceptions: z.array(scheduleExceptionSchema).default([]),
});

// Service validation
export const serviceSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  category: z.string().min(2, 'Categoría requerida'),
  price: z.number().min(0, 'El precio debe ser un número positivo'),
  duration: z.number().min(1, 'La duración debe ser de al menos 1 minuto'),
  bufferBefore: z.number().min(0).default(0),
  bufferAfter: z.number().min(0).default(0),
  professionalsConfig: z.array(z.object({
    professionalId: z.string(),
    availabilityDays: z.array(z.number().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  })).default([]),
  imageUrl: z.string().url('URL de imagen inválida').optional().or(z.literal('')),
  bookingMode: z.enum(['DIRECT', 'QUOTE', 'BOTH']).default('DIRECT'),
  active: z.boolean().default(true),
});

// Quote Request validation
export const quoteRequestSchema = z.object({
  serviceId: z.string().min(1, 'Servicio requerido'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(6, 'El teléfono debe tener al menos 6 caracteres'),
  description: z.string().min(10, 'Por favor, describe qué necesitas (mínimo 10 caracteres)'),
});

// Appointment validation
export const appointmentSchema = z.object({
  clientId: z.string().min(1, 'Cliente requerido'),
  professionalId: z.string().min(1, 'Profesional requerido'),
  serviceId: z.string().min(1, 'Servicio requerido'),
  date: dateStringSchema,
  startTime: timeStringSchema,
  endTime: timeStringSchema,
  notes: z.string().optional(),
  couponCode: z.string().optional(),
});

// Booking public validation
export const publicBookingSchema = z.object({
  professionalId: z.string().min(1, 'Profesional requerido'),
  serviceId: z.string().min(1, 'Servicio requerido'),
  date: dateStringSchema,
  startTime: timeStringSchema,
  clientName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  clientPhone: z.string().min(6, 'El teléfono debe tener al menos 6 caracteres'),
  clientEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
});

// Coupon validation
export const baseCouponSchema = z.object({
  code: z.string().min(3, 'El código debe tener al menos 3 caracteres').toUpperCase(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().min(1, 'El valor debe ser mayor a 0'),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  maxUses: z.number().min(1).optional().nullable(),
  maxUsesPerClient: z.number().min(1).optional().nullable(),
  minPurchaseAmount: z.number().min(0).optional().nullable(),
  specificServices: z.array(z.string()).default([]),
  description: z.string().optional().nullable().or(z.literal('')),
  active: z.boolean().default(true),
});

export const couponSchema = baseCouponSchema.refine(data => new Date(data.startDate) <= new Date(data.endDate), {
  message: 'La fecha de fin debe ser posterior a la de inicio',
  path: ['endDate'],
});

// Promotion validation
export const promotionSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  serviceId: z.string().min(1, 'Servicio requerido'),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().min(1, 'El valor del descuento debe ser mayor a 0'),
  startDayOfWeek: z.number().min(0).max(6).optional().nullable(),
  startTime: timeStringSchema.optional().nullable().or(z.literal('')),
  endTime: timeStringSchema.optional().nullable().or(z.literal('')),
  startDate: dateStringSchema.optional().nullable().or(z.literal('')),
  endDate: dateStringSchema.optional().nullable().or(z.literal('')),
  forNewClients: z.boolean().default(false),
  description: z.string().optional().nullable().or(z.literal('')),
  active: z.boolean().default(true),
});
