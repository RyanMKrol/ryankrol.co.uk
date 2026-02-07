import { useState, useEffect } from 'react';

export default function useMatrixActive() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setIsActive(document.documentElement.classList.contains('matrix-active'));

    const observer = new MutationObserver(() => {
      setIsActive(document.documentElement.classList.contains('matrix-active'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return isActive;
}
