import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api';

const DEFAULT = { schoolName: 'School Manager', logo: null, periods: [], weeklyOff: [] };
const Ctx = createContext({ school: DEFAULT, refresh: () => {} });
export const useSchool = () => useContext(Ctx);

export function SchoolProvider({ children }) {
  const [school, setSchool] = useState(DEFAULT);
  const refresh = useCallback(() => api.get('/settings/public').then((r) => setSchool(r.data)).catch(() => {}), []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { document.title = school.schoolName; }, [school.schoolName]);
  return <Ctx.Provider value={{ school, refresh }}>{children}</Ctx.Provider>;
}
