import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter;
    private frontendUrl: string;
    private fromEmail: string;

    constructor(private configService: ConfigService) {
        this.initializeTransporter();
        this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    }

    private async initializeTransporter() {
        const smtpConfig = {
            host: this.configService.get<string>('SMTP_HOST'),
            port: this.configService.get<number>('SMTP_PORT'),
            secure: true,
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        };

        this.transporter = nodemailer.createTransport(smtpConfig);
    }

    async sendEmail(to: string, token: string, type: 'verification' | 'reset'): Promise<void> {
        try {
            const subject = type === 'verification' 
                ? 'Verify your email address'
                : 'Reset your password';

            const verificationUrl = `${this.frontendUrl}/verify?token=${token}`;
            const resetUrl = `${this.frontendUrl}/verify?token=${token}`;
            const url = type === 'verification' ? verificationUrl : resetUrl;

            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">${subject}</h2>
                    <p>Please click the button below to ${type === 'verification' ? 'verify your email address' : 'reset your password'}.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${url}" 
                            style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                            ${type === 'verification' ? 'Verify Email' : 'Reset Password'}
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                        If you didn't request this, you can safely ignore this email.
                    </p>
                </div>
            `;

            await this.transporter.sendMail({
                from: this.configService.get<string>('SMTP_USER'),
                to,
                subject,
                html,
            });

            this.logger.log(`Email sent successfully to ${to}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}:`, error);
            throw error;
        }
    }
} 