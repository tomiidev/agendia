import { Resend } from 'resend';

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export class NotificationService {
  private static get resend() {
    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is not defined in environment variables');
    }
    return new Resend(process.env.RESEND_API_KEY || '');
  }

  static async sendEmail(message: EmailMessage): Promise<boolean> {
    try {
      await this.resend.emails.send({
        from: 'onboarding@resend.dev', // Replace with your verified domain
        to: message.to,
        subject: message.subject,
        text: message.body,
      });
      return true;
    } catch (error) {
      console.error('Error dispatching email notification with Resend:', error);
      return false;
    }
  }

  static async sendOtpCode(email: string, clientName: string, otpCode: string): Promise<boolean> {
    const subject = `Tu código de acceso a MiTurnoUy`;
    const body = `Hola ${clientName},
    
Tu código para acceder a tus reservas es: ${otpCode}

Este código expira en 5 minutos. Si no solicitaste este código, puedes ignorar este mensaje.`;
    
    return this.sendEmail({ to: email, subject, body });
  }

  static async sendAppointmentConfirmation(appointment: any, client: any, professional: any, service: any, business: any) {
    const subject = `Confirmación de Reserva - ${business.name}`;
    const body = `Hola ${client.name},
    
Tu reserva en ${business.name} ha sido registrada con éxito:

- Servicio: ${service.name}
- Profesional: ${professional.name}
- Fecha: ${appointment.date}
- Hora: ${appointment.startTime}

Si necesitas reprogramar o cancelar, por favor ponte en contacto con nosotros.

¡Te esperamos!`;

    return this.sendEmail({ to: client.email || 'customer@example.com', subject, body });
  }

  static async sendAppointmentCancellation(appointment: any, client: any, service: any, business: any) {
    const subject = `Cancelación de Reserva - ${business.name}`;
    const body = `Hola ${client.name},
    
Te informamos que tu reserva para el servicio ${service.name} el día ${appointment.date} a las ${appointment.startTime} ha sido cancelada.

Esperamos volver a verte pronto.`;

    return this.sendEmail({ to: client.email || 'customer@example.com', subject, body });
  }
}

export default NotificationService;
