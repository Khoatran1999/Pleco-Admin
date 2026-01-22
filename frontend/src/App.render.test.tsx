import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './store';
// Use Vitest globals (`describe`, `it`, `expect`) provided by `vitest.config.ts`

// jsdom (Vitest) does not provide ResizeObserver which some components (recharts)
// rely on. Provide a minimal mock so components can mount in tests.
if (typeof (globalThis as any).ResizeObserver === 'undefined') {
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

describe('App render', () => {
  it('renders header when authenticated', async () => {
    // create a fake JWT with exp in the future
    const payload = { exp: Math.floor(Date.now() / 1000) + 60 * 60 };
    const middle = Buffer.from(JSON.stringify(payload)).toString('base64');
    const fakeToken = `h.${middle}.s`;
    localStorage.setItem('access_token', fakeToken);

    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );

    // ProtectedRoute renders null while validating token; wait for header
    await waitFor(() => expect(screen.getByText('Alex Morgan')).toBeInTheDocument());
  });
});
