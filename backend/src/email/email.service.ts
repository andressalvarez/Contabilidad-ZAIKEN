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

  // Premium Email Templates
  private passwordResetTemplate(nombre: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                <!-- Header with gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center">
                          <div style="width: 80px; height: 80px; background-color: rgba(255,255,255,0.2); border-radius: 50%; display: inline-block; line-height: 80px;">
                            <span style="font-size: 40px;">🔐</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-top: 20px;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                            Recuperación de Contraseña
                          </h1>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td>
                          <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 22px; font-weight: 600;">
                            Hola ${nombre} 👋
                          </h2>
                          <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                            Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Zaiken</strong>.
                          </p>
                          <p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                            Haz clic en el botón de abajo para crear una nueva contraseña segura:
                          </p>
                        </td>
                      </tr>

                      <!-- CTA Button -->
                      <tr>
                        <td align="center" style="padding: 10px 0 30px;">
                          <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                            🔑 Restablecer Contraseña
                          </a>
                        </td>
                      </tr>

                      <!-- Warning box -->
                      <tr>
                        <td>
                          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fef3c7; border-radius: 12px; border-left: 4px solid #f59e0b;">
                            <tr>
                              <td style="padding: 16px 20px;">
                                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                                  <strong>⏰ Importante:</strong> Este enlace expirará en <strong>1 hora</strong> por seguridad.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Alternative link -->
                      <tr>
                        <td style="padding-top: 25px;">
                          <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                            Si el botón no funciona, copia y pega este enlace en tu navegador:
                          </p>
                          <p style="margin: 8px 0 0; word-break: break-all;">
                            <a href="${resetUrl}" style="color: #6366f1; font-size: 12px; text-decoration: underline;">${resetUrl}</a>
                          </p>
                        </td>
                      </tr>

                      <!-- Security notice -->
                      <tr>
                        <td style="padding-top: 30px;">
                          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6; border-radius: 12px;">
                            <tr>
                              <td style="padding: 16px 20px;">
                                <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                                  🛡️ <strong>¿No solicitaste este cambio?</strong><br>
                                  Si no fuiste tú quien solicitó restablecer la contraseña, puedes ignorar este correo de forma segura. Tu contraseña actual seguirá siendo válida.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px 40px; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center">
                          <p style="margin: 0 0 8px; color: #1f2937; font-size: 16px; font-weight: 600;">
                            Sistema Zaiken
                          </p>
                          <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                            Gestión Financiera Inteligente
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-top: 20px;">
                          <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                            Este es un correo automático. Por favor no respondas a este mensaje.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private activationTemplate(nombre: string, activationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Activa tu Cuenta</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                <!-- Header with gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center">
                          <div style="width: 80px; height: 80px; background-color: rgba(255,255,255,0.2); border-radius: 50%; display: inline-block; line-height: 80px;">
                            <span style="font-size: 40px;">🎉</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-top: 20px;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                            ¡Bienvenido a Zaiken!
                          </h1>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td>
                          <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 22px; font-weight: 600;">
                            Hola ${nombre} 👋
                          </h2>
                          <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                            Tu cuenta ha sido creada exitosamente. Estás a un solo paso de comenzar a usar <strong>Zaiken</strong>.
                          </p>
                          <p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                            Haz clic en el botón de abajo para activar tu cuenta:
                          </p>
                        </td>
                      </tr>

                      <!-- CTA Button -->
                      <tr>
                        <td align="center" style="padding: 10px 0 30px;">
                          <a href="${activationUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
                            ✅ Activar mi Cuenta
                          </a>
                        </td>
                      </tr>

                      <!-- Features box -->
                      <tr>
                        <td>
                          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ecfdf5; border-radius: 12px;">
                            <tr>
                              <td style="padding: 20px;">
                                <p style="margin: 0 0 12px; color: #065f46; font-size: 14px; font-weight: 600;">
                                  Con Zaiken podrás:
                                </p>
                                <p style="margin: 0; color: #047857; font-size: 14px; line-height: 1.8;">
                                  📊 Gestionar tus finanzas<br>
                                  ⏱️ Registrar horas de trabajo<br>
                                  📈 Ver estadísticas detalladas<br>
                                  💰 Distribuir utilidades
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px 40px; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center">
                          <p style="margin: 0 0 8px; color: #1f2937; font-size: 16px; font-weight: 600;">
                            Sistema Zaiken
                          </p>
                          <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                            Gestión Financiera Inteligente
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}
