import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import '../styles/PostsPage.css';
import { FaBell } from 'react-icons/fa';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifCount, setNotifCount] = useState(0);
  const [userId, setUserId] = useState<string|null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) setUserId(user.uid);
      else setUserId(null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const notifRef = collection(db, 'users', userId, 'notifications');
    const unsub = onSnapshot(notifRef, snap => {
      const unread = snap.docs.filter(doc => doc.data().read === false).length;
      setNotifCount(unread);
    });
    return () => unsub();
  }, [userId]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };
  const links = [
    { to: '/home', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/posts', label: 'Posts' },
    { to: '/management', label: 'Management' },
    { to: '/profile', label: 'Profile' },
    { to: '/following', label: 'Following' },
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
      <div style={{display:'flex',alignItems:'center',gap:'18px'}}>
        <div style={{position:'relative',cursor:'pointer'}} onClick={()=>navigate('/notifications')} title="Notifications">
          <FaBell style={{fontSize:'1.5em',color:'#1976d2'}} />
          {notifCount > 0 && (
            <span style={{position:'absolute',top:'-7px',right:'-7px',background:'#e74c3c',color:'#fff',borderRadius:'50%',fontSize:'0.85em',padding:'2px 7px',fontWeight:600}}>{notifCount}</span>
          )}
        </div>
        <button onClick={handleLogout} className="logout-button">Sign Out</button>
      </div>
    </nav>
  );
} 