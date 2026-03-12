import { NextResponse } from 'next/server';
import { getSubdomain, getDbConnection } from '../../../lib/tenantDb';
import ReviewService from '../../../lib/services/reviewService';
import { ReviewSchema } from '../../../lib/models/Review.js';
import { ProductModel } from '../../../lib/models/Product.js';
import userSchema from '../../../lib/models/User.js';
import { withUserAuth } from '../../../middleware/commonAuth.js';

// Helper to parse FormData in Next.js
async function parseFormData(req) {
  try {
    const formData = await req.formData();
    const fields = {};
    const files = {};

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        const match = key.match(/(\w+)\[(\d+)\]/);
        if (match) {
          const [, fieldName, index] = match;
          files[fieldName] = files[fieldName] || [];
          files[fieldName][parseInt(index)] = value;
        } else {
          files[key] = files[key] ? [...files[key], value] : [value];
        }
      } else {
        fields[key] = value;
      }
    }

    if (files.images && Array.isArray(files.images)) {
      files.images = files.images.filter(file => file instanceof File);
    }

    return { fields, files };
  } catch (error) {
    throw new Error(`Failed to parse form data: ${error.message}`);
  }
}

export async function GET(req, context) {
  try {
    const resolvedParams = await context.params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Invalid reviewId: undefined" },
        { status: 400 }
      );
    }
    
    const subdomain = getSubdomain(req);
    //consolle.log('Subdomain:', subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //consolle.error('No database connection established');
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    //consolle.log('Connection name in route:', conn.name);
    const Review = conn.models.Review || conn.model('Review', ReviewSchema);
    const User = conn.models.User || conn.model('User', userSchema);
    const Product = conn.models.Product || conn.model('Product', ProductModel.schema);
    //consolle.log('Models registered:', {
    //   Review: Review.modelName,
    //   User: User.modelName,
    //   Product: Product.modelName,
    // });
    const reviewService = new ReviewService(conn);

    const review = await reviewService.getReviewById(id, [
      { path: 'userId', select: '-passwordHash -isSuperAdmin -isDeleted' }, // Exclude sensitive fields
      { path: 'productId' }, // Include all product fields
    ]);
    if (!review) {
      return NextResponse.json({
        success: false,
        message: 'Review not found',
      }, { status: 404 });
    }

    const formattedReview = {
      ...review.toObject(),
      likes: review.likes || [],
      likeCount: review.likes ? review.likes.length : 0,
    };

    return NextResponse.json({
      success: true,
      message: 'Review fetched successfully',
      data: formattedReview,
    });
  } catch (error) {
    //consolle.error('Route GET review by id error:', error.message);
    return NextResponse.json({
      success: false,
      message: error.message,
    }, { status: 400 });
  }
}

export const PUT = withUserAuth(async function (req, context) {
  try {
    const resolvedParams = await context.params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Invalid reviewId: undefined" },
        { status: 400 }
      );
    }
    
    const subdomain = getSubdomain(req);
    //consolle.log('Subdomain:', subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //consolle.error('No database connection established');
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    //consolle.log('Connection name in route:', conn.name);
    const Review = conn.models.Review || conn.model('Review', ReviewSchema);
    const Product = conn.models.Product || conn.model('Product', ProductModel.schema);
    //consolle.log('Models registered:', { Review: Review.modelName, Product: Product.modelName });
    const reviewService = new ReviewService(conn);

    const userId = req.user._id;
    const isAdmin = req.user.isSuperAdmin || req.user.role.toString() === "6888d1dd50261784a38dd087";

    const { fields, files } = await parseFormData(req);
    const body = { ...fields };

    const existingReview = await reviewService.getReviewById(id);
    if (!existingReview) {
      return NextResponse.json({
        success: false,
        message: 'Review not found',
      }, { status: 404 });
    }

    const isOwner = existingReview.userId.toString() === userId.toString();
    if (!isOwner && !isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized: You can only update your own reviews or as an admin',
      }, { status: 403 });
    }

    // Product check removed to allow managing reviews for deleted products


    if (files.images && files.images.length > 0) {
      const newImagePaths = files.images.map((file, index) => `/uploads/review-${Date.now()}-${index}-${file.name}`);
      body.images = body.images ? [...body.images, ...newImagePaths] : newImagePaths;
      //consolle.log('Images updated:', newImagePaths);
      /*
      import fs from 'fs/promises';
      import path from 'path';
      for (const [index, file] of files.images.entries()) {
        const filePath = path.join(process.cwd(), 'public/uploads', newImagePaths[index].split('/uploads/')[1]);
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(filePath, fileBuffer);
      }
      */
    }

    const updatedReview = await reviewService.updateReview(id, body);

    return NextResponse.json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview,
    });
  } catch (error) {
    //consolle.error('Route PUT review error:', error.message);
    return NextResponse.json({
      success: false,
      message: error.message,
    }, { status: 401 });
  }
});

export const DELETE = withUserAuth(async function (req, context) {
  try {
    const resolvedParams = await context.params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Invalid reviewId: undefined" },
        { status: 400 }
      );
    }
    
    const subdomain = getSubdomain(req);
    //consolle.log('Subdomain:', subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //consolle.error('No database connection established');
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    //consolle.log('Connection name in route:', conn.name);
    const Review = conn.models.Review || conn.model('Review', ReviewSchema);
    const Product = conn.models.Product || conn.model('Product', ProductModel.schema);
    //consolle.log('Models registered:', { Review: Review.modelName, Product: Product.modelName });
    const reviewService = new ReviewService(conn);

    const userId = req.user._id;
    const isAdmin = req.user.isSuperAdmin || req.user.role.toString() === "6888d1dd50261784a38dd087";

    const existingReview = await reviewService.getReviewById(id);
    if (!existingReview) {
      return NextResponse.json({
        success: false,
        message: 'Review not found',
      }, { status: 404 });
    }

    const isOwner = existingReview.userId.toString() === userId.toString();
    if (!isOwner && !isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized: You can only delete your own reviews or as an admin',
      }, { status: 403 });
    }

    // Product check removed to allow managing reviews for deleted products


    const deleted = await reviewService.deleteReview(id);

    if (!deleted) {
      return NextResponse.json({
        success: false,
        message: 'Review not found or could not be deleted',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    //consolle.error('Route DELETE review error:', error.message);
    return NextResponse.json({
      success: false,
      message: error.message,
    }, { status: 401 });
  }
});