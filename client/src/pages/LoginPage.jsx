import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await login(email, password);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-100 p-4">
      <form onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-8 rounded-xl shadow-md flex flex-col gap-2">
        <h1 className="text-2xl font-semibold mb-3">Sign in</h1>

        <label htmlFor="email" className="text-sm font-semibold">Email</label>
        <input id="email" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)} required
          className="p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />

        <label htmlFor="password" className="text-sm font-semibold mt-1">Password</label>
        <input id="password" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)} required
          className="p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />

        {error && <p role="alert" className="text-sm text-red-600 mt-1">{error}</p>}

        <button type="submit" disabled={loading}
          className="mt-3 p-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="text-sm text-center mt-2">
          No account? <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        </p>
      </form>
    </div>
  );
}