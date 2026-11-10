import axiosClient from '../api/axiosClient';

export const bookService = {
  async lookupBook(query) {
    if (!query || !query.trim()) return [];
    const response = await axiosClient.get('/books/lookup', {
      params: { query: query.trim() },
    });
    return response.data;
  },
};
