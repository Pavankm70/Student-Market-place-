import axiosClient from '../api/axiosClient';

export const dashboardService = {
  async getSellerDashboard() {
    const response = await axiosClient.get('/dashboard/seller');
    return response.data;
  },

  async getSellerMetrics() {
    return this.getSellerDashboard();
  },

  async getBuyerDashboard() {
    const response = await axiosClient.get('/dashboard/buyer');
    return response.data;
  },

  async getEmailDiagnostics() {
    const response = await axiosClient.get('/dashboard/email-diagnostics');
    return response.data;
  },

  async sendTestEmail(to) {
    const response = await axiosClient.post('/dashboard/test-email', null, { params: { to } });
    return response.data;
  },

  async submitStudentVerification(verificationData) {
    const response = await axiosClient.post('/dashboard/verify-student', verificationData);
    return response.data;
  },

  async getAdminStats() {
    const response = await axiosClient.get('/admin/stats');
    return response.data;
  },

  async getAllUsers(page = 0, size = 20) {
    const response = await axiosClient.get('/admin/users', { params: { page, size } });
    return response.data;
  },

  async suspendUser(userId, suspend = true) {
    const response = await axiosClient.patch(`/admin/users/${userId}/suspend`, null, {
      params: { suspend },
    });
    return response.data;
  },

  async getPendingVerifications() {
    const response = await axiosClient.get('/admin/verifications/pending');
    return response.data;
  },

  async reviewVerification(userId, approve, note = '') {
    const response = await axiosClient.patch(`/admin/verifications/${userId}/review`, null, {
      params: { approve, note },
    });
    return response.data;
  },

  async getReportedReviews() {
    const response = await axiosClient.get('/admin/reviews/reported');
    return response.data;
  },

  async moderateReview(reviewId, hide = true) {
    const response = await axiosClient.patch(`/admin/reviews/${reviewId}/moderate`, null, {
      params: { hide },
    });
    return response.data;
  },

  async getAllTransactions(page = 0, size = 20) {
    const response = await axiosClient.get('/admin/transactions', { params: { page, size } });
    return response.data;
  },

  async downloadTransactionsCsv() {
    const response = await axiosClient.get('/admin/export/transactions/csv', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'campusloop_transactions.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
