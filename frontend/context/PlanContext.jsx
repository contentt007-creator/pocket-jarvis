import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const PlanContext = createContext(null);

export function PlanProvider({ children }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState('free');
  const [planDetails, setPlanDetails] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data } = await api.get('/billing/status');
      setPlan(data.plan);
      setPlanDetails(data.planDetails);
      setEndDate(data.endDate);
    } catch {
      setPlan('free');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const can = (feature) => {
    if (!planDetails) return false;
    const val = planDetails.features?.[feature];
    return val && val !== 'none' && val !== false;
  };

  const withinLimit = (limitKey, current) => {
    if (!planDetails) return current < 30;
    const limit = planDetails.limits?.[limitKey];
    if (limit === Infinity || limit === undefined) return true;
    return current < limit;
  };

  const isPro     = plan === 'pro' || plan === 'premium';
  const isPremium = plan === 'premium';
  const isFree    = plan === 'free';

  return (
    <PlanContext.Provider value={{ plan, planDetails, endDate, loading, refresh, can, withinLimit, isPro, isPremium, isFree }}>
      {children}
    </PlanContext.Provider>
  );
}

export const usePlan = () => useContext(PlanContext);
