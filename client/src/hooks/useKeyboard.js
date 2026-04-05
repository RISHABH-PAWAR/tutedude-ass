import { useEffect, useRef } from 'react';

export const useKeyboard = () => {
  const keysRef = useRef(new Set());

  useEffect(() => {
    const onKeyDown = (e) => {
      keysRef.current.add(e.key.toLowerCase());
    };
    const onKeyUp = (e) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return keysRef;
};
