import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/PostsPage.css';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = async () => {
    navigate('/');
  };
  const links = [
    { to: '/home', label: 'Home' },
    { to: '#', label: 'About' },
    { to: '/posts', label: 'Posts' },
    { to: '/management', label: 'Management' },
    { to: '/profile', label: 'Profile' },
  ];
  return (
    <nav className="navbar">
      <div className="navbar-brand">Jalasoft</div>
      <div className="navbar-nav">
        {links.map(link => (
          <a
            key={link.to}
            href={link.to}
            className={`nav-link${location.pathname.startsWith(link.to.replace('#','')) && link.to !== '#' ? ' nav-link-active' : ''}`}
          >
            {link.label}
          </a>
        ))}
      </div>
      <button onClick={handleLogout} className="logout-button">Sign Out</button>
    </nav>
  );
}

export default function AboutPage() {
  return (
    <div className="about-page">
      <Header />
      <h1 style={{textAlign:'center',marginTop:'60px',fontSize:'2.5rem',fontWeight:700}}>About Page</h1>
    </div>
  );
} 