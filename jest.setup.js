// Adds custom matchers like toBeInTheDocument() for any future component tests.
import '@testing-library/jest-dom';

// jsdom doesn't implement matchMedia; components using responsive hooks
// (e.g. useResponsiveColumnCount) call it on mount. Provide an inert stub.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {}, // deprecated, but some libs still call it
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}
