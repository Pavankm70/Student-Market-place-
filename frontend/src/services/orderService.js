import axiosClient from '../api/axiosClient';

export const orderService = {
  async createOrder(data) {
    const payload = typeof data === 'object' && data !== null ? data : { listingId: data };
    const response = await axiosClient.post('/orders', payload);
    return response.data;
  },

  async getMyBuyerOrders() {
    const response = await axiosClient.get('/orders/buyer');
    return response.data;
  },

  async getMyOrders() {
    return this.getMyBuyerOrders();
  },

  async getMySellerSales() {
    const response = await axiosClient.get('/orders/seller');
    return response.data;
  },

  async getMySales() {
    return this.getMySellerSales();
  },

  async getOrderById(id) {
    const response = await axiosClient.get(`/orders/${id}`);
    return response.data;
  },

  async initiatePayment(id) {
    const response = await axiosClient.post(`/orders/${id}/pay`);
    return response.data;
  },

  async verifyPayment(verificationData) {
    const response = await axiosClient.post('/orders/verify-payment', verificationData);
    return response.data;
  },

  async reconcilePayment(id) {
    const response = await axiosClient.post(`/orders/${id}/reconcile`);
    return response.data;
  },

  async completeOrder(id) {
    const response = await axiosClient.patch(`/orders/${id}/complete`);
    return response.data;
  },

  async cancelOrder(id) {
    const response = await axiosClient.patch(`/orders/${id}/cancel`);
    return response.data;
  },
};
