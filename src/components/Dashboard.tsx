import { useEffect, useState } from 'react';
import { auth } from '../firebaseConfig';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import type { User } from 'firebase/auth';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate('/login');
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <h2>Dashboard</h2>
      {user && <p>Bienvenido, {user.email}</p>}
      <button onClick={handleLogout}>Cerrar sesión</button>
    </div>
  );
} 