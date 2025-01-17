import axios from 'axios';

import { getApiBaseUrl } from '../utils/getApiBaseUrl';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: getApiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add a request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // You can add an Authorization token here if needed
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        // Handle request error
        return Promise.reject(error);
      },
    );

    // Add a response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Any status code within the range of 2xx triggers this function
        return response.data; // Return data directly to simplify API responses
      },
      (error) => {
        // Handle responses outside of the 2xx range
        if (error.response) {
          console.error('API Error: ', error.response.data);
        } else {
          console.error('Network Error: ', error.message);
        }
        return Promise.reject(error);
      },
    );
  }

  // GET Request
  get(endpoint, params = {}) {
    return this.client.get(endpoint, { params });
  }

  // POST Request
  post(endpoint, data = {}) {
    return this.client.post(endpoint, data);
  }

  // PUT Request
  put(endpoint, data = {}) {
    return this.client.put(endpoint, data);
  }

  // DELETE Request
  delete(endpoint) {
    return this.client.delete(endpoint);
  }
}

const apiService = new ApiService();
export default apiService;
