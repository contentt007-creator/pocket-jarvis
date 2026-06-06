import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const MethodContext = createContext(null);

export function MethodProvider({ children }) {
  const { user } = useAuth();
  const [activeMethod, setActiveMethod] = useState(null);
  const [richLifePriorities, setRichLifePriorities] = useState([]);
  const [rollingIncome, setRollingIncome] = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [mRes, rRes] = await Promise.all([
        api.get('/masters/method/active'),
        api.get('/masters/rolling-income'),
      ]);
      setActiveMethod(mRes.data.activeMethod || null);
      setRichLifePriorities(mRes.data.richLifePriorities || []);
      setRollingIncome(rRes.data.rollingAverage || null);
    } catch {
      // offline — use cached or null
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const applyMethod = async (slug, priorities) => {
    await api.put('/masters/method/active', { activeMethod: slug, richLifePriorities: priorities || [] });
    setActiveMethod(slug);
    if (priorities) setRichLifePriorities(priorities);
  };

  return (
    <MethodContext.Provider value={{ activeMethod, richLifePriorities, rollingIncome, applyMethod, reload: load }}>
      {children}
    </MethodContext.Provider>
  );
}

export const useMethod = () => useContext(MethodContext);
