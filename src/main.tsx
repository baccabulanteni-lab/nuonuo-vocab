import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx';
import './index.css';

const releaseBoot = () => {
  const fn = (window as { __nuonuoReleaseBoot?: () => void }).__nuonuoReleaseBoot;
  if (typeof fn === 'function') fn();
};

const el = document.getElementById('root');
if (!el) {
  document.body.innerHTML = '<p style="padding:16px;font-family:sans-serif">找不到 #root，请检查 index.html</p>';
} else {
  createRoot(el).render(
    <StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </StrictMode>
  );
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      releaseBoot();
    });
  });
}
