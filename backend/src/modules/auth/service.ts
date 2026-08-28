import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../users/model';
import { BusinessModel } from '../businesses/model';
import { MembershipModel } from '../memberships/model';
import { ProfessionalModel } from '../professionals/model';
import { ServiceModel } from '../services/model';
import { ClientModel } from '../clients/model';
import { NotificationService } from '../../utils/notifications';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey12345!@#';

export class AuthService {
  static async login(email: string, password: string) {
    console.log(`[DEBUG] Attempting login for: ${email}`);
    const user = await UserModel.findOne({ email, active: true });
    
    if (!user) {
      console.log(`[DEBUG] User not found: ${email}`);
      throw new Error('Credenciales inválidas');
    }

    console.log(`[DEBUG] User found, comparing password for: ${email}`);
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log(`[DEBUG] Password mismatch for: ${email}`);
      throw new Error('Credenciales inválidas');
    }
    
    console.log(`[DEBUG] Login successful for: ${email}`);

    // Check memberships
    const memberships = await MembershipModel.find({ userId: user.id, active: true }).populate('businessId');
    
    // Sign JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      memberships: memberships.map(m => ({
        id: m.id,
        role: m.role,
        business: m.businessId,
      })),
    };
  }

  static async requestPublicOtp(email: string) {
    const client = await ClientModel.findOne({ email });
    if (!client) {
      throw new Error('Cliente no encontrado');
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    client.lastOtpCode = otpCode;
    client.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    await client.save();

    await NotificationService.sendOtpCode(email, client.name, otpCode);
    return client;
  }

  static async verifyPublicOtp(email: string, code: string) {
    const client = await ClientModel.findOne({ email });
    if (!client || client.lastOtpCode !== code || !client.otpExpires || client.otpExpires < new Date()) {
      throw new Error('Código inválido o expirado');
    }

    // Clear OTP
    client.lastOtpCode = undefined;
    client.otpExpires = undefined;
    await client.save();

    // Sign JWT for client
    const token = jwt.sign(
      { id: client.id, email: client.email, name: client.name, businessId: client.businessId },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return { token, client };
  }

  static async register(data: any) {
    const existingUser = await UserModel.findOne({ email: data.email });
    if (existingUser) {
      throw new Error('El correo electrónico ya está registrado');
    }

    const existingBiz = await BusinessModel.findOne({ slug: data.businessSlug });
    if (existingBiz) {
      throw new Error('La dirección web del negocio (slug) ya está en uso');
    }

    // 1. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // Start a Mongoose session / transaction (optional, simple sequential create is fine too)
    // 2. Create User
    const user = new UserModel({
      email: data.email,
      name: data.name,
      passwordHash,
    });
    await user.save();

    // Default business hours matching standard business week
    const defaultBusinessHours = {
      days: [
        { dayOfWeek: 0, isOpen: false, slots: [] }, // Sunday
        { dayOfWeek: 1, isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
        { dayOfWeek: 2, isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
        { dayOfWeek: 3, isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
        { dayOfWeek: 4, isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
        { dayOfWeek: 5, isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
        { dayOfWeek: 6, isOpen: true, slots: [{ startTime: '09:00', endTime: '13:00' }] }, // Sat half day
      ],
    };

    // 3. Create Business
    const business = new BusinessModel({
      name: data.businessName,
      slug: data.businessSlug.toLowerCase(),
      type: data.businessType,
      active: true,
      settings: {
        businessHours: defaultBusinessHours,
        timezone: 'America/Argentina/Buenos_Aires',
        calendarColor: '#7C3AED',
      },
    });
    await business.save();

    // 4. Create Membership linking Owner role
    const membership = new MembershipModel({
      userId: user.id,
      businessId: business.id,
      role: 'OWNER',
      active: true,
    });
    await membership.save();

    // 5. Seed initial professional (The owner themselves as a professional)
    const initialProfessional = new ProfessionalModel({
      businessId: business.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      active: true,
      calendarColor: '#8B5CF6', // purple color
      schedule: defaultBusinessHours,
      exceptions: [],
    });
    await initialProfessional.save();

    // 6. Seed initial service
    const initialService = new ServiceModel({
      businessId: business.id,
      name: data.businessType === 'barberia' ? 'Corte de Cabello' : 'Consulta Inicial',
      category: 'General',
      price: 2500,
      duration: 30, // 30 min
      bufferBefore: 0,
      bufferAfter: 0,
      active: true,
      professionals: [initialProfessional.id],
    });
    await initialService.save();

    // Update professional with service link
    initialProfessional.services.push(initialService.id);
    await initialProfessional.save();

    // Sign Token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      memberships: [
        {
          id: membership.id,
          role: membership.role,
          business,
        },
      ],
    };
  }
}
export default AuthService;
