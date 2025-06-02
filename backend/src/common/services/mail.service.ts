import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

type EmailType = 'verification' | 'password-reset';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;
    private frontendUrl: string;
    private fromEmail: string;

    constructor(private configService: ConfigService) {
        const smtpUser = this.configService.get<string>('SMTP_USER');
        if (!smtpUser) {
            throw new Error('SMTP_USER is not defined in environment variables');
        }
        this.fromEmail = smtpUser;

        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST'),
            port: this.configService.get<number>('SMTP_PORT'),
            secure: true,
            auth: {
                user: smtpUser,
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        });
        this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    }

    async sendEmail(email: string, token: string, type: EmailType): Promise<void> {
        const fullUrl = `${this.frontendUrl}/verify?token=${token}`;
        
        let mailOptions: nodemailer.SendMailOptions;
        
        switch (type) {
            case 'verification':
                mailOptions = {
                    from: {
                        name: 'VCarder',
                        address: this.fromEmail
                    },
                    to: {
                        name: email.split('@')[0],
                        address: email
                    },
                    subject: 'Verifica il tuo account',
                    text: `Benvenuto su VCarder!\n\nPer verificare il tuo account, clicca sul link seguente:\n${fullUrl}\n\nSe non hai richiesto questa verifica, ignora questa email.`,
                    html: `
                        <!DOCTYPE html>
                        <html>
                            <head>
                                <meta charset="utf-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <title>Verifica il tuo account</title>
                            </head>

                            <body
                                style="font-family: Arial, sans-serif;color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                                <h1 style="color: #2c3e50;">Benvenuto su VCarder!</h1>
                                <p>Per verificare il tuo account, clicca sul link seguente:</p>
                                <p style="margin: 20px 0;">
                                    <a href="${fullUrl}"
                                        style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verifica
                                        Account</a>
                                </p>
                                <hr>
                                <p style="color: #7f8c8d; font-size: 0.9em;">Se non hai richiesto questa verifica, ignora questa email.</p>
                            </body>
                        </html>
                    `,
                };
                break;
            
            case 'password-reset':
                mailOptions = {
                    from: {
                        name: 'VCarder',
                        address: this.fromEmail
                    },
                    to: {
                        name: email.split('@')[0],
                        address: email
                    },
                    subject: 'Reset Password',
                    text: `Reset Password\n\nPer resettare la tua password, clicca sul link seguente:\n${fullUrl}\n\nSe non hai richiesto il reset della password, ignora questa email.`,
                    html: `
                        <!DOCTYPE html>
                        <html>
                            <head>
                                <meta charset="utf-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <title>Reset Password</title>
                            </head>
                            <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                                <h1 style="color: #2c3e50;">Reset Password</h1>
                                <p>Per resettare la tua password, clicca sul link seguente:</p>
                                <p style="margin: 20px 0;">
                                    <a href="${fullUrl}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                                </p>
                                <hr>
                                <p style="color: #7f8c8d; font-size: 0.9em;">Se non hai richiesto il reset della password, ignora questa email.</p>
                            </body>
                        </html>
                    `,
                };
                break;
        }

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error(`Error sending ${type} email:`, error);
            throw new Error(`Failed to send ${type} email`);
        }
    }
} 