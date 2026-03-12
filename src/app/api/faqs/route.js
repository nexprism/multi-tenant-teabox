import { NextResponse } from 'next/server';
import { getSubdomain, getDbConnection } from '../../lib/tenantDb';
import mongoose from 'mongoose';
import FaqController from '../../lib/controllers/FaqController.js';
import FaqService from '../../lib/services/FaqService.js';
import FaqRepository from '../../lib/repository/FaqRepository.js';
import { FaqSchema } from '../../lib/models/Faq.js';

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
    const Faq = conn.models.Faq || conn.model('Faq', FaqSchema);
    const faqRepo = new FaqRepository(Faq);
    const faqService = new FaqService(faqRepo);
    const faqController = new FaqController(faqService);
    const faqs = await faqController.getAll(query, conn);
    return NextResponse.json({ success: true, faqs });
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
    const Faq = conn.models.Faq || conn.model('Faq', FaqSchema);
    const faqRepo = new FaqRepository(Faq);
    const faqService = new FaqService(faqRepo);
    const faqController = new FaqController(faqService);
    const result = await faqController.create({ body }, conn);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json({ success: true, body: result }, { status: 201 });
  } catch (error) {
    //console.error('Route POST error:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
