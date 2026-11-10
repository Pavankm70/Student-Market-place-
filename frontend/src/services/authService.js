import axiosClient from '../api/axiosClient';

export const authService = {
  async register(data) {
    const response = await axiosClient.post('/auth/register', data);
    return response.data;
  },

  async login(credentials) {
    const response = await axiosClient.post('/auth/login', credentials);
    return response.data;
  },

  async loginWithGoogle(idToken) {
    const response = await axiosClient.post('/auth/google', { idToken, mode: 'login' });
    return response.data;
  },

  async registerWithGoogle(idToken) {
    const response = await axiosClient.post('/auth/google', { idToken, mode: 'register' });
    return response.data;
  },

  async getAuthConfig() {
    const response = await axiosClient.get('/auth/config');
    return response.data;
  },

  async getCurrentUser() {
    const response = await axiosClient.get('/auth/me');
    return response.data;
  },

  async updateProfile(profileData) {
    const response = await axiosClient.put('/users/profile', profileData);
    return response.data;
  },

  async checkHealth() {
    const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '');
    const response = await fetch(`${backendUrl}/api/health`);
    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`);
    }
    return response.json();
  },
};
