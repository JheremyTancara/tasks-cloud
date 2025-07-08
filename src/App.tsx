import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthLayout from './components/AuthLayout';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<AuthLayout />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}
