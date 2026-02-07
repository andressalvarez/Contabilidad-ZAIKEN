import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
  from: { name: string; email: string };
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporters = new Map<number, Transporter>(); // Cache by negocioId

  constructor(private prisma: PrismaService) {}

  /**
   * Get SMTP config for a business
   */
  private async getSmtpConfig(negocioId: number): Promise<SmtpConfig | null> {
    const negocio = await this.prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { configuracion: true },
    });

    const config = negocio?.configuracion as any;
    return config?.smtp || null;
  }

  /**
   * Get or create transporter for business
   */
  private async getTransporter(negocioId: number): Promise<Transporter> {
    // Check cache
    const cached = this.transporters.get(negocioId);
    if (cached) {
      return cached;
    }

    const config = await this.getSmtpConfig(negocioId);
    if (!config) {
      throw new Error('SMTP not configured for this business');
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });

    this.transporters.set(negocioId, transporter);
    return transporter;
  }

  /**
   * Send email
   */
  async sendEmail(
    negocioId: number,
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    try {
      const transporter = await this.getTransporter(negocioId);
      const config = await this.getSmtpConfig(negocioId);

      if (!config) {
        throw new Error('SMTP configuration not found');
      }

      await transporter.sendMail({
        from: `"${config.from.name}" <${config.from.email}>`,
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    negocioId: number,
    to: string,
    nombre: string,
    token: string,
  ): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = this.passwordResetTemplate(nombre, resetUrl);
    await this.sendEmail(negocioId, to, 'Recuperación de Contraseña', html);
  }

  /**
   * Send account activation email
   */
  async sendActivationEmail(
    negocioId: number,
    to: string,
    nombre: string,
    token: string,
  ): Promise<void> {
    const activationUrl = `${process.env.FRONTEND_URL}/activate?token=${token}`;
    const html = this.activationTemplate(nombre, activationUrl);
    await this.sendEmail(negocioId, to, 'Activa tu Cuenta', html);
  }

  /**
   * Test SMTP connection
   */
  async testConnection(negocioId: number): Promise<boolean> {
    try {
      const transporter = await this.getTransporter(negocioId);
      await transporter.verify();
      return true;
    } catch (error) {
      this.logger.error(`SMTP test failed for negocio ${negocioId}:`, error);
      return false;
    }
  }

  /**
   * Clear transporter cache (call when config changes)
   */
  clearCache(negocioId: number): void {
    this.transporters.delete(negocioId);
  }

  // Templates (inline HTML)
  private passwordResetTemplate(nombre: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Hola ${nombre},</h2>
          <p>Recibimos una solicitud para restablecer tu contraseña.</p>
          <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
          <p><a href="${resetUrl}" class="button">Restablecer Contraseña</a></p>
          <p>Este enlace expirará en 1 hora.</p>
          <p>Si no solicitaste este cambio, ignora este correo.</p>
          <div class="footer">
            <p>Sistema Zaiken</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private activationTemplate(nombre: string, activationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>¡Bienvenido ${nombre}!</h2>
          <p>Tu cuenta ha sido creada exitosamente.</p>
          <p>Haz clic en el botón para activar tu cuenta:</p>
          <p><a href="${activationUrl}" class="button">Activar Cuenta</a></p>
          <p>Saludos,<br>Equipo Zaiken</p>
        </div>
      </body>
      </html>
    `;
  }
}
