import { api } from './api';

export interface ProductReview {
  _id?: string;
  id?: string;
  product: string;
  user: {
    _id?: string;
    id?: string;
    name: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  title?: string;
  verifiedPurchase?: boolean;
  order?: string;
  createdAt: string;
  updatedAt?: string;
}

export const reviewService = {
  /**
   * Fetch approved/active reviews for a specific product.
   */
  async getProductReviews(productId: string): Promise<ProductReview[]> {
    try {
      const response = await api.get('/reviews', { params: { productId } });
      return response.data?.data?.reviews || [];
    } catch {
      return [];
    }
  },

  /**
   * Submit a new product review (or update existing one).
   */
  async submitReview(
    productId: string,
    rating: number,
    comment: string,
    title?: string,
    orderId?: string
  ): Promise<ProductReview> {
    const response = await api.post('/reviews', {
      productId,
      rating,
      comment,
      title,
      orderId,
    });
    return response.data?.data?.review;
  },

  /**
   * Update an existing product review by review ID.
   */
  async updateReview(
    reviewId: string,
    rating: number,
    comment: string,
    title?: string
  ): Promise<ProductReview> {
    const response = await api.put(`/reviews/${reviewId}`, {
      rating,
      comment,
      title,
    });
    return response.data?.data?.review;
  },

  /**
   * Delete an existing product review by review ID.
   */
  async deleteReview(reviewId: string): Promise<void> {
    await api.delete(`/reviews/${reviewId}`);
  },
};

export default reviewService;
