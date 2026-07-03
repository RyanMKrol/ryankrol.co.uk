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
      tooltipBorder: '#e5e7eb',
      chartCoral: '#FF5C39',
      chartCoralBg: 'rgba(255, 92, 57, 0.15)',
      chartIndigo: '#4B4DED',
      chartIndigoBg: 'rgba(75, 77, 237, 0.15)',
      chartGrape: '#93328E',
      chartMarigold: '#F4A72C',
      chartMarigoldBg: 'rgba(244, 167, 44, 0.15)'
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
    tooltipBorder: get('--color-tooltip-border', '#e5e7eb'),
    chartCoral: get('--color-chart-coral', '#FF5C39'),
    chartCoralBg: get('--color-chart-coral-bg', 'rgba(255, 92, 57, 0.15)'),
    chartIndigo: get('--color-chart-indigo', '#4B4DED'),
    chartIndigoBg: get('--color-chart-indigo-bg', 'rgba(75, 77, 237, 0.15)'),
    chartGrape: get('--color-chart-grape', '#93328E'),
    chartMarigold: get('--color-chart-marigold', '#F4A72C'),
    chartMarigoldBg: get('--color-chart-marigold-bg', 'rgba(244, 167, 44, 0.15)')
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
      attributeFilter: ['class', 'data-theme', 'data-mode', 'data-font']
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}
