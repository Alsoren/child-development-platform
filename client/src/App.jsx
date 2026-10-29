import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ParentPage from './pages/ParentPage';
import SpecialistPage from './pages/SpecialistPage';
import ChildPage from './pages/ChildPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/parent" element={<ProtectedRoute role="parent"><ParentPage /></ProtectedRoute>} />
        <Route path="/specialist" element={<ProtectedRoute role="specialist"><SpecialistPage /></ProtectedRoute>} />
        <Route path="/child" element={<ProtectedRoute role="child"><ChildPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}