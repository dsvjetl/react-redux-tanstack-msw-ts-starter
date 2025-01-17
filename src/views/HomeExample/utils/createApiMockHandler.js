import { HttpResponse, delay, http } from 'msw';

import { postsMock } from '../mocks/postsMock';
import { getApiBaseUrl } from '../../../shared/utils/getApiBaseUrl';

const createApiMockHandler = () => {
  return [
    http.get(`${getApiBaseUrl}/posts`, async () => {
      await delay();
      return HttpResponse.json(postsMock);
    }),
  ];
};

export { createApiMockHandler };
