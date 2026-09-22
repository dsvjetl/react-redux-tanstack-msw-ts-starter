import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.scss';
import App from './App';
import { runMockServer } from './mocks/server';
import { initAppearance } from './shared/services/native/appearance';

/** Never let a stalled mock worker keep the app from rendering. */
const MOCK_START_TIMEOUT_MS = 3000;

const render = () => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  void initAppearance();
};

const mockStart = runMockServer().catch((error: unknown) => {
  console.warn('Mock service worker failed to start', error);
});
const timeout = new Promise<void>((resolve) => {
  window.setTimeout(resolve, MOCK_START_TIMEOUT_MS);
});

void Promise.race([mockStart, timeout]).finally(render);
