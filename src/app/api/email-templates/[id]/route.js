import { NextResponse } from 'next/server';
import { getSubdomain, getDbConnection } from '../../../lib/tenantDb';
import mongoose from 'mongoose';
import EmailTemplateController from '../../../lib/controllers/EmailTemplateController.js';
import EmailTemplateService from '../../../lib/services/EmailTemplateService.js';
import EmailTemplateRepository from '../../../lib/repository/EmailTemplateRepository.js';
import { EmailTemplateSchema } from '../../../lib/models/EmailTemplate.js';

export async function GET(req, context) {
  try {
    // Await params in Next.js App Router (required in newer versions)
    const params = await context.params;
    const id = params.id;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid email template ID' }, { status: 400 });
    }

    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }

    const EmailTemplate = conn.models.EmailTemplate || conn.model('EmailTemplate', EmailTemplateSchema);
    const emailTemplateRepo = new EmailTemplateRepository(EmailTemplate);
    const emailTemplateService = new EmailTemplateService(emailTemplateRepo);
    const emailTemplateController = new EmailTemplateController(emailTemplateService);
    const emailTemplate = await emailTemplateController.getById(id, conn);
    
    if (!emailTemplate) {
      return NextResponse.json({ success: false, message: 'Email template not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, emailTemplate });
  } catch (error) {
    console.error('Route GET by ID error:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req, context) {
  try {
    // Await params in Next.js App Router (required in newer versions)
    const params = await context.params;
    const id = params.id;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid email template ID' }, { status: 400 });
    }

    const body = await req.json();
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }

    const EmailTemplate = conn.models.EmailTemplate || conn.model('EmailTemplate', EmailTemplateSchema);
    const emailTemplateRepo = new EmailTemplateRepository(EmailTemplate);
    const emailTemplateService = new EmailTemplateService(emailTemplateRepo);
    const emailTemplateController = new EmailTemplateController(emailTemplateService);
    const result = await emailTemplateController.update(id, { body }, conn);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    
    return NextResponse.json({ success: true, emailTemplate: result.data });
  } catch (error) {
    console.error('Route PUT error:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    // Await params in Next.js App Router (required in newer versions)
    const params = await context.params;
    const id = params.id;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid email template ID' }, { status: 400 });
    }

    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }

    const EmailTemplate = conn.models.EmailTemplate || conn.model('EmailTemplate', EmailTemplateSchema);
    const emailTemplateRepo = new EmailTemplateRepository(EmailTemplate);
    const emailTemplateService = new EmailTemplateService(emailTemplateRepo);
    const emailTemplateController = new EmailTemplateController(emailTemplateService);
    const result = await emailTemplateController.delete(id, conn);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    
    return NextResponse.json({ success: true, message: 'Email template deleted successfully' });
  } catch (error) {
    console.error('Route DELETE error:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
