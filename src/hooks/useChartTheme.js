import { useMemo } from 'react';

export default function useChartTheme() {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return { gridColor: 'rgba(0, 255, 65, 0.1)', textColor: '#00cc33', fontFamily: 'JetBrains Mono, monospace' };
    }

    const styles = getComputedStyle(document.documentElement);
    return {
      gridColor: styles.getPropertyValue('--color-chart-grid').trim() || 'rgba(0, 255, 65, 0.1)',
      textColor: styles.getPropertyValue('--color-chart-text').trim() || '#00cc33',
      fontFamily: styles.getPropertyValue('--font-body').trim() || 'JetBrains Mono, monospace'
    };
  }, []);
}
