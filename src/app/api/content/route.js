import { getSubdomain, getDbConnection } from '../../lib/tenantDb';
import { NextResponse } from 'next/server';
import { verifyTokenAndUser } from '../../middleware/commonAuth';
import {
  createHomepageSectionController,
  bulkCreateHomepageSectionsController,
  getHomepageSectionsController,
  getHomepageSectionByIdController,
  updateHomepageSectionController,
  deleteHomepageSectionController,
  getSectionsByTypeController,
  toggleSectionVisibilityController,
  reorderSectionsController,
  getVisibleSectionsController,
  duplicateSectionController,
  getGroupedSectionsController
} from '../../lib/controllers/contentController';

// GET: Retrieve homepage sections
export async function GET(request) {
  try {
    // Authenticate user
    // const authResult = await verifyTokenAndUser(request);
    // if (authResult.error) return authResult.error;
    
    // request.user = authResult.user;

    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);

    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const id = searchParams.get('id');
    const sectionType = searchParams.get('type');
    const action = searchParams.get('action');

    // Handle different GET operations
    if (id) {
      // Get single section by ID
      return await getHomepageSectionByIdController(id, conn);
    } else if (sectionType) {
      // Get sections by type
      return await getSectionsByTypeController(sectionType, query, conn);
    } else if (action === 'visible') {
      // Get only visible sections (for frontend)
      return await getVisibleSectionsController(conn);
    } else if (action === 'grouped') {
      // Get sections grouped by type
      return await getGroupedSectionsController(conn);
    } else {
      // Get all sections with filtering and pagination
      return await getHomepageSectionsController(query, conn);
    }

  } catch (err) {
    //consolle.error('GET /api/content error:', err.message);
    return NextResponse.json({ 
      success: false, 
      message: err.message || 'Server error' 
    }, { status: 500 });
  }
}

// POST: Create a new homepage section
export async function POST(request) {
  try {
    // Authenticate user
    const authResult = await verifyTokenAndUser(request);
    if (authResult.error) return authResult.error;
    
    request.user = authResult.user;

    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);

    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }

    // Handle both JSON and FormData
    let body;
    const contentType = request.headers.get('content-type');
    
    if (contentType && contentType.includes('multipart/form-data')) {
      // Handle FormData
      const formData = await request.formData();
      body = {};
      
      // Check if this is bulk create (sections[] format)
      const sectionsMap = new Map();
      let isBulkCreate = false;
      
      // Convert FormData to object
      for (const [key, value] of formData.entries()) {
        // Handle bulk sections format: sections[0][sectionType], sections[0][content], etc.
        const bulkMatch = key.match(/^sections\[(\d+)\]\[(.+)\]$/);
        if (bulkMatch) {
          isBulkCreate = true;
          const index = parseInt(bulkMatch[1]);
          const field = bulkMatch[2];
          
          if (!sectionsMap.has(index)) {
            sectionsMap.set(index, { content: {} });
          }
          
          const section = sectionsMap.get(index);
          
          if (field === 'content') {
            try {
              // Parse JSON content and merge with existing content
              const parsedContent = JSON.parse(value);
              section.content = { ...section.content, ...parsedContent };
            } catch (e) {
              section.content = { ...section.content, text: value };
            }
          } else if (field === 'isVisible') {
            section.isVisible = value === 'true';
          } else if (field === 'order') {
            section.order = parseInt(value);
          } else if (value instanceof File) {
            // Handle file uploads - store files in content object
            if (!section.content) section.content = {};
            section.content[field] = value;
            // You can also store file metadata
            section.content[`${field}_name`] = value.name;
            section.content[`${field}_size`] = value.size;
            section.content[`${field}_type`] = value.type;
          } else {
            section[field] = value;
          }
        } else {
          // Handle single section format
          if (key === 'content') {
            try {
              body.content = JSON.parse(value);
            } catch (e) {
              body.content = value;
            }
          } else if (key === 'isVisible') {
            body.isVisible = value === 'true';
          } else if (key === 'order') {
            body.order = parseInt(value);
          } else if (value instanceof File) {
            // Handle file uploads for single section - store in content
            if (!body.content) body.content = {};
            body.content[key] = value;
            body.content[`${key}_name`] = value.name;
            body.content[`${key}_size`] = value.size;
            body.content[`${key}_type`] = value.type;
          } else {
            body[key] = value;
          }
        }
      }
      
      // If bulk create, convert map to sections array
      if (isBulkCreate) {
        const sectionsArray = [];
        for (let i = 0; i < sectionsMap.size; i++) {
          if (sectionsMap.has(i)) {
            sectionsArray.push(sectionsMap.get(i));
          }
        }
        body = { sections: sectionsArray };
      }
    } else {
      // Handle JSON
      body = await request.json();
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Handle different POST operations
    if (action === 'reorder') {
      // Reorder sections
      return await reorderSectionsController(body, conn);
    } else if (action === 'duplicate') {
      // Duplicate a section
      const id = searchParams.get('id');
      if (!id) {
        return NextResponse.json({ 
          success: false, 
          message: 'Section ID is required for duplication' 
        }, { status: 400 });
      }
      return await duplicateSectionController(id, conn, request.user._id);
    } else if (action === 'bulk' || body.sections) {
      // Bulk create sections
      return await bulkCreateHomepageSectionsController(body, conn, request.user._id);
    } else {
      // Create single section
      return await createHomepageSectionController(body, conn, request.user._id);
    }

  } catch (err) {
    //consolle.error('POST /api/content error:', err);
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid request' 
    }, { status: 400 });
  }
}

// PUT: Update a homepage section
export async function PUT(request) {
  try {
    // Authenticate user
    const authResult = await verifyTokenAndUser(request);
    if (authResult.error) return authResult.error;
    
    request.user = authResult.user;

    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);

    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: 'Section ID is required' 
      }, { status: 400 });
    }

    // Handle both JSON and FormData
    let body;
    const contentType = request.headers.get('content-type');
    
    if (contentType && contentType.includes('multipart/form-data')) {
      // Handle FormData
      const formData = await request.formData();
      body = {};
      
      // Convert FormData to object
      for (const [key, value] of formData.entries()) {
        if (key === 'content') {
          // Parse JSON string for content field and merge with existing
          try {
            if (!body.content) body.content = {};
            const parsedContent = JSON.parse(value);
            body.content = { ...body.content, ...parsedContent };
          } catch (e) {
            if (!body.content) body.content = {};
            body.content.text = value;
          }
        } else if (key === 'isVisible') {
          body.isVisible = value === 'true';
        } else if (key === 'order') {
          body.order = parseInt(value);
        } else if (value instanceof File) {
          // Handle file uploads - store in content object
          if (!body.content) body.content = {};
          body.content[key] = value;
          body.content[`${key}_name`] = value.name;
          body.content[`${key}_size`] = value.size;
          body.content[`${key}_type`] = value.type;
        } else {
          body[key] = value;
        }
      }
    } else {
      // Handle JSON
      body = await request.json();
    }

    // Handle different PUT operations
    if (action === 'visibility') {
      // Toggle visibility
      return await toggleSectionVisibilityController(id, body, conn);
    } else {
      // Update section
      return await updateHomepageSectionController(id, body, conn, request.user._id);
    }

  } catch (err) {
    //consolle.error('PUT /api/content error:', err?.message);
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid request' 
    }, { status: 400 });
  }
}

// DELETE: Delete a homepage section
export async function DELETE(request) {
  try {
    // Authenticate user
    const authResult = await verifyTokenAndUser(request);
    if (authResult.error) return authResult.error;
    
    request.user = authResult.user;

    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);

    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: 'Section ID is required' 
      }, { status: 400 });
    }

    return await deleteHomepageSectionController(id, conn);

  } catch (err) {
    //consolle.error('DELETE /api/content error:', err);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error' 
    }, { status: 500 });
  }
}
