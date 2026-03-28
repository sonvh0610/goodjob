import { fireEvent, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from './app';
import { AuthProvider, useAuth } from './context/AuthContext';

type MockResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

type RequestLike = {
  toString: () => string;
};

type FetchOptionsLike = {
  method?: string;
  cache?: string;
  headers?: Record<string, string>;
};

const authenticatedUser = {
  id: 'user-1',
  email: 'alex@goodjob.app',
  displayName: 'Alex',
};

function renderAppAt(path: string) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AuthProbe() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <p>loading</p>;
  }

  return (
    <div>
      <p data-testid="auth-state">{user ? 'authenticated' : 'guest'}</p>
      <button onClick={() => void logout()} type="button">
        logout
      </button>
    </div>
  );
}

describe('auth features', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('redirects unauthenticated users from protected route to login', async () => {
    const fetchMock = vi.fn(
      async (): Promise<MockResponse> => ({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const { findByText, queryByText } = renderAppAt('/');
    expect(await findByText(/sign in to goodjob/i)).toBeTruthy();
    expect(queryByText(/hello, alex!/i)).toBeNull();
  });

  it('redirects authenticated users away from login to dashboard', async () => {
    const fetchMock = vi.fn(
      async (): Promise<MockResponse> => ({
        ok: true,
        status: 200,
        json: async () => ({ user: authenticatedUser }),
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const { findByText } = renderAppAt('/login');
    expect(await findByText(/hello, alex!/i)).toBeTruthy();
  });

  it('shows social-only login UI', async () => {
    const fetchMock = vi.fn(async (input: RequestLike) => {
      const url = input.toString();
      if (url.endsWith('/auth/providers')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ providers: ['oidc', 'google', 'slack'] }),
        };
      }
      return {
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const { findByText, queryByText } = renderAppAt('/login');
    expect(await findByText(/work sso/i)).toBeTruthy();
    expect(await findByText(/google/i)).toBeTruthy();
    expect(queryByText(/forgot password/i)).toBeNull();
    expect(queryByText(/create account/i)).toBeNull();
  });

  it('clears local auth state on logout even when API logout fails', async () => {
    const fetchMock = vi.fn(async (input: RequestLike) => {
      const url = input.toString();

      if (url.endsWith('/auth/me')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ user: authenticatedUser }),
        };
      }

      if (url.endsWith('/auth/logout')) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ error: 'Unauthorized' }),
        };
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const { getByText, findByTestId } = render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      </QueryClientProvider>
    );

    const authState = await findByTestId('auth-state');
    expect((authState as { textContent?: string }).textContent ?? '').toContain(
      'authenticated'
    );
    fireEvent.click(getByText('logout'));
    await waitFor(() => {
      expect(getByText('guest')).toBeTruthy();
    });
  });

  it('requests /auth/me with no-store cache policy', async () => {
    const fetchMock = vi.fn(
      async (): Promise<MockResponse> => ({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const firstCall = fetchMock.mock.calls[0] as unknown[] | undefined;
    const options = (firstCall?.[1] ?? {}) as FetchOptionsLike;
    expect(options.cache).toBe('no-store');
  });

  it('does not send json content-type header for body-less logout request', async () => {
    const fetchMock = vi.fn(async (input: RequestLike) => {
      const url = input.toString();

      if (url.endsWith('/auth/me')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ user: authenticatedUser }),
        };
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const { getByText, findByTestId } = render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      </QueryClientProvider>
    );

    await findByTestId('auth-state');
    fireEvent.click(getByText('logout'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/auth\/logout$/),
        expect.objectContaining({ method: 'POST' })
      );
    });

    const logoutCall = fetchMock.mock.calls.find((call) =>
      String(call[0]).endsWith('/auth/logout')
    );
    expect(logoutCall).toBeTruthy();
    const logoutOptions = (logoutCall as unknown[] | undefined)?.[1] as
      | FetchOptionsLike
      | undefined;
    const headers = logoutOptions?.headers;
    expect(headers?.['content-type']).toBeUndefined();
  });
});
