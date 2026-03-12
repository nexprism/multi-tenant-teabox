import { NextResponse } from "next/server";
import { saveFile, validateImageFile } from "@/app/config/fileUpload";

// POST /api/upload - accepts form-data with field `file` (or any file field)
export async function POST(request) {
  try {
    const form = await request.formData();

    // Prefer explicit `file` field, but fall back to first File in form
    let file = form.get("file");
    if (!file) {
      for (const value of form.values()) {
        if (
          value &&
          typeof value === "object" &&
          typeof value.arrayBuffer === "function"
        ) {
          file = value;
          break;
        }
      }
    }

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    try {
      validateImageFile(file);
    } catch (err) {
          console.log("error in uploading : ", err);

      return NextResponse.json(
        { success: false, message: err.message || "Invalid file" },
        { status: 400 }
      );
    }

    // Save file into public/upload and return public path like `/upload/filename.ext`
    const publicPath = await saveFile(file, "upload");

    return NextResponse.json(
      { success: true, path: publicPath, url: publicPath },
      { status: 201 }
    );
  } catch (err) {
    console.log("error in uploading : ", err);
    return NextResponse.json(
      { success: false, message: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}
