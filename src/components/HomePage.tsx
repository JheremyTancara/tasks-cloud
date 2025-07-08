import React, { useEffect, useState } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import '../styles/HomePage.css';
import '../styles/PostsPage.css';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = async () => {
    await signOut(auth);
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

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate('/');
      } else {
        setUser(currentUser);
        // Obtener datos de Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="home-page">
      <Header />
      
      {/* Main content */}
      <div className="main-content">
        <div className="welcome-section">
          <h1 className="welcome-title">
            ¡Bienvenido{userData && userData.nombre ? `, ${userData.nombre}` : ''}!
          </h1>
          <p className="welcome-description">
            Esta es la plataforma interna de Jalasoft. Explora las secciones del menú para conocer más sobre la empresa y gestiona tu perfil en la sección "Profile".
          </p>
          <div className="buttons-container">
            <a href="#" className="explore-button">Explorar</a>
            <a href="#" className="learn-more-button">Saber más</a>
          </div>
        </div>
        <div className="image-container">
          <img 
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=500&q=80" 
            alt="Decoración" 
            className="hero-image"
          />
        </div>
      </div>
    </div>
  );
}
