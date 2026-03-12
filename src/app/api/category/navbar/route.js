import { NextResponse } from "next/server";
import { getDbConnection, getSubdomain } from "@/app/lib/tenantDb";
import { getCategories } from "@/app/lib/controllers/categoryController";
import { getSubCategories } from "@/app/lib/controllers/subCategoryController";

// GET /api/category/navbar
export async function GET(request) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }

    // Read pagination params from the request query (frontend may send page/limit)
    const url = new URL(request.url);
    const page = url.searchParams.get("page") || "1";
    const limit = url.searchParams.get("limit") || "1000";

    const query = { page, limit };

    // Fetch categories and subcategories in parallel, forwarding pagination params
    const [catResult, subResult] = await Promise.all([
      getCategories(query, conn),
      getSubCategories(query, conn),
    ]);

    // Helper to safely extract an array of items from controller/service responses
    const extractItems = (res) => {
      if (!res) return [];

      // If controller/service returned wrapper { status, body: { success, message, data } }
      if (res.status && res.body) {
        const d = res.body.data;
        if (!d) return [];
        if (Array.isArray(d)) return d;
        if (d.result && Array.isArray(d.result)) return d.result;
        // service result might itself be a wrapper { status, body: { data } }
        if (d.status && d.body && d.body.data) {
          const inner = d.body.data;
          if (Array.isArray(inner)) return inner;
          if (inner.result && Array.isArray(inner.result)) return inner.result;
        }
        return Array.isArray(d) ? d : [];
      }

      // If raw array or pagination object
      if (Array.isArray(res)) return res;
      if (res.result && Array.isArray(res.result)) return res.result;
      if (res.body && res.body.data && Array.isArray(res.body.data))
        return res.body.data;
      return [];
    };

    const categories = extractItems(catResult);
    const subcategories = extractItems(subResult);

    // Normalize Mongoose documents / wrappers into plain objects that are easy to consume.
    const normalizeDoc = (item) => {
      if (!item) return item;

      // Unwrap mongoose document
      if (item._doc) item = item._doc;

      // If the object contains nested wrappers (e.g., body.data), try to unwrap a bit more
      if (item.body && item.body.data) item = item.body.data;

      // Convert _id to id (string) for easier access
      if (item._id && !item.id) {
        try {
          item.id = String(item._id);
        } catch (e) {
          item.id = item._id;
        }
      }

      if (item.id && typeof item.id !== "string") item.id = String(item.id);

      // Remove internal mongoose props (those starting with $) and __v
      const cleaned = {};
      for (const key of Object.keys(item)) {
        if (key === "__v") continue;
        if (key.startsWith("$")) continue;
        cleaned[key] = item[key];
      }

      return cleaned;
    };

    // Map normalized copies so later code can access plain fields like `id`, `name`, etc.
    const normCategories = categories.map((c) => normalizeDoc(c));
    const normSubcategories = subcategories.map((s) => normalizeDoc(s));

    // Build map of categories and attach subcategories
    const map = new Map();
    normCategories.forEach((c) => {
      const id = String(c.id || c._id || "");
      map.set(id, { ...c, subcategories: [] });
    });

    normSubcategories.forEach((s) => {
      const parentId = String(
        s.parentCategory ||
          s.parent_category ||
          (s.parent && (s.parent.id || s.parent._id)) ||
          ""
      );
      if (!parentId) return;
      const parent = map.get(parentId);
      if (parent) parent.subcategories.push(s);
    });

    // Produce final array in original categories order (use normalized categories)
    const result = normCategories.map((c) => map.get(String(c.id || c._id)));

    return NextResponse.json(
      { success: true, message: "Navbar categories fetched", data: result },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /category/navbar error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
