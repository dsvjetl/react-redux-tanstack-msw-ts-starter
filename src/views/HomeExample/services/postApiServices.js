import apiService from '../../../shared/services/ApiService';

const fetchPosts = () => {
  return apiService.get('/posts');
};

export { fetchPosts };
