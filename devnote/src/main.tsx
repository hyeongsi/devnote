import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { FeedbackProvider } from './features/feedback/FeedbackProvider';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FeedbackProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </FeedbackProvider>
  </React.StrictMode>,
);
