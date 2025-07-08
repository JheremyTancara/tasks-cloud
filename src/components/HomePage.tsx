import React, { useEffect, useState } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import '../styles/HomePage.css';

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
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">Jalasoft</div>
        <div className="navbar-nav">
          <a href="/home" className="nav-link">Home</a>
          <a href="#" className="nav-link">About</a>
          <a href="#" className="nav-link">Pages</a>
          <a href="#" className="nav-link">Management</a>
          <a href="/profile" className="nav-link">Profile</a>
        </div>
        <button onClick={handleLogout} className="logout-button">Sign Out</button>
      </nav>
      
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
