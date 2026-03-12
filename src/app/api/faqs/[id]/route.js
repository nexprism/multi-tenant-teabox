import { NextResponse } from 'next/server';
import { getSubdomain, getDbConnection } from '../../../lib/tenantDb';
import mongoose from 'mongoose';
import FaqController from '../../../lib/controllers/FaqController.js';
import FaqService from '../../../lib/services/FaqService.js';
import FaqRepository from '../../../lib/repository/FaqRepository.js';
import { FaqSchema } from '../../../lib/models/Faq.js';

export async function GET(req, context) {
  try {
    const resolvedParams = await context.params;
    const id = resolvedParams?.id;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid FAQ ID' }, { status: 400 });
    }

    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }

    const Faq = conn.models.Faq || conn.model('Faq', FaqSchema);
    const faqRepo = new FaqRepository(Faq);
    const faqService = new FaqService(faqRepo);
    const faqController = new FaqController(faqService);
    const faq = await faqController.getById(id, conn);
    
    if (!faq) {
      return NextResponse.json({ success: false, message: 'FAQ not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, faq });
  } catch (error) {
    //console.error('Route GET by ID error:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req, context) {
  try {
    // Handle both old and new Next.js patterns
    let id;
    try {
      if (context && context.params) {
        if (context.params instanceof Promise) {
          const params = await context.params;
          id = params?.id;
        } else if (typeof context.params === 'object' && context.params !== null) {
          id = context.params.id;
        }
      }
    } catch (paramError) {
      console.warn('Error accessing context.params:', paramError);
    }
    
    // Fallback: Extract ID from URL path
    if (!id) {
      try {
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/').filter(p => p);
        for (let i = pathParts.length - 1; i >= 0; i--) {
          const part = pathParts[i];
          if (part && /^[0-9a-fA-F]{24}$/.test(part)) {
            id = part;
            break;
          }
        }
      } catch (urlError) {
        console.error('Error extracting ID from URL:', urlError);
      }
    }
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid FAQ ID' }, { status: 400 });
    }

    const body = await req.json();
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }

    const Faq = conn.models.Faq || conn.model('Faq', FaqSchema);
    const faqRepo = new FaqRepository(Faq);
    const faqService = new FaqService(faqRepo);
    const faqController = new FaqController(faqService);
    const result = await faqController.update(id, { body }, conn);
    
    if (!result || !result.success) {
      return NextResponse.json(
        { success: false, message: result?.message || 'Failed to update FAQ' },
        { status: result?.status || 400 }
      );
    }
    
    return NextResponse.json({ success: true, faq: result.data || result });
  } catch (error) {
    console.error('Route PUT error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, context) {
  try {
    // Handle both old and new Next.js patterns
    let id;
    try {
      if (context && context.params) {
        if (context.params instanceof Promise) {
          const params = await context.params;
          id = params?.id;
        } else if (typeof context.params === 'object' && context.params !== null) {
          id = context.params.id;
        }
      }
    } catch (paramError) {
      console.warn('Error accessing context.params:', paramError);
    }
    
    // Fallback: Extract ID from URL path
    if (!id) {
      try {
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/').filter(p => p);
        for (let i = pathParts.length - 1; i >= 0; i--) {
          const part = pathParts[i];
          if (part && /^[0-9a-fA-F]{24}$/.test(part)) {
            id = part;
            break;
          }
        }
      } catch (urlError) {
        console.error('Error extracting ID from URL:', urlError);
      }
    }
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid FAQ ID' }, { status: 400 });
    }

    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }

    const Faq = conn.models.Faq || conn.model('Faq', FaqSchema);
    const faqRepo = new FaqRepository(Faq);
    const faqService = new FaqService(faqRepo);
    const faqController = new FaqController(faqService);
    const result = await faqController.delete(id, conn);
    
    if (!result || !result.success) {
      return NextResponse.json(
        { success: false, message: result?.message || 'Failed to delete FAQ' },
        { status: result?.status || 400 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Route DELETE error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
