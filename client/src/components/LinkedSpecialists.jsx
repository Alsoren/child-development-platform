    import { useEffect, useState } from 'react';
import { SPECIALIST_TYPES, getLinkedSpecialists, linkSpecialist } from '../api/links';

// US-M2-01 and US-M2-02: the parent links a specialist by email and type and sees the linked specialists.
export default function LinkedSpecialists({ childId }) {
  const [specialists, setSpecialists] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState(SPECIALIST_TYPES[0]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getLinkedSpecialists(childId)
      .then((data) => active && setSpecialists(data.specialists))
      .catch((err) => active && setLoadError(err.message));
    return () => { active = false; };
  }, [childId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const { link } = await linkSpecialist(childId, email, type);
      setSpecialists((list) => [...list, link]);
      setEmail('');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-4">
      {loadError && <p role="alert" className="text-sm text-red-600">{loadError}</p>}

      {!loadError && specialists.length === 0 && (
        <p className="text-sm text-slate-500">No specialists linked yet.</p>
      )}

      {specialists.length > 0 && (
        <ul className="divide-y divide-slate-200 text-sm">
          {specialists.map((s) => (
            <li key={s.specialistId} className="py-2">
              <p className="font-medium">{s.name}</p>
              <p className="text-slate-500">{s.email} · {s.type}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-slate-200 pt-3">
        <label htmlFor="specialist-email" className="text-sm font-semibold">Specialist email</label>
        <input id="specialist-email" type="email" value={email} required
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 border border-slate-300 rounded-md" />

        <label htmlFor="specialist-type" className="text-sm font-semibold">Type</label>
        <select id="specialist-type" value={type} onChange={(e) => setType(e.target.value)}
          className="p-2 border border-slate-300 rounded-md">
          {SPECIALIST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}

        <button type="submit" disabled={saving}
          className="mt-1 p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? 'Linking…' : 'Link specialist'}
        </button>
      </form>
    </div>
  );
}