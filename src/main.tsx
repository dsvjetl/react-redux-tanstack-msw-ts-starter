import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.scss';
import App from './App.js';
import { runMockServer } from './mocks/server';

runMockServer().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
