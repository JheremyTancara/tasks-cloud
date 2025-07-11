import React, { useEffect, useState } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import '../styles/HomePage.css';
import '../styles/PostsPage.css';
import Header from './Header';

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
            Welcome{userData && userData.nombre ? `, ${userData.nombre}` : ''}!
          </h1>
          <p className="welcome-description">
            This is Jalasoft's internal platform. Explore the menu sections to learn more about the company and manage your profile in the "Profile" section.
          </p>
          <div className="buttons-container">
            <a href="#" className="explore-button">Explore</a>
            <a href="#" className="learn-more-button">Learn more</a>
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
 