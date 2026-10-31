import { Navigate } from 'react-router-dom';

export function getUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

export default function ProtectedRoute({ role, children }) {
  const user = getUser();
  if (!localStorage.getItem('token') || !user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return children;
}