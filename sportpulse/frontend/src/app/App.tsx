import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Router from './router';
import '@/shared/ui/styles/global.css';

const App = () => {
  return (
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  );
};

export default App;