export type Role = 'OWNER' | 'ADMIN' | 'PROFESSIONAL';

export interface User {
  id: string;
  email: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DaySchedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  isOpen: boolean;
  slots: Array<{ startTime: string; endTime: string }>; // e.g. "09:00" to "13:00"
}

export interface WeeklySchedule {
  days: DaySchedule[];
}

export interface ScheduleException {
  date: string; // YYYY-MM-DD
  isOpen: boolean;
  slots: Array<{ startTime: string; endTime: string }>;
}

export interface BusinessSettings {
  businessHours: WeeklySchedule;
  timezone: string;
  calendarColor?: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  type: string; // e.g. "barberia", "estetica", "clinica"
  description?: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  active: boolean;
  settings: BusinessSettings;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  businessId: string;
  role: Role;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  
  // Computed fields (optional/for CRM reports)
  appointmentCount?: number;
  totalSpent?: number;
  lastVisit?: string;
}

export interface Professional {
  id: string;
  businessId: string;
  userId?: string; // Optional: Link to a user profile for login access
  name: string;
  email?: string;
  phone?: string;
  description?: string;
  photoUrl?: string;
  specialties: string[];
  services: string[]; // List of service IDs assigned
  calendarColor: string; // HEX color for visual display
  active: boolean;
  schedule: WeeklySchedule;
  exceptions: ScheduleException[];
  createdAt: string;
  updatedAt: string;
}

export type BookingMode = 'DIRECT' | 'QUOTE' | 'BOTH';

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  duration: number; // in minutes
  bufferBefore?: number; // in minutes
  bufferAfter?: number; // in minutes
  professionals: string[]; // List of professional IDs assigned
  imageUrl?: string;
  bookingMode?: BookingMode;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type QuoteRequestStatus = 'PENDING' | 'CONTACTED' | 'CLOSED';

export interface QuoteRequest {
  id: string;
  businessId: string;
  serviceId: string;
  clientId?: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  status: QuoteRequestStatus;
  createdAt: string;
  updatedAt: string;
  
  // Populated fields
  service?: Service;
  client?: Client;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

export interface StatusHistoryEntry {
  status: AppointmentStatus;
  comment?: string;
  timestamp: string;
}

export interface Appointment {
  id: string;
  businessId: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: AppointmentStatus;
  notes?: string;
  couponId?: string;
  discountAmount?: number;
  finalPrice: number;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;

  // Joined fields (frontend support)
  client?: Client;
  professional?: Professional;
  service?: Service;
}

export interface Coupon {
  id: string;
  businessId: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number; // discount value (e.g. 15 for 15% or 1000 for 1000 ARS/USD)
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  maxUses?: number;
  usedCount: number;
  maxUsesPerClient?: number;
  minPurchaseAmount?: number;
  specificServices: string[]; // empty means all
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Promotion {
  id: string;
  businessId: string;
  name: string;
  serviceId: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  startDayOfWeek?: number; // Optional recurring day of week
  startTime?: string;
  endTime?: string;
  startDate?: string; // Optional fixed range
  endDate?: string;
  forNewClients: boolean;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySlot {
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  slots: AvailabilitySlot[];
}
