import { getEnvVar } from './getEnvVar';

const getApiBaseUrl = getEnvVar('VITE_API_BASE_URL');

export { getApiBaseUrl };
