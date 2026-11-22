import { useEffect, useState } from 'react';
import { getChildren } from '../api/links';

// The children the logged-in user may open (the parent's children, a specialist's linked children,
// or the child's own record), with the one that is selected.
export function useChildren() {
  const [children, setChildren] = useState([]);
  const [childId, setChildId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getChildren()
      .then((data) => {
        setChildren(data.children);
        if (data.children.length > 0) setChildId(data.children[0].id);
      })
      .catch((err) => setError(err.message));
  }, []);

  return { children, childId, setChildId, error };
}
