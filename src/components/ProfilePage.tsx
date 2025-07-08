import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../styles/ProfilePage.css';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate('/');
      } else {
        setUser(currentUser);
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setProfile(userSnap.data());
        }
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Calcular edad al cambiar fecha de nacimiento
  useEffect(() => {
    if (profile.fecha_nacimiento) {
      const today = new Date();
      const birth = new Date(profile.fecha_nacimiento);
      let years = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        years--;
      }
      setProfile((prev: any) => ({ ...prev, edad: years.toString() }));
    }
    // eslint-disable-next-line
  }, [profile.fecha_nacimiento]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          nombre: profile.nombre,
          apellido: profile.apellido,
          fecha_nacimiento: profile.fecha_nacimiento,
          edad: profile.edad,
          direccion: profile.direccion,
        });
      }
    } catch (err) {
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="profile-spinner" />
        <span className="loading-text">Cargando...</span>
      </div>
    </div>
  );

  return (
    <div className="profile-page">
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
      
      {/* Formulario de perfil */}
      <div className="profile-form-container">
        <h2 className="profile-title">Mi Perfil</h2>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Nombre(s)</label>
            <input 
              type="text" 
              name="nombre" 
              value={profile.nombre || ''} 
              onChange={handleChange} 
              className="input-field" 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Apellido(s)</label>
            <input 
              type="text" 
              name="apellido" 
              value={profile.apellido || ''} 
              onChange={handleChange} 
              className="input-field" 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de nacimiento</label>
            <input 
              type="date" 
              name="fecha_nacimiento" 
              value={profile.fecha_nacimiento || ''} 
              onChange={handleChange} 
              className="input-field" 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Edad</label>
            <input 
              type="text" 
              name="edad" 
              value={profile.edad || ''} 
              readOnly 
              className="input-field readonly-field" 
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Dirección <span className="optional-text">(opcional)</span>
            </label>
            <input 
              type="text" 
              name="direccion" 
              value={profile.direccion || ''} 
              onChange={handleChange} 
              className="input-field" 
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={saving} className="save-button">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button type="button" onClick={() => navigate('/home')} className="back-button">
            Volver al Home
          </button>
        </form>
      </div>
    </div>
  );
}
