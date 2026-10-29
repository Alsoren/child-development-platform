import { useNavigate } from 'react-router-dom';
import { getUser } from './ProtectedRoute';

export default function AppLayout({ title, children }) {
  const navigate = useNavigate();
  const user = getUser();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
        <h1 className="text-lg font-semibold">{title}</h1>
        <div className="flex items-center gap-4 text-sm">
          <span>{user?.name} <span className="text-slate-500">({user?.role})</span></span>
          <button onClick={logout} className="rounded-md bg-slate-200 px-3 py-1.5 hover:bg-slate-300">
            Log out
          </button>
        </div>
      </header>
      <main className="mx-auto grid max-w-5xl gap-4 p-6 md:grid-cols-2">{children}</main>
    </div>
  );
}

export function Section({ title }) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">Coming soon.</p>
    </section>
  );
}