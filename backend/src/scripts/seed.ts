import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { BusinessModel } from '../modules/businesses/model';
import { ClientModel } from '../modules/clients/model';
import { ProfessionalModel } from '../modules/professionals/model';
import { ServiceModel } from '../modules/services/model';
import { AppointmentModel } from '../modules/appointments/model';
import { WaitlistModel } from '../modules/waitlist/model';
import { CouponModel } from '../modules/coupons/model';
import { PromotionModel } from '../modules/promotions/model';
import { UserModel } from '../modules/users/model';
import { MembershipModel } from '../modules/memberships/model';
import { QuoteRequestModel } from '../modules/quote-requests/model';
import connectDB from '../config/db';

const professionalNames = ['Ana Martínez', 'Carlos Rodríguez', 'Sofía Pérez', 'Luis García', 'Elena Sánchez', 'Diego Torres', 'Valentina Ruiz', 'Javier Gómez'];
const clientNames = ['Juan López', 'María García', 'Pedro Fernández', 'Lucía Díaz', 'Martín Morales', 'Camila Ortiz', 'Nicolás Vargas', 'Isabella Castro'];
const serviceNames = ['Corte de Pelo', 'Manicura Spa', 'Masaje Relajante', 'Depilación Láser', 'Limpieza Facial', 'Tratamiento Capilar'];

async function seed() {
  await connectDB();
  console.log('🌱 Starting realistic seed...');

  // Clear existing
  await Promise.all([
    BusinessModel.deleteMany({}),
    ClientModel.deleteMany({}),
    ProfessionalModel.deleteMany({}),
    ServiceModel.deleteMany({}),
    AppointmentModel.deleteMany({}),
    WaitlistModel.deleteMany({}),
    CouponModel.deleteMany({}),
    PromotionModel.deleteMany({}),
    UserModel.deleteMany({}),
    MembershipModel.deleteMany({}),
    QuoteRequestModel.deleteMany({}),
  ]);
  console.log('🧹 Database cleared.');

  // Create Business
  const business = await BusinessModel.create({
    name: 'Estética Integral Belleza',
    slug: 'estetica-belleza',
    email: 'contacto@esteticabelleza.com',
    type: 'Estética',
    settings: {
      businessHours: { days: [{ dayOfWeek: 1, isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] }] },
      timezone: 'America/Argentina/Buenos_Aires',
      calendar: {
        primaryColor: '#7C3AED',
        theme: 'system',
        viewMode: 'week',
        showWeekends: true,
      },
    }
  });

  // Create Admin User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('a', salt);
  const adminUser = await UserModel.create({
    name: 'Admin Principal',
    email: 'a@a.com',
    passwordHash,
  });

  // Create Membership
  await MembershipModel.create({
    businessId: business._id,
    userId: adminUser._id,
    role: 'OWNER',
  });


  const count = 20;

  // Create Professionals
  const pros = await ProfessionalModel.insertMany(
    Array.from({ length: count }).map((_, i) => ({
      businessId: business._id,
      userId: i === 0 ? adminUser._id : null,
      name: professionalNames[i % professionalNames.length] + ` ${i}`,
      email: `a${i}@a.com`,
      password: passwordHash,
      active: true,
      schedule: { days: [{ dayOfWeek: 1, isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] }] }
    }))
  );

  // Create Clients
  const clients = await ClientModel.insertMany(
    Array.from({ length: count }).map((_, i) => ({
      businessId: business._id,
      name: clientNames[i % clientNames.length] + ` ${i}`,
      email: `cliente${i}@gmail.com`,
      phone: `+598 99 ${100000 + i}`,
    }))
  );

  // Create Services
  const services = await ServiceModel.insertMany(
    Array.from({ length: count }).map((_, i) => ({
      businessId: business._id,
      name: serviceNames[i % serviceNames.length] + ` ${i}`,
      category: 'General',
      price: (Math.floor(Math.random() * 10) + 1) * 500,
      duration: 30 * (i % 4 + 1),
      bookingMode: i % 3 === 0 ? 'QUOTE' : i % 3 === 1 ? 'BOTH' : 'DIRECT', // Distribute among all 3 modes
      active: true,
      professionalsConfig: [{ professionalId: pros[i % pros.length]._id, availabilityDays: [0, 1, 2, 3, 4, 5, 6] }],
    }))
  );

  // Link services to professionals
  for (const service of services) {
    for (const config of service.professionalsConfig) {
      await ProfessionalModel.findByIdAndUpdate(config.professionalId, {
        $addToSet: { services: service._id }
      });
    }
  }

  // Create Appointments
  await AppointmentModel.insertMany(
    Array.from({ length: count }).map((_, i) => {
      const service = services[i % services.length];
      
      const baseDate = new Date('2026-08-30T00:00:00Z');
      baseDate.setUTCDate(baseDate.getUTCDate() + Math.floor(i / 5));
      const dateStr = baseDate.toISOString().split('T')[0];

      const startHour = 10 + (i % 5);
      const startMin = 0;
      const durationMinutes = service.duration;

      const startTotalMinutes = startHour * 60 + startMin;
      const endTotalMinutes = startTotalMinutes + durationMinutes;

      const endHour = Math.floor(endTotalMinutes / 60);
      const endMin = endTotalMinutes % 60;

      return {
        businessId: business._id,
        clientId: clients[i % clients.length]._id,
        professionalId: pros[i % pros.length]._id,
        serviceId: service._id,
        date: dateStr,
        startTime: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
        endTime: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
        finalPrice: service.price,
        status: 'CONFIRMED',
      };
    })
  );

  // Create Waitlist
  await WaitlistModel.insertMany(
    Array.from({ length: count }).map((_, i) => ({
      businessId: business._id,
      clientId: clients[i % clients.length]._id,
      professionalId: pros[i % pros.length]._id,
      serviceId: services[i % services.length]._id,
      requestedDate: '2026-09-01',
      contactEmail: `wait${i}@test.com`,
      status: 'PENDING',
    }))
  );

  // Create Coupons
  await CouponModel.insertMany(
    Array.from({ length: count }).map((_, i) => ({
      businessId: business._id,
      code: `PROMO${i}0`,
      type: 'PERCENTAGE',
      value: 10,
      startDate: '2026-08-01',
      endDate: '2026-12-31',
      active: true,
    }))
  );

  // Create Promotions
  await PromotionModel.insertMany(
    Array.from({ length: count }).map((_, i) => ({
      businessId: business._id,
      name: `Promo Temporada ${i + 1}`,
      serviceId: services[i % services.length]._id,
      discountType: 'PERCENTAGE',
      discountValue: 10,
      active: true,
    }))
  );

  // Create Quote Requests
  const statuses = ['PENDING', 'CONTACTED', 'CLOSED'];
  await QuoteRequestModel.insertMany(
    Array.from({ length: 20 }).map((_, i) => ({
      businessId: business._id,
      serviceId: services[i % services.length]._id,
      name: `Cliente ${i + 1}`,
      email: `cliente${i}@test.com`,
      phone: `+598 99 ${100000 + i}`,
      description: `Solicitud de presupuesto para ${services[i % services.length].name}.`,
      status: statuses[i % statuses.length],
    }))
  );

  console.log('🚀 Realistic seed completed!');
  process.exit();
}

seed().catch(console.error);
