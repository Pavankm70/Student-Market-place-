import axiosClient from '../api/axiosClient';

export const wishlistService = {
  // Get all saved listings for current user
  async getWishlist() {
    const response = await axiosClient.get('/wishlist');
    return response.data;
  },

  // Get list of saved listing IDs for instant heart matching
  async getWishlistIds() {
    const response = await axiosClient.get('/wishlist/ids');
    return response.data;
  },

  // Add listing to wishlist
  async addToWishlist(listingId) {
    const response = await axiosClient.post(`/wishlist/${listingId}`);
    return response.data;
  },

  // Remove listing from wishlist
  async removeFromWishlist(listingId) {
    const response = await axiosClient.delete(`/wishlist/${listingId}`);
    return response.data;
  },
};

export default wishlistService;
