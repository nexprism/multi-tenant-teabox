import ReviewRepository from "../repository/reviewRepository";

export default class ReviewService {
  constructor(connection) {
    this.reviewRepository = new ReviewRepository(connection);
  }

  async createReview(data) {
    return await this.reviewRepository.create(data);
  }

  async getReviewsByProductId(productId, conn) {
    return await this.reviewRepository.findByProductId(productId, conn);
  }

  async getReviewById(id, populateOptions = null) {
    return await this.reviewRepository.findById(id, populateOptions);
  }

  async updateReview(id, data) {
    return await this.reviewRepository.update(id, data);
  }

  async deleteReview(id) {
    return await this.reviewRepository.delete(id);
  }

  async voteReview(id, userId, action) {
    return await this.reviewRepository.voteReview(id, userId, action);
  }
}