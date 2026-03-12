import { NextResponse } from "next/server";
import { getSubdomain, getDbConnection } from "../../../lib/tenantDb";
import ReviewService from "../../../lib/services/reviewService";
import { ReviewSchema } from "../../../lib/models/Review.js";
import { withUserAuth } from "../../../middleware/commonAuth.js";

export const POST = withUserAuth(async function (req) {
  try {
    const subdomain = getSubdomain(req);
    //consolle.log("Subdomain:", subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //consolle.error("No database connection established");
      return NextResponse.json(
        { success: false, message: "DB not found" },
        { status: 404 }
      );
    }
    //consolle.log("Connection name in route:", conn.name);
    const Review = conn.models.Review || conn.model("Review", ReviewSchema);
    //consolle.log("Models registered:", { Review: Review.modelName });
    const reviewService = new ReviewService(conn);

    const userId = req.user._id; // Extract userId from authenticated user

    const body = await req.json(); // Parse JSON body
    const { reviewId, action } = body;

    // Validate required fields
    if (!reviewId || !action || !['like', 'dislike'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: "reviewId and action ('like' or 'dislike') are required",
        },
        { status: 400 }
      );
    }

    const updatedReview = await reviewService.voteReview(reviewId, userId, action);

    return NextResponse.json(
      {
        success: true,
        message: `Review ${action}d successfully`,
        data: updatedReview,
      },
      { status: 200 }
    );
  } catch (error) {
    //consolle.error("Route POST review vote error:", error.message);
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 400 }
    );
  }
});