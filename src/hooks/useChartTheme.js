import { useState, useEffect } from 'react';

function readTheme() {
  if (typeof window === 'undefined') {
    return {
      gridColor: 'rgba(0, 0, 0, 0.06)',
      textColor: '#6b7280',
      fontFamily: 'JetBrains Mono, monospace',
      chartPrimary: '#2563eb',
      chartPrimaryBg: 'rgba(37, 99, 235, 0.1)',
      chartSecondary: '#7c3aed',
      chartSecondaryBg: 'rgba(124, 58, 237, 0.1)',
      chartTertiary: '#059669',
      chartTertiaryBg: 'rgba(5, 150, 105, 0.1)',
      chartCardDefault: '#374151',
      tooltipBg: 'rgba(255, 255, 255, 0.95)',
      tooltipTitle: '#111827',
      tooltipBody: '#374151',
      tooltipBorder: '#e5e7eb'
    };
  }

  const s = getComputedStyle(document.documentElement);
  const get = (prop, fallback) => s.getPropertyValue(prop).trim() || fallback;

  return {
    gridColor: get('--color-chart-grid', 'rgba(0, 0, 0, 0.06)'),
    textColor: get('--color-chart-text', '#6b7280'),
    fontFamily: get('--font-body', 'JetBrains Mono, monospace'),
    chartPrimary: get('--color-chart-primary', '#2563eb'),
    chartPrimaryBg: get('--color-chart-primary-bg', 'rgba(37, 99, 235, 0.1)'),
    chartSecondary: get('--color-chart-secondary', '#7c3aed'),
    chartSecondaryBg: get('--color-chart-secondary-bg', 'rgba(124, 58, 237, 0.1)'),
    chartTertiary: get('--color-chart-tertiary', '#059669'),
    chartTertiaryBg: get('--color-chart-tertiary-bg', 'rgba(5, 150, 105, 0.1)'),
    chartCardDefault: get('--color-chart-card-default', '#374151'),
    tooltipBg: get('--color-tooltip-bg', 'rgba(255, 255, 255, 0.95)'),
    tooltipTitle: get('--color-tooltip-title', '#111827'),
    tooltipBody: get('--color-tooltip-body', '#374151'),
    tooltipBorder: get('--color-tooltip-border', '#e5e7eb')
  };
}

export default function useChartTheme() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    setTheme(readTheme());

    const observer = new MutationObserver(() => {
      setTheme(readTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}
