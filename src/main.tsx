import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js'; // Nhớ dùng đuôi .jsx theo luật nodenext của bạn
import './styles.css';

// Lấy thẻ div có id="root" từ file index.html
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}