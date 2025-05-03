import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import TimezoneSwitcher from '../TimezoneSwitcher/TimezoneSwitcher';
import './Navbar.css';

const Navbar: React.FC = () => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Эффект для отслеживания скролла
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/', label: 'Главная' },
    { path: '/live', label: '🔴 Live' },
    { path: '/upcoming', label: 'Предстоящие' },
    { path: '/finished', label: 'Завершенные' },
    { path: '/teams', label: 'Команды' }
  ];

  return (
    <nav className={`sport-navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <div className="logo-container">
              <span className="logo-text">Sport</span>
              <span className="logo-pulse">Pulse</span>
              <span className="pulse-dot"></span>
            </div>
          </Link>
          
          <ul className="navbar-links">
            {navLinks.map((link, index) => (
              <li key={index} className={location.pathname === link.path ? 'active' : ''}>
                <Link to={link.path}>{link.label}</Link>
              </li>
            ))}
          </ul>
          
          <TimezoneSwitcher />
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 