import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('email.host'),
      port: this.configService.get('email.port'),
      secure: this.configService.get('email.secure'),
      auth: {
        user: this.configService.get('email.auth.user'),
        pass: this.configService.get('email.auth.pass'),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.configService.get('app.frontendUrl')}/verify-email?token=${token}`;
    
    await this.transporter.sendMail({
      from: this.configService.get('email.from'),
      to: email,
      subject: 'Verifica il tuo account VCarder',
      html: `
        <h1>Benvenuto su VCarder!</h1>
        <p>Per verificare il tuo account, clicca sul link qui sotto:</p>
        <a href="${verificationUrl}">Verifica il tuo account</a>
        <p>Se non hai creato tu questo account, puoi ignorare questa email.</p>
      `,
    });
  }
} 