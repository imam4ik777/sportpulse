import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="sport-layout">
      <Navbar />
      <main className="sport-main">
        {children}
      </main>
      <footer className="sport-footer">
        <div className="container text-center py-3">
          <p className="text-white-50 small mb-0">© 2025 SportPulse. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 