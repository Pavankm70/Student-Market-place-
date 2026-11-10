import axiosClient from '../api/axiosClient';

export const inquiryService = {
  // Get all conversations (threads where user is buyer or seller)
  async getAllConversations() {
    const response = await axiosClient.get('/inquiries');
    return response.data;
  },

  // Get full conversation thread by inquiry ID
  async getConversation(inquiryId) {
    const response = await axiosClient.get(`/inquiries/${inquiryId}`);
    return response.data;
  },

  // Start new inquiry or append to existing thread for a listing
  async sendInquiry(listingId, inquiryData) {
    const response = await axiosClient.post(`/listings/${listingId}/inquiries`, inquiryData);
    return response.data;
  },

  // Send a direct chat reply in an existing conversation thread
  async sendReply(inquiryId, replyData) {
    const response = await axiosClient.post(`/inquiries/${inquiryId}/reply`, replyData);
    return response.data;
  },

  // Check if current user already has an active inquiry thread for a listing
  async getInquiryByListing(listingId) {
    const response = await axiosClient.get(`/inquiries/listing/${listingId}`);
    return response.data;
  },

  // Get received inquiries for seller dashboard
  async getReceivedInquiries() {
    const response = await axiosClient.get('/inquiries/received');
    return response.data;
  },

  // Get all buyer inquiries for a specific listing (owner/seller view)
  async getInquiriesForListing(listingId) {
    const response = await axiosClient.get(`/listings/${listingId}/inquiries`);
    return response.data;
  },
};

export default inquiryService;
