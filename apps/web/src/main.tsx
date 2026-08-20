import React from 'react';
import { createRoot } from 'react-dom/client';

const App = () => <h1>GymApp</h1>;

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
}
