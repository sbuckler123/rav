import { initSentry } from '@/lib/sentry';
import { installDomReconciliationGuard } from '@/lib/domReconciliationGuard';
initSentry(); // must run before React renders
installDomReconciliationGuard(); // survive browser-translation DOM mutations

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/accessibility.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
