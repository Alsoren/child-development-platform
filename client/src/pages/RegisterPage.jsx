import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';

const ROLES = [
  { value: 'parent', label: 'Parent' },
  { value: 'specialist', label: 'Specialist' },
  { value: 'child', label: 'Child' },
];

const inputClass =
  'p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelClass = 'text-sm font-semibold mt-1';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'parent' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/login');
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
        <h1 className="text-2xl font-semibold mb-3">Create account</h1>

        <label htmlFor="name" className={labelClass}>Full name</label>
        <input id="name" value={form.name} onChange={update('name')} required className={inputClass} />

        <label htmlFor="email" className={labelClass}>Email</label>
        <input id="email" type="email" value={form.email} onChange={update('email')} required className={inputClass} />

        <label htmlFor="password" className={labelClass}>Password</label>
        <input id="password" type="password" value={form.password} onChange={update('password')} required className={inputClass} />

        <label htmlFor="role" className={labelClass}>Role</label>
        <select id="role" value={form.role} onChange={update('role')} className={`${inputClass} bg-white`}>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>

        {error && <p role="alert" className="text-sm text-red-600 mt-1">{error}</p>}

        <button type="submit" disabled={loading}
          className="mt-3 p-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
          {loading ? 'Creating…' : 'Register'}
        </button>

        <p className="text-sm text-center mt-2">
          Have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}