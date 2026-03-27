import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

import App from './app';
import { AuthProvider } from './context/AuthContext';

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const renderApp = () =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

  it('should render successfully', () => {
    const { baseElement } = renderApp();
    expect(baseElement).toBeTruthy();
  });

  it('should show login page when unauthenticated', async () => {
    const { findByText } = renderApp();
    expect(await findByText(/sign in to goodjob/i)).toBeTruthy();
  });
});
