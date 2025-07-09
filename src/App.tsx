import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthLayout from './components/AuthLayout';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';
import PostsPage from './components/PostsPage';
import ManagementPage from './components/ManagementPage';
import PostDetail from './components/PostDetail';
import AboutPage from './components/AboutPage';
import FollowingPage from './components/FollowingPage';
import NotificationsPage from './components/NotificationsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<AuthLayout />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/posts" element={<PostsPage />} />
        <Route path="/management" element={<ManagementPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/posts/:postId" element={<PostDetail />} />
        <Route path="/following" element={<FollowingPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
