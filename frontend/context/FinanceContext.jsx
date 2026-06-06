import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const FinanceContext = createContext(null);

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export function FinanceProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [budget, setBudget] = useState(null);
  const [goals, setGoals] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loadingMap, setLoadingMap] = useState({});

  const setLoading = (key, val) => setLoadingMap(prev => ({ ...prev, [key]: val }));

  const cacheGet = async (key) => {
    try { return JSON.parse(await AsyncStorage.getItem(key)); } catch { return null; }
  };
  const cacheSet = (key, val) => AsyncStorage.setItem(key, JSON.stringify(val));

  const fetchTransactions = useCallback(async (params = {}) => {
    setLoading('transactions', true);
    try {
      const cached = await cacheGet('cache_transactions');
      if (cached) setTransactions(cached);
      const { data } = await api.get('/transactions', { params: { ...params, limit: 20 } });
      setTransactions(data.transactions);
      cacheSet('cache_transactions', data.transactions);
      return data;
    } finally {
      setLoading('transactions', false);
    }
  }, []);

  const fetchSummary = useCallback(async (month = currentMonth()) => {
    setLoading('summary', true);
    try {
      const { data } = await api.get('/transactions/summary', { params: { month } });
      // Compute running balance from user context — we pass it through summary for convenience
      setSummary(data);
      cacheSet('cache_summary', data);
      return data;
    } finally {
      setLoading('summary', false);
    }
  }, []);

  const fetchBudget = useCallback(async (month = currentMonth()) => {
    setLoading('budget', true);
    try {
      const { data } = await api.get(`/budgets/${month}`);
      setBudget(data);
      return data;
    } finally {
      setLoading('budget', false);
    }
  }, []);

  const fetchGoals = useCallback(async () => {
    setLoading('goals', true);
    try {
      const { data } = await api.get('/goals');
      setGoals(data);
      cacheSet('cache_goals', data);
      return data;
    } finally {
      setLoading('goals', false);
    }
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    setLoading('subscriptions', true);
    try {
      const { data } = await api.get('/subscriptions');
      setSubscriptions(data);
      return data;
    } finally {
      setLoading('subscriptions', false);
    }
  }, []);

  const fetchDebts = useCallback(async () => {
    setLoading('debts', true);
    try {
      const { data } = await api.get('/debts');
      setDebts(data);
      return data;
    } finally {
      setLoading('debts', false);
    }
  }, []);

  return (
    <FinanceContext.Provider value={{
      transactions, summary, budget, goals, subscriptions, debts, loadingMap,
      fetchTransactions, fetchSummary, fetchBudget, fetchGoals, fetchSubscriptions, fetchDebts,
      setSummary, setBudget, setGoals, setSubscriptions, setDebts,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => useContext(FinanceContext);
