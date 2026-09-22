import { getEnvVar } from './getEnvVar';

const toBoolean = (value: unknown) => {
  if (typeof value === 'boolean') {
    return value;
  }

  return value === 'true';
};

const isMock = toBoolean(getEnvVar('VITE_API_MOCK'));

export { isMock };
