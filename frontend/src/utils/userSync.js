import { useState, useEffect, useCallback } from 'react';
import API_BASE_URL from '../config';

/**
 * Safely parse JSON string for stored user object
 */
export function safeParseUser(raw) {
  if (!raw || raw === 'undefined' || raw === 'null') return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      if (parsed._id && !parsed.id) parsed.id = parsed._id;
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get current user from localStorage safely
 */
export function getStoredUser() {
  return safeParseUser(localStorage.getItem('user'));
}

/**
 * Save user to localStorage and dispatch instant update event across all components & tabs
 */
export function setStoredUser(userData) {
  if (!userData) return null;
  try {
    const existing = getStoredUser() || {};
    const merged = { ...existing, ...userData };
    if (merged._id && !merged.id) merged.id = merged._id;
    localStorage.setItem('user', JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('user-updated', { detail: merged }));
    return merged;
  } catch (err) {
    console.error('Error saving stored user:', err);
    return userData;
  }
}

/**
 * Fetch authoritative user data from server (/api/user/me) and update local state immediately
 */
export async function fetchLatestUserData(tokenOverride) {
  const token = tokenOverride || localStorage.getItem('token');
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data && (data._id || data.id)) {
      if (data._id && !data.id) data.id = data._id;
      return setStoredUser(data);
    }
  } catch (err) {
    console.error('Failed to sync user data from server:', err);
  }
  return null;
}

/**
 * React hook for instant, real-time user state synchronization
 */
export function useSyncUser() {
  const [user, setUserState] = useState(getStoredUser);

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e?.detail) {
        setUserState(e.detail);
      } else {
        setUserState(getStoredUser());
      }
    };

    window.addEventListener('user-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('user-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const setUser = useCallback((updater) => {
    setUserState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (next) {
        setStoredUser(next);
      }
      return next;
    });
  }, []);

  return [user, setUser];
}
