import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(request, context) {
  try {
    const resolvedParams = await context.params;
    const pathSegments = resolvedParams.path || [];
    
    // Join path segments
    let filePath = Array.isArray(pathSegments) ? pathSegments.join("/") : pathSegments;
    
    // Normalize path: convert "Uploads" to "uploads" for case-sensitive servers (Linux)
    filePath = filePath.replace(/\/Uploads\//gi, "/uploads/");
    
    // Ensure the path starts with uploads/ (in case rewrite rule stripped it)
    if (!filePath.startsWith("uploads/") && !filePath.startsWith("/uploads/")) {
      filePath = `uploads/${filePath}`;
    }
    
    // Remove leading slash if present
    filePath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
    
    // Remove any duplicate uploads/uploads/ patterns
    filePath = filePath.replace(/\/uploads\/uploads\//gi, "/uploads/");
    
    // Construct full file path (relative to project root)
    const fullPath = join(process.cwd(), "public", filePath);
    
    // Security: Ensure the path is within public/uploads
    const normalizedPath = fullPath.replace(/\\/g, "/");
    const publicPath = join(process.cwd(), "public").replace(/\\/g, "/");
    
    if (!normalizedPath.startsWith(publicPath)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }
    
    // Check if file exists
    if (!existsSync(fullPath)) {
      console.log(`[Uploads API] File not found: ${fullPath}`);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    
    // Read file
    const fileBuffer = await readFile(fullPath);
    
    // Determine content type based on file extension
    const ext = filePath.split(".").pop()?.toLowerCase();
    const contentTypeMap = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      pdf: "application/pdf",
      mp4: "video/mp4",
      mov: "video/quicktime",
    };
    
    const contentType = contentTypeMap[ext] || "application/octet-stream";
    
    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[Uploads API] Error serving file:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

