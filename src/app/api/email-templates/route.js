import { NextResponse } from 'next/server';
import { getSubdomain, getDbConnection } from '../../lib/tenantDb';
import mongoose from 'mongoose';
import EmailTemplateController from '../../lib/controllers/EmailTemplateController.js';
import EmailTemplateService from '../../lib/services/EmailTemplateService.js';
import EmailTemplateRepository from '../../lib/repository/EmailTemplateRepository.js';
import { EmailTemplateSchema } from '../../lib/models/EmailTemplate.js';

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const query = Object.fromEntries(searchParams.entries());
  //console.log('Route received query:', query);

  try {
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    const EmailTemplate = conn.models.EmailTemplate || conn.model('EmailTemplate', EmailTemplateSchema);
    const emailTemplateRepo = new EmailTemplateRepository(EmailTemplate);
    const emailTemplateService = new EmailTemplateService(emailTemplateRepo);
    const emailTemplateController = new EmailTemplateController(emailTemplateService);
    const emailTemplates = await emailTemplateController.getAll(query, conn);
    return NextResponse.json({ success: true, emailTemplates });
  } catch (error) {
    //console.error('Route GET error:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    //console.log('Route received body:', body);
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    const EmailTemplate = conn.models.EmailTemplate || conn.model('EmailTemplate', EmailTemplateSchema);
    const emailTemplateRepo = new EmailTemplateRepository(EmailTemplate);
    const emailTemplateService = new EmailTemplateService(emailTemplateRepo);
    const emailTemplateController = new EmailTemplateController(emailTemplateService);
    const result = await emailTemplateController.create({ body }, conn);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json({ success: true, emailTemplate: result.data }, { status: 201 });
  } catch (error) {
    //console.error('Route POST error:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
