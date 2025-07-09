import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import '../styles/LoginForm.css';

interface Props {
  onChangeView: (view: 'login' | 'signup' | 'forgot') => void;
}

export default function SignUpForm({ onChangeView }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [address, setAddress] = useState('');
  const [age, setAge] = useState('');

  function validatePassword(value: string) {
    const upper = /[A-Z]/.test(value);
    const number = /[0-9]/.test(value);
    const symbol = /[^a-zA-Z0-9]/.test(value);
    return value.length >= 8 && upper && number && symbol;
  }

  // Calcular edad automáticamente al cambiar la fecha de nacimiento
  useEffect(() => {
    if (birthDate) {
      const today = new Date();
      const birth = new Date(birthDate);
      let years = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        years--;
      }
      setAge(years.toString());
    } else {
      setAge('');
    }
  }, [birthDate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!validatePassword(password)) {
      setError('La contraseña debe tener mínimo 8 caracteres, al menos 1 mayúscula, 1 número y 1 símbolo.');
      return;
    }
    setLoading(true);
    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Guardar datos en Firestore si no existe
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          nombre: firstName,
          apellido: lastName,
          fecha_nacimiento: birthDate,
          edad: age,
          direccion: address,
          correo_electronico: email,
          createdAt: new Date().toISOString(),
        });
      }
      onChangeView('login'); // Redirigir al login tras registro exitoso
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code: string }).code;
        if (code === 'auth/email-already-in-use') {
          setError('El correo ya está registrado.');
        } else if (code === 'auth/invalid-email') {
          setError('El correo no es válido.');
        } else if (code === 'auth/weak-password') {
          setError('La contraseña es demasiado débil.');
        } else if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
          setError((err as { message: string }).message || 'Error desconocido');
        } else {
          setError('Error desconocido');
        }
      } else {
        setError('Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para traducir errores
  function translateError(error: string) {
    if (error.includes('Las contraseñas no coinciden')) return 'Passwords do not match';
    if (error.includes('La contraseña debe tener')) return 'Password must be at least 8 characters, with 1 uppercase, 1 number, and 1 symbol.';
    if (error.includes('El correo ya está registrado')) return 'This email is already registered.';
    if (error.includes('El correo no es válido')) return 'Invalid email address.';
    if (error.includes('La contraseña es demasiado débil')) return 'Password is too weak.';
    if (error.includes('Error desconocido')) return 'Unknown error.';
    return error;
  }

  return (
    <div className="login-container">
      <h2 className="login-title">Cloud Development</h2>
      <p className="login-subtitle">Create your account to get started</p>

      {/* Nombre completo */}
      <div style={{ width: '100%', marginBottom: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 16, color: '#111' }}>Full Name</div>
        <div className="input-container" style={{ marginBottom: 0 }}>
          <input
            type="text"
            placeholder="First Name(s)"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            className="input-field input-email"
            required
          />
          <input
            type="text"
            placeholder="Last Name(s)"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            className="input-field input-password"
            required
          />
        </div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
          Enter your first and last name as they appear on your official document.
        </div>
      </div>

      {/* Fecha de nacimiento */}
      <div style={{ width: '100%', marginBottom: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 16, color: '#111' }}>Birthdate</div>
        <div className="input-container" style={{ marginBottom: 0 }}>
          <input
            type="date"
            placeholder="Birthdate"
            value={birthDate}
            onChange={e => setBirthDate(e.target.value)}
            className="input-field input-email"
            required
            style={{ color: birthDate ? '#222' : '#888' }}
          />
        </div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
          Enter your birthdate as it appears on your ID.
        </div>
      </div>

      {/* Información de contacto */}
      <div style={{ width: '100%', marginBottom: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 16, color: '#111' }}>Contact Information</div>
        <div className="input-container" style={{ marginBottom: 0 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input-field input-email"
            required
          />
        </div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
          We'll send all notifications and receipts to your email.
        </div>
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-field input-email"
            required
            style={{ paddingRight: 40 }}
          />
          <span
            className="password-toggle-icon"
            onClick={() => setShowPassword((v) => !v)}
            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', zIndex: 2 }}
          >
            {showPassword ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M1 12C1 12 5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#4CAFE6" strokeWidth="2"/><circle cx="12" cy="12" r="3.5" stroke="#4CAFE6" strokeWidth="2"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#888" strokeWidth="2"/><path d="M4 4l16 16" stroke="#888" strokeWidth="2"/></svg>
            )}
          </span>
        </div>
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type={showConfirm ? 'text' : 'password'}
            placeholder="Confirm password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="input-field input-password"
            required
            style={{ paddingRight: 40 }}
          />
          <span
            className="password-toggle-icon"
            onClick={() => setShowConfirm((v) => !v)}
            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', zIndex: 2 }}
          >
            {showConfirm ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M1 12C1 12 5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#4CAFE6" strokeWidth="2"/><circle cx="12" cy="12" r="3.5" stroke="#4CAFE6" strokeWidth="2"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#888" strokeWidth="2"/><path d="M4 4l16 16" stroke="#888" strokeWidth="2"/></svg>
            )}
          </span>
        </div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
          The password must be at least 8 characters, with 1 uppercase, 1 number, and 1 symbol.
        </div>
      </div>

      {/* Dirección */}
      <div style={{ width: '100%', marginBottom: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 16, color: '#111' }}>Address (optional)</div>
        <div className="input-container" style={{ marginBottom: 0 }}>
          <input
            type="text"
            placeholder="Address (optional)"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="input-field input-email"
          />
        </div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
          You can add or edit your address later in your profile.
        </div>
      </div>
      {/* Edad (solo lectura) */}
      <div style={{ width: '100%', marginBottom: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 16, color: '#111' }}>Age</div>
        <div className="input-container" style={{ marginBottom: 0 }}>
          <input
            type="text"
            placeholder="Age"
            value={age}
            readOnly
            className="input-field input-email"
            style={{ background: '#f5f5f5', color: '#888' }}
          />
        </div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
          It is calculated automatically based on your birthdate.
        </div>
      </div>

      {/* Botón y link */}
      <form onSubmit={handleSignUp} className="signup-form">
        <button
          type="submit"
          disabled={loading}
          className={`login-button${loading ? ' loading' : ''}`}
          style={{ marginTop: 10, transition: 'transform 0.1s' }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
        {error && <div className="error-message" style={{ marginTop: 10 }}>{translateError(error)}</div>}
      </form>
      <div className="signup-text">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => onChangeView('login')}
          className="signup-link"
        >
          Sign In
        </button>
      </div>
      <div style={{ fontSize: 12, color: '#888', marginTop: 12, textAlign: 'left' }}>
        By selecting <b>“Sign Up”</b>, I accept the terms and conditions, as well as the <a href="#" style={{ color: '#1877f2', textDecoration: 'underline' }}>privacy policy</a>.
      </div>
    </div>
  );
}
 