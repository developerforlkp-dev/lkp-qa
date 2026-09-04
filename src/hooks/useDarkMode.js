import { useState, useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';

const DARK_MODE_EVENT = 'lkp:darkmode-change';

const useDarkMode = (initialState = false) => {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem('darkMode');
      return item ? JSON.parse(item) : initialState;
    } catch (error) {
      return initialState;
    }
  });

  // Track whether the current change originated from this instance
  const isLocalChange = useRef(false);

  // Apply body classes and persist to localStorage
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

    // Broadcast to other useDarkMode instances only if this was a local change
    if (isLocalChange.current) {
      isLocalChange.current = false;
      window.dispatchEvent(new CustomEvent(DARK_MODE_EVENT, { detail: { value } }));
    }
  }, [value]);

  // Listen for changes from other useDarkMode instances
  useEffect(() => {
    const handleDarkModeChange = (e) => {
      const newValue = e.detail?.value;
      if (typeof newValue === 'boolean') {
        setValue(newValue);
      }
    };

    // Also listen for localStorage changes from other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'darkMode' && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          if (typeof newValue === 'boolean') {
            setValue(newValue);
          }
        } catch (_) {}
      }
    };

    window.addEventListener(DARK_MODE_EVENT, handleDarkModeChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(DARK_MODE_EVENT, handleDarkModeChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const toggle = useCallback((toggleElement) => {
    const isDark = value;
    const nextValue = !isDark;

    const performToggle = () => {
      isLocalChange.current = true;
      setValue(nextValue);
    };

    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      performToggle();
      return;
    }

    if (!toggleElement || !toggleElement.getBoundingClientRect) {
      performToggle();
      return;
    }

    const rect = toggleElement.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // The user explicitly wants Light -> Dark to shrink (revert), and Dark -> Light to expand.
    // 'value' is true if currently dark.
    // So if 'value' is false (currently light), we want the reversed (shrinking) animation.
    const isReversed = !value;

    const distances = [
      Math.hypot(x, y),
      Math.hypot(window.innerWidth - x, y),
      Math.hypot(x, window.innerHeight - y),
      Math.hypot(window.innerWidth - x, window.innerHeight - y)
    ];
    // Add 15% padding so the corners never slow down visibly as it settles
    const endRadius = Math.max(...distances) * 1.15;

    const xPercent = (x / window.innerWidth) * 100;
    const yPercent = (y / window.innerHeight) * 100;

    let styleEl = document.getElementById('theme-transition-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'theme-transition-styles';
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      ::view-transition-group(root) {
        animation: none;
      }
      ::view-transition-new(root), ::view-transition-old(root) {
        mix-blend-mode: normal;
      }
      ${isReversed ? `
        ::view-transition-old(root) {
          z-index: 9999;
          animation: theme-shrink 800ms cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
        }
        ::view-transition-new(root) {
          z-index: 1;
          animation: none;
        }
        @keyframes theme-shrink {
          0% { clip-path: circle(${endRadius}px at ${xPercent}% ${yPercent}%); }
          100% { clip-path: circle(0px at ${xPercent}% ${yPercent}%); }
        }
      ` : `
        ::view-transition-old(root) {
          z-index: 1;
          animation: none;
        }
        ::view-transition-new(root) {
          z-index: 9999;
          animation: theme-expand 800ms cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
        }
        @keyframes theme-expand {
          0% { clip-path: circle(0px at ${xPercent}% ${yPercent}%); }
          100% { clip-path: circle(${endRadius}px at ${xPercent}% ${yPercent}%); }
        }
      `}
    `;

    const transition = document.startViewTransition(() => {
      document.documentElement.classList.add('theme-transitioning');
      flushSync(() => {
        performToggle();
      });
    });

    transition.finished.finally(() => {
      document.documentElement.classList.remove('theme-transitioning');
      if (styleEl) styleEl.textContent = '';
    });
  }, [value]);

  const enable = useCallback(() => {
    isLocalChange.current = true;
    setValue(true);
  }, []);

  const disable = useCallback(() => {
    isLocalChange.current = true;
    setValue(false);
  }, []);

  return { value, toggle, enable, disable };
};

export default useDarkMode;
