import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';
import * as nodemailer from 'nodemailer';

/**
 * Type definition for supported email templates
 */
export type EmailType = 'verification' | 'password-reset';

/**
 * Service responsible for sending emails using SMTP
 * Handles email template generation and delivery
 */
@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService
  ) {}

  onModuleInit() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpConfig = {
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: true,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    };

    // Validate configuration
    if (!smtpConfig.host) {
      throw new Error('SMTP_HOST is not configured');
    }
    if (!smtpConfig.port) {
      throw new Error('SMTP_PORT is not configured');
    }
    if (!smtpConfig.auth.user) {
      throw new Error('SMTP_USER is not configured');
    }
    if (!smtpConfig.auth.pass) {
      throw new Error('SMTP_PASS is not configured');
    }

    this.logger.debug('SMTP Configuration', 'EmailService', { 
      host: smtpConfig.host,
      port: smtpConfig.port,
      user: smtpConfig.auth.user,
      hasPassword: !!smtpConfig.auth.pass
    });

    this.transporter = nodemailer.createTransport(smtpConfig);
  }

  /**
   * Sends an email using the specified template type
   * 
   * @param email - Recipient's email address
   * @param token - Token to be included in the email (for verification or password reset)
   * @param type - Type of email template to use
   * @throws Error if email sending fails
   */
  async sendEmail(email: string, token: string, type: EmailType): Promise<void> {
    try {
      const from = this.configService.get('SMTP_FROM');
      if (!from) {
        throw new Error('SMTP_FROM is not configured');
      }

      const mailOptions = {
        from,
        to: email,
        subject: this.getEmailSubject(type),
        html: this.getEmailTemplate(type, token),
      };

      this.logger.debug('Sending email', 'EmailService', { 
        to: email,
        type,
        from: mailOptions.from
      });

      await this.transporter.sendMail(mailOptions);
      this.logger.info('Email sent successfully', 'EmailService', { email, type });
    } catch (error) {
      this.logger.error('Failed to send email', 'EmailService', { 
        email, 
        type, 
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  private getEmailSubject(type: EmailType): string {
    switch (type) {
      case 'verification':
        return 'Verify Your Account';
      case 'password-reset':
        return 'Reset Your Password';
      default:
        return 'Notification';
    }
  }

  private getEmailTemplate(type: EmailType, token: string): string {
    const baseUrl = this.configService.get('FRONTEND_URL');
    
    switch (type) {
      case 'verification':
        return `
          <h1>Welcome!</h1>
          <p>To verify your account, click the following link:</p>
          <a href="${baseUrl}/verify?token=${token}">Verify Account</a>
          <p>This link will expire in 10 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
        `;
      case 'password-reset':
        return `
          <h1>Password Reset Request</h1>
          <p>You have requested to reset your password. Click the link below to proceed:</p>
          <a href="${baseUrl}/reset-password?token=${token}">Reset Password</a>
          <p>This link will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `;
      default:
        return '';
    }
  }
} 