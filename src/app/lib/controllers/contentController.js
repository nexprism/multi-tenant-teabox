import { NextResponse } from 'next/server';
import ContentService from '../services/contentService.js';

// Create a new homepage section
export async function createHomepageSectionController(body, conn, userId) {
  try {
    const contentService = new ContentService(conn);
    const section = await contentService.createHomepageSection(body, userId);
    
    return NextResponse.json({
      success: true,
      message: 'Homepage section created successfully',
      data: section
    }, { status: 201 });
  } catch (error) {
    //consolle.error('Error in createHomepageSectionController:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to create homepage section'
    }, { status: 400 });
  }
}

// Bulk create homepage sections
export async function bulkCreateHomepageSectionsController(body, conn, userId) {
  try {
    const contentService = new ContentService(conn);
    const sections = await contentService.bulkCreateHomepageSections(body.sections, userId);
    
    return NextResponse.json({
      success: true,
      message: `${sections.length} homepage sections created successfully`,
      data: sections
    }, { status: 201 });
  } catch (error) {
    //consolle.error('Error in bulkCreateHomepageSectionsController:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to bulk create homepage sections'
    }, { status: 400 });
  }
}

// Get all homepage sections with filtering and pagination
export async function getHomepageSectionsController(query, conn) {
  try {
    const contentService = new ContentService(conn);
    
    // Parse query parameters
    const {
      page = 1,
      limit = 10,
      sortBy = 'order',
      sortOrder = 'asc',
      sectionType,
      isVisible,
      search,
      groupBy = null // New parameter to group results
    } = query;

    // Build filters
    const filters = {};
    if (sectionType) filters.sectionType = sectionType;
    if (isVisible !== undefined) filters.isVisible = isVisible === 'true';
    
    // Add search functionality
    if (search) {
      filters.$or = [
        { sectionType: { $regex: search, $options: 'i' } },
        { 'content.title': { $regex: search, $options: 'i' } },
        { 'content.description': { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    };

    const result = await contentService.getHomepageSections(filters, options);
    
    // Group by sectionType if requested
    if (groupBy === 'sectionType') {
      const groupedSections = {};
      
      // Group sections by their type
      result.sections.forEach(section => {
        const type = section.sectionType;
        if (!groupedSections[type]) {
          groupedSections[type] = [];
        }
        groupedSections[type].push(section);
      });
      
      // Sort each group by order
      Object.keys(groupedSections).forEach(type => {
        groupedSections[type].sort((a, b) => (a.order || 0) - (b.order || 0));
      });
      
      return NextResponse.json({
        success: true,
        message: 'Homepage sections retrieved and grouped successfully',
        data: groupedSections,
        pagination: result.pagination,
        grouped: true
      }, { status: 200 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Homepage sections retrieved successfully',
      data: result.sections,
      pagination: result.pagination
    }, { status: 200 });
  } catch (error) {
    //consolle.error('Error in getHomepageSectionsController:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to retrieve homepage sections'
    }, { status: 500 });
  }
}

// Get a single homepage section by ID
export async function getHomepageSectionByIdController(id, conn) {
  try {
    const contentService = new ContentService(conn);
    const section = await contentService.getHomepageSectionById(id);
    
    return NextResponse.json({
      success: true,
      message: 'Homepage section retrieved successfully',
      data: section
    }, { status: 200 });
  } catch (error) {
    //consolle.error('Error in getHomepageSectionByIdController:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to retrieve homepage section'
    }, { status: 404 });
  }
}

// Update a homepage section
export async function updateHomepageSectionController(id, body, conn, userId) {
  try {
    const contentService = new ContentService(conn);
    const section = await contentService.updateHomepageSection(id, body, userId);
    
    return NextResponse.json({
      success: true,
      message: 'Homepage section updated successfully',
      data: section
    }, { status: 200 });
  } catch (error) {
    //consolle.error('Error in updateHomepageSectionController:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to update homepage section'
    }, { status: 400 });
  }
}

// Delete a homepage section
export async function deleteHomepageSectionController(id, conn) {
  try {
    const contentService = new ContentService(conn);
    const result = await contentService.deleteHomepageSection(id);
    
    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.deletedSection
    }, { status: 200 });
  } catch (error) {
    //consolle.error('Error in deleteHomepageSectionController:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to delete homepage section'
    }, { status: 404 });
  }
}

// Get sections by type
export async function getSectionsByTypeController(sectionType, query, conn) {
  try {
    const contentService = new ContentService(conn);
    const { isVisible } = query;
    
    let visibilityFilter = null;
    if (isVisible !== undefined) {
      visibilityFilter = isVisible === 'true';
    }
    
    const sections = await contentService.getSectionsByType(sectionType, visibilityFilter);
    
    return NextResponse.json({
      success: true,
      message: `Sections of type '${sectionType}' retrieved successfully`,
      data: sections
    }, { status: 200 });
  } catch (error) {
    //consolle.error('Error in getSectionsByTypeController:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to retrieve sections by type'
    }, { status: 500 });
  }
}

// Toggle section visibility
export async function toggleSectionVisibilityController(id, body, conn) {
  try {
    const contentService = new ContentService(conn);
    const { isVisible } = body;
    
    const section = await contentService.toggleSectionVisibility(id, isVisible);
    
    return NextResponse.json({
      success: true,
      message: `Section visibility ${isVisible ? 'enabled' : 'disabled'} successfully`,
      data: section
    }, { status: 200 });
  } catch (error) {
    //consolle.error('Error in toggleSectionVisibilityController:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to update section visibility'
    }, { status: 400 });
  }
}

// Reorder sections
export async function reorderSectionsController(body, conn) {
  try {
    const contentService = new ContentService(conn);
    const { sectionsOrder } = body;
    
    const result = await contentService.reorderSections(sectionsOrder);
    
    return NextResponse.json({
      success: true,
      message: result.message
    }, { status: 200 });
  } catch (error) {
    //consolle.error('Error in reorderSectionsController:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to reorder sections'
    }, { status: 400 });
  }
}

// Get visible sections (for frontend)
export async function getVisibleSectionsController(conn) {
  try {
    const contentService = new ContentService(conn);
    const sections = await contentService.getVisibleSections();
    
    return NextResponse.json({
      success: true,
      message: 'Visible sections retrieved successfully',
      data: sections
    }, { status: 200 });
  } catch (error) {
    //consolle.error('Error in getVisibleSectionsController:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to retrieve visible sections'
    }, { status: 500 });
  }
}

// Get sections grouped by type
export async function getGroupedSectionsController(conn) {
  try {
    const contentService = new ContentService(conn);
    
    // Get all sections without pagination
    const result = await contentService.getHomepageSections({}, { 
      limit: 1000, // Get all sections
      sortBy: 'order',
      sortOrder: 'asc'
    });
    
    // Group sections by sectionType
    const groupedSections = {};
    
    result.sections.forEach(section => {
      const type = section.sectionType;
      if (!groupedSections[type]) {
        groupedSections[type] = [];
      }
      groupedSections[type].push(section);
    });
    
    // Sort each group by order and add group statistics
    const sectionTypes = Object.keys(groupedSections);
    const groupStats = {};
    
    sectionTypes.forEach(type => {
      // Sort by order
      groupedSections[type].sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Add statistics
      groupStats[type] = {
        total: groupedSections[type].length,
        visible: groupedSections[type].filter(section => section.isVisible).length,
        hidden: groupedSections[type].filter(section => !section.isVisible).length
      };
    });
    
    return NextResponse.json({
      success: true,
      message: 'Sections grouped by type retrieved successfully',
      data: groupedSections,
      stats: groupStats,
      totalSectionTypes: sectionTypes.length,
      totalSections: result.sections.length
    }, { status: 200 });
  } catch (error) {
    //consolle.error('Error in getGroupedSectionsController:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to retrieve grouped sections'
    }, { status: 500 });
  }
}

// Duplicate a section
export async function duplicateSectionController(id, conn, userId) {
  try {
    const contentService = new ContentService(conn);
    const section = await contentService.duplicateSection(id, userId);
    
    return NextResponse.json({
      success: true,
      message: 'Section duplicated successfully',
      data: section
    }, { status: 201 });
  } catch (error) {
    //consolle.error('Error in duplicateSectionController:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to duplicate section'
    }, { status: 400 });
  }
}
