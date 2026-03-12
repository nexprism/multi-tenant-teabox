import mongoose from "mongoose";
import { ReviewSchema } from "../models/Review.js";
import UserSchema from "../models/User.js";

export default class ReviewRepository {
  constructor(connection) {
    this.connection = connection || mongoose;
    this.Review =
      this.connection.models.Review ||
      this.connection.model("Review", ReviewSchema);
    //consolle.log(
    //   "ReviewRepository initialized with connection:",
    //   this.connection
    //     ? this.connection.name || "global mongoose"
    //     : "no connection"
    // );
  }

  async create(data) {
    try {
      //consolle.log("Creating review with data:", JSON.stringify(data, null, 2));
      return await this.Review.create(data);
    } catch (error) {
      //consolle.error("ReviewRepository Create Error:", error.message);
      throw error;
    }
  }

  async findById(id, populateOptions = null) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid reviewId: ${id}`);
      }
      let query = this.Review.findById(id);
      if (populateOptions) {
        query = query.populate(populateOptions);
      }
      const review = await query.exec();
      if (!review) {
        throw new Error(`Review ${id} not found`);
      }
      return review;
    } catch (error) {
      //consolle.error("ReviewRepository findById Error:", error.message);
      throw error;
    }
  }

  async findByProductId(productId, conn) {
    try {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error(`Invalid productId: ${productId}`);
      }

      let populatedFaq;

      // Ensure the `User` model is registered on the same connection
      // that this repository's `Review` model is using so populate() works.
      const hasProductModel =
        this.connection.models.User || this.connection.model("User", UserSchema);
      //consolle.log("hasProductModel:", hasProductModel);
      if (hasProductModel) {
        //consolle.log("if -->");
        populatedFaq = await this.Review.find({ productId, isActive: true }).populate("userId");
      } else {
        //consolle.log("else -->");
        populatedFaq = await this.Review.find({ productId, isActive: true });
      }

      //consolle.log(
      //   "ReviewRepository findByProductId - populatedFaq:",
      //   populatedFaq
      // );

      // Make sure User model exists on the Review model's connection
      this.connection.models.User || this.connection.model("User", UserSchema);

      const data = await this.Review.find({ productId, isActive: true })
        .populate("userId")
        .sort({ createdAt: -1 })
        .exec();

      // ensure we only aggregate reviews for the requested productId
      const objectProductId = new mongoose.Types.ObjectId(productId);

      const result = await this.Review.aggregate([
        { $match: { productId: objectProductId, isActive: true } },
        {
          $group: {
            _id: "$rating",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            rating: "$_id",
            count: 1,
            _id: 0,
          },
        },
        {
          $facet: {
            ratings: [
              {
                $group: {
                  _id: null,
                  ratings: { $push: "$$ROOT" },
                  total: { $sum: "$count" },
                },
              },
            ],
          },
        },
        {
          $unwind: { path: "$ratings", preserveNullAndEmptyArrays: true },
        },
        {
          $addFields: {
            ratingBreakdown: {
              $map: {
                input: [5, 4, 3, 2, 1],
                as: "star",
                in: {
                  rating: "$$star",
                  count: {
                    $let: {
                      vars: {
                        matched: {
                          $first: {
                            $filter: {
                              input: { $ifNull: ["$ratings.ratings", []] },
                              as: "item",
                              cond: { $eq: ["$$item.rating", "$$star"] },
                            },
                          },
                        },
                      },
                      in: {
                        $ifNull: ["$$matched.count", 0],
                      },
                    },
                  },
                  percentage: {
                    $let: {
                      vars: {
                        matched: {
                          $first: {
                            $filter: {
                              input: { $ifNull: ["$ratings.ratings", []] },
                              as: "item",
                              cond: { $eq: ["$$item.rating", "$$star"] },
                            },
                          },
                        },
                      },
                      in: {
                        $cond: {
                          if: { $gt: [{ $ifNull: ["$ratings.total", 0] }, 0] },
                          then: {
                            $round: [
                              {
                                $multiply: [
                                  {
                                    $divide: [
                                      { $ifNull: ["$$matched.count", 0] },
                                      { $ifNull: ["$ratings.total", 0] },
                                    ],
                                  },
                                  100,
                                ],
                              },
                              1,
                            ],
                          },
                          else: 0,
                        },
                      },
                    },
                  },
                },
              },
            },
            totalReviews: { $ifNull: ["$ratings.total", 0] },
          },
        },
        {
          $project: {
            _id: 0,
            totalReviews: 1,
            ratingBreakdown: 1,
          },
        },
      ]);

      const avgResult = await this.Review.aggregate([
        { $match: { productId: objectProductId, isActive: true } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
          },
        },
      ]);

      // Ensure we return a consistent ratingBreakdown even when no reviews exist
      let ratingBreakdown = [];
      if (result && result[0] && Array.isArray(result[0].ratingBreakdown)) {
        ratingBreakdown = result[0].ratingBreakdown;
      } else {
        ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
          rating: star,
          count: 0,
          percentage: 0,
        }));
      }

      const response = {
        ratingBreakdown,
        Average: avgResult[0]?.avgRating || 0,
        Reviews: data.map((review) => ({
          ...review.toObject(),
          likes: review.likes || [],
          likeCount: review.likes ? review.likes.length : 0,
        })),
      };
      //consolle.log("ReviewRepository findByProductId Response:", response);
      return response;
    } catch (error) {
      //consolle.error("ReviewRepository findByProductId Error:", error.message);
      throw error;
    }
  }

  async update(id, data) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid reviewId: ${id}`);
      }
      const review = await this.Review.findByIdAndUpdate(id, data, {
        new: true,
      });
      if (!review) {
        throw new Error(`Review ${id} not found`);
      }
      return review;
    } catch (error) {
      //consolle.error("ReviewRepository update Error:", error.message);
      throw error;
    }
  }

  async delete(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid reviewId: ${id}`);
      }
      const review = await this.Review.findByIdAndDelete(id);
      if (!review) {
        throw new Error(`Review ${id} not found`);
      }
      return true;
    } catch (error) {
      //consolle.error("ReviewRepository delete Error:", error.message);
      throw error;
    }
  }

  async voteReview(id, userId, action) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid reviewId: ${id}`);
      }
      const review = await this.Review.findById(id);
      if (!review) {
        throw new Error(`Review ${id} not found`);
      }

      if (!review.likes) {
        review.likes = [];
      }

      const userObjectId = new mongoose.Types.ObjectId(userId);

      if (action === "like") {
        if (!review.likes.some((u) => u.equals(userObjectId))) {
          review.likes.push(userObjectId);
        }
      } else if (action === "dislike") {
        review.likes = review.likes.filter((u) => !u.equals(userObjectId));
      } else {
        throw new Error(`Invalid action: ${action}`);
      }

      await review.save();
      return {
        ...review.toObject(),
        likes: review.likes || [],
        likeCount: review.likes.length,
      };
    } catch (error) {
      //consolle.error("ReviewRepository voteReview Error:", error.message);
      throw error;
    }
  }
}
