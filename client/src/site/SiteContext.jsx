import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const Ctx = createContext({ site: null, error: false });
export const useSite = () => useContext(Ctx);

export function SiteProvider({ children }) {
  const [site, setSite] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => { api.get('/public/site').then((r) => setSite(r.data)).catch(() => setError(true)); }, []);
  useEffect(() => { if (site) document.title = site.schoolName; }, [site]);
  return <Ctx.Provider value={{ site, error }}>{children}</Ctx.Provider>;
}
