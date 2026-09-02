import { useState, useEffect, useCallback } from 'react';

const useDarkMode = (initialState = false) => {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem('darkMode');
      return item ? JSON.parse(item) : initialState;
    } catch (error) {
      return initialState;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('darkMode', JSON.stringify(value));
      if (value) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
      } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
      }
    } catch (error) {
      console.error(error);
    }
  }, [value]);

  const toggle = useCallback(() => setValue(v => !v), []);
  const enable = useCallback(() => setValue(true), []);
  const disable = useCallback(() => setValue(false), []);

  return { value, toggle, enable, disable };
};

export default useDarkMode;
