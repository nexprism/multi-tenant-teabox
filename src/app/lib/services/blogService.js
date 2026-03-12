import { BlogRepository } from '../repository/blogRepository';
import { saveFile } from '../../config/fileUpload';


export async function handleCreateBlog(form, conn) {
  try {
    const data = Object.fromEntries(form.entries());

    // Parse images[0][url], images[0][alt], images[1][url], ...
    const images = [];
    for (const [key, value] of form.entries()) {
      const match = key.match(/^images\[(\d+)\]\[(url|alt)\]$/);
      if (match) {
        const idx = parseInt(match[1], 10);
        const field = match[2];
        if (!images[idx]) images[idx] = {};
        images[idx][field] = value;
      }
    }
    // Handle file uploads for images
    for (let i = 0; i < images.length; i++) {
      if (images[i].url && typeof images[i].url === 'object' && images[i].url.arrayBuffer) {
        // It's a File object
        images[i].url = await saveFile(images[i].url, 'uploads');
      }
    }
    if (images.length > 0) {
      data.images = images;
    }

    // Parse thumbnail[url], thumbnail[alt]
    const thumbnail = {};
    for (const [key, value] of form.entries()) {
      const match = key.match(/^thumbnail\[(url|alt)\]$/);
      if (match) {
        thumbnail[match[1]] = value;
      }
    }
    // Handle file upload for thumbnail
    if (thumbnail.url && typeof thumbnail.url === 'object' && thumbnail.url.arrayBuffer) {
      thumbnail.url = await saveFile(thumbnail.url, 'uploads');
    }
    if (Object.keys(thumbnail).length > 0) {
      data.thumbnail = thumbnail;
    }

    // Parse tags[]
    if (form.getAll('tags[]').length > 0) {
      data.tags = form.getAll('tags[]');
    } else if (data.tags && typeof data.tags === 'string') {
      try {
        data.tags = JSON.parse(data.tags);
      } catch {}
    }

    const repo = new BlogRepository(conn);
    const blog = await repo.create(data);
    return blog;
  } catch (err) {
    throw err;
  }
}

export async function handleGetBlogs(query, conn) {
  try {
    const repo = new BlogRepository(conn);
    // Support both page/pageNum and limit/limitNum
    const pageNum = parseInt(query.page || query.pageNum || 1);
    const limitNum = parseInt(query.limit || query.limitNum || 10);
    // Remove pagination, sort, and search params from filter
    const { pageNum: _p, limitNum: _l, page: _pg, limit: _lt, sortOrder, sortBy, search, ...filterCon } = query;

    // Always filter for deletedAt: null
    const filterConditions = { deletedAt: null, ...filterCon };

    // Add search filter if present
    if (search) {
      filterConditions.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    // Map sortBy and sortOrder to sort object
    let sortCon = {};
    const sortField = sortBy || 'createdAt';
    if (sortOrder) {
      if (sortOrder === 'desc') sortCon[sortField] = -1;
      else if (sortOrder === 'asc') sortCon[sortField] = 1;
    } else {
      sortCon[sortField] = -1; // default to descending
    }

    var result = await repo.getAll(filterConditions, sortCon, pageNum, limitNum);
    //consolle.log('result', result);
  
    return result;
  } catch (err) {
    throw err;
  }
}
