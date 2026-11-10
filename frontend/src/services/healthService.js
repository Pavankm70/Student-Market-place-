/**
 * Service to check backend connectivity and health status.
 * Uses the public /api/health endpoint without requiring authentication.
 */
export const healthService = {
  async checkHealth() {
    const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '');
    const response = await fetch(`${backendUrl}/api/health`);
    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`);
    }
    return response.json();
  },
};

export default healthService;
