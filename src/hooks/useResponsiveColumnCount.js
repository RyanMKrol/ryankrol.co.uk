import { useState, useEffect } from 'react';

export default function useResponsiveColumnCount(desktopColumns, breakpointPx) {
  const [columnCount, setColumnCount] = useState(desktopColumns);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpointPx}px)`);

    const update = () => {
      setColumnCount(mediaQuery.matches ? 1 : desktopColumns);
    };

    update();
    mediaQuery.addEventListener('change', update);

    return () => mediaQuery.removeEventListener('change', update);
  }, [desktopColumns, breakpointPx]);

  return columnCount;
}
