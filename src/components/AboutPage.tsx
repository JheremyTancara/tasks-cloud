import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/PostsPage.css';
import Header from './Header';

export default function AboutPage() {
  return (
    <div className="about-page">
      <Header />
      <h1 style={{textAlign:'center',marginTop:'60px',fontSize:'2.5rem',fontWeight:700}}>About Page</h1>
    </div>
  );
} 