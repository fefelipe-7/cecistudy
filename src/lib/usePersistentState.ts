import React, { useState, useEffect } from 'react';

export const usePersistentState = <T,>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem('cecistudy_' + key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cecistudy_' + key, JSON.stringify(state));
    } catch (e) {
      console.error('Storage error', e);
    }
  }, [key, state]);

  return [state, setState];
};
