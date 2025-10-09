// src/setupTests.js

// 🧩 Mock `fetch` for tests (so your app doesn’t call real backend)
import 'whatwg-fetch';

// 🧩 Mock matchMedia (used by react-hot-toast or motion)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
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

// 🧩 Optionally mock toast (to suppress console spam)
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
  Toaster: () => null,
  default: { success: jest.fn(), error: jest.fn() },
}));
