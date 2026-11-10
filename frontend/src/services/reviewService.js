import axiosClient from '../api/axiosClient';

export const reviewService = {
  async createReview(data) {
    const response = await axiosClient.post('/reviews', data);
    return response.data;
  },

  async getReviewsForListing(listingId) {
    const response = await axiosClient.get(`/reviews/listing/${listingId}`);
    return response.data;
  },

  async getReviewsForSeller(sellerId) {
    const response = await axiosClient.get(`/reviews/seller/${sellerId}`);
    return response.data;
  },

  async reportReview(reviewId, reasonData) {
    const response = await axiosClient.post(`/reviews/${reviewId}/report`, reasonData);
    return response.data;
  },
};
