import axiosClient from '../api/axiosClient';

export const listingService = {
  async getListings(params = {}) {
    const cleanParams = {};
    if (params.search) cleanParams.search = params.search;
    if (params.category && params.category !== 'ALL') cleanParams.category = params.category;
    if (params.sort) cleanParams.sort = params.sort;
    if (params.status) cleanParams.status = params.status;
    if (params.conditionType) cleanParams.conditionType = params.conditionType;
    if (params.minPrice != null && params.minPrice !== '') cleanParams.minPrice = params.minPrice;
    if (params.maxPrice != null && params.maxPrice !== '') cleanParams.maxPrice = params.maxPrice;
    if (params.buyerLat != null) cleanParams.buyerLat = params.buyerLat;
    if (params.buyerLng != null) cleanParams.buyerLng = params.buyerLng;
    if (params.radiusKm != null && params.radiusKm !== '') cleanParams.radiusKm = params.radiusKm;

    const response = await axiosClient.get('/listings', { params: cleanParams });
    return response.data;
  },

  async getFeaturedListings() {
    const response = await axiosClient.get('/listings/featured');
    return response.data;
  },

  async getMyListings() {
    const response = await axiosClient.get('/listings/my');
    return response.data;
  },

  async getListingById(id, { buyerLat, buyerLng } = {}) {
    const params = {};
    if (buyerLat != null && buyerLng != null) {
      params.buyerLat = buyerLat;
      params.buyerLng = buyerLng;
    }
    const response = await axiosClient.get(`/listings/${id}`, { params });
    return response.data;
  },

  async createListing(listingData) {
    const response = await axiosClient.post('/listings', listingData);
    return response.data;
  },

  async updateListing(id, listingData) {
    const response = await axiosClient.put(`/listings/${id}`, listingData);
    return response.data;
  },

  async deleteListing(id) {
    const response = await axiosClient.delete(`/listings/${id}`);
    return response.data;
  },

  async archiveListing(id) {
    const response = await axiosClient.patch(`/listings/${id}/archive`);
    return response.data;
  },

  async markAsSold(id) {
    const response = await axiosClient.patch(`/listings/${id}/sold`);
    return response.data;
  },

  async markAsReserved(id) {
    const response = await axiosClient.patch(`/listings/${id}/reserved`);
    return response.data;
  },

  async markAsAvailable(id) {
    const response = await axiosClient.patch(`/listings/${id}/available`);
    return response.data;
  },

  async uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return response.data.url;
  },

  async sendInquiry(listingId, inquiryData) {
    const response = await axiosClient.post(`/listings/${listingId}/inquiries`, inquiryData);
    return response.data;
  },
};
