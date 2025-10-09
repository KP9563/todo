// jest.setup.js

// Mock browser APIs that Jest doesn’t provide
import "whatwg-fetch"; // polyfill fetch()

// Mock matchMedia for react-hot-toast and framer-motion
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
