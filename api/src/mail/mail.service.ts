import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
    async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
        // In a real application, you would use a mail service like nodemailer
        // For now, we'll just log the email details
        console.log('Password reset email would be sent to:', email);
        console.log('Reset URL:', resetUrl);
    }
} 