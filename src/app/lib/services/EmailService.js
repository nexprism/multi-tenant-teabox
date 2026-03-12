import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import { EmailTemplateSchema } from '../models/EmailTemplate.js';

class EmailService {
  constructor() {
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const host = process.env.SMTP_HOST || (user?.endsWith('@gmail.com') ? 'smtp.gmail.com' : 'smtp.zoho.com');
    const port = Number(process.env.SMTP_PORT) || (host === 'smtp.gmail.com' ? 587 : 465);
    const secure = process.env.SMTP_SECURE ? (process.env.SMTP_SECURE === 'true') : (port === 465);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    this.user = user;
  }

  async sendEmail({ to, subject, html, from }) {
    try {
      const mailOptions = {
        from: from || process.env.EMAIL_FROM || this.user,
        to,
        subject,
        html,
      };

      //console.log('Sending email with options:', mailOptions);

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return { success: true, message: 'Email sent successfully', data: info };
    } catch (error) {
      console.error('EmailService sendEmail Error:', error.message);
      return { success: false, message: error.message };
    }
  }

  async getEmailTemplate(name, conn) {
    try {
      const EmailTemplate = conn.models.EmailTemplate || conn.model('EmailTemplate', EmailTemplateSchema);
      const template = await EmailTemplate.findOne({ name }).exec();
      if (!template) {
        throw new Error(`Email template ${name} not found`);
      }
      return template;
    } catch (error) {
      console.error('EmailService getEmailTemplate Error:', error.message);
      throw error;
    }
  }

  async sendOrderEmail({ templateName, to, replacements, conn }) {
    try {
      const template = await this.getEmailTemplate(templateName, conn);
      let content = template.content;
      for (const [key, value] of Object.entries(replacements)) {
        content = content.replace(new RegExp(`{${key}}`, 'g'), value);
      }
      return await this.sendEmail({
        to,
        subject: template.subject,
        html: content,
        from: template.from,
      });
    } catch (error) {
      console.error('EmailService sendOrderEmail Error:', error.message);
      return { success: false, message: error.message };
    }
  }
}

export default EmailService;