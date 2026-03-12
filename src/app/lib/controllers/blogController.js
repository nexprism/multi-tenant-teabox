import { handleCreateBlog, handleGetBlogs } from "../services/blogService";
import { saveFile } from "../../config/fileUpload";

export async function createBlogController(form, conn) {
  try {
    const blog = await handleCreateBlog(form, conn);
    return {
      status: 201,
      body: { success: true, message: "Blog created successfully", data: blog },
    };
  } catch (err) {
    return {
      status: 400,
      body: { success: false, message: err.message || "Failed to create blog" },
    };
  }
}

export async function updateBlogController(form, conn, id) {
  try {
    const blogRepo = new (
      await import("../repository/blogRepository")
    ).BlogRepository(conn);
    // Build update payload from formData, handling File uploads for images and thumbnail
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
      if (!images[i]) continue;
      if (
        images[i].url &&
        typeof images[i].url === "object" &&
        images[i].url.arrayBuffer
      ) {
        images[i].url = await saveFile(images[i].url, "uploads");
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
    if (
      thumbnail.url &&
      typeof thumbnail.url === "object" &&
      thumbnail.url.arrayBuffer
    ) {
      thumbnail.url = await saveFile(thumbnail.url, "uploads");
    }
    if (Object.keys(thumbnail).length > 0) {
      data.thumbnail = thumbnail;
    }

    // Parse tags[]
    if (form.getAll && form.getAll("tags[]").length > 0) {
      data.tags = form.getAll("tags[]");
    } else if (data.tags && typeof data.tags === "string") {
      try {
        data.tags = JSON.parse(data.tags);
      } catch {}
    }

    // Clean empty string values (don't overwrite with empty strings)
    const cleaned = Object.entries(data).reduce((acc, [k, v]) => {
      if (v !== "") acc[k] = v;
      return acc;
    }, {});

    const updated = await blogRepo.update(id, cleaned);
    if (!updated) {
      return {
        status: 404,
        body: { success: false, message: "Blog not found" },
      };
    }
    return {
      status: 200,
      body: {
        success: true,
        message: "Blog updated successfully",
        data: updated,
      },
    };
  } catch (err) {
    return {
      status: 500,
      body: { success: false, message: err.message || "Failed to update blog" },
    };
  }
}

export async function deleteBlogController(conn, id) {
  try {
    const blogRepo = new (
      await import("../repository/blogRepository")
    ).BlogRepository(conn);
    const deleted = await blogRepo.destroy(id);
    if (!deleted) {
      return {
        status: 404,
        body: { success: false, message: "Blog not found" },
      };
    }
    return {
      status: 200,
      body: {
        success: true,
        message: "Blog deleted successfully",
        data: deleted,
      },
    };
  } catch (err) {
    return {
      status: 500,
      body: { success: false, message: err.message || "Failed to delete blog" },
    };
  }
}
export async function getBlogsController(query, conn) {
  try {
    const blogs = await handleGetBlogs(query, conn);
    return {
      status: 200,
      body: {
        success: true,
        data: blogs.result,
        currentPage: blogs.currentPage,
        totalPages: blogs.totalPages,
        totalDocuments: blogs.totalDocuments,
      },
    };
  } catch (err) {
    return {
      status: 500,
      body: { success: false, message: err.message || "Failed to fetch blogs" },
    };
  }
}
