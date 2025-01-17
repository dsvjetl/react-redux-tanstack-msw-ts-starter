import { isMock } from '../shared/utils/isMock';

const runMockServer = async () => {
  if (!isMock) {
    return;
  }

  const { setupWorker } = await import('msw/browser');
  const { handlers } = await import('./handlers');

  const server = setupWorker(...handlers);

  return server.start({
    onUnhandledRequest: 'bypass',
  });
};

export { runMockServer };
