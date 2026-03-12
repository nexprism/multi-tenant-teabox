
import PageService from '../services/pageService.js';
import { successResponse, errorResponse } from '../../../app/utils/response.js';


export async function createPage(data, conn) {
  try {
    // Only allow fields defined in the model
    const allowedFields = [
      'mainTitle', 'title', 'slug', 'content', 'metaTitle', 'metaDescription',
      'isContactPage', 'contactData', 'status', 'showInFooter', 'createdAt', 'updatedAt', 'deletedAt', 'deleted'
    ];
    const filteredData = Object.keys(data).reduce((acc, key) => {
      if (allowedFields.includes(key)) acc[key] = data[key];
      return acc;
    }, {});
    const pageService = new PageService(conn);
    console.log('Creating page with data:', filteredData);
    const result = await pageService.createPage(filteredData);
    console.log('Page created:', result);
    return {
      status: 201,
      body: successResponse(
        result.data,
        'Page created successfully'
      ),
    };
  } catch (err) {
    return {
      status: 500,
      body: errorResponse('Server error', 500),
    };
  }
}

export async function getPageById(id, conn) {
  try {
    const pageService = new PageService(conn);
    const result = await pageService.getPageById(id);
    if (!result.data) {
      return {
        status: 404,
        body: errorResponse('Page not found', 404),
      };
    }
    return {
      status: 200,
      body: successResponse(
        result.data,
        'Page fetched successfully'
      ),
    };
  } catch (err) {
    return {
      status: 500,
      body: errorResponse('Server error', 500),
    };
  }
}


export async function updatePage(id, data, conn) {
  try {
    // Only allow fields defined in the model
    const allowedFields = [
      'mainTitle', 'title', 'slug', 'content', 'metaTitle', 'metaDescription',
      'isContactPage', 'contactData', 'status', 'showInFooter', 'createdAt', 'updatedAt', 'deletedAt', 'deleted'
    ];
    const filteredData = Object.keys(data).reduce((acc, key) => {
      if (allowedFields.includes(key)) acc[key] = data[key];
      return acc;
    }, {});
    const pageService = new PageService(conn);
    const result = await pageService.updatePage(id, filteredData);
    if (!result.data) {
      return {
        status: 404,
        body: errorResponse('Page not found', 404),
      };
    }
    return {
      status: 200,
      body: successResponse(
        result.data,
        'Page updated successfully'
      ),
    };
  } catch (err) {
    return {
      status: 500,
      body: errorResponse('Server error', 500),
    };
  }
}

export async function deletePage(id, conn) {
  try {
    const pageService = new PageService(conn);
    const result = await pageService.deletePage(id);
    if (!result.data) {
      return {
        status: 404,
        body: errorResponse('Page not found', 404),
      };
    }
    return {
      status: 200,
      body: successResponse(
        result.data,
        'Page deleted successfully'
      ),
    };
  } catch (err) {
    return {
      status: 500,
      body: errorResponse('Server error', 500),
    };
  }
}
