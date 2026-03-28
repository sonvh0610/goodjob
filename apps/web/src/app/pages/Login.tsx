import { useEffect, useState } from 'react';
import type { AuthProvidersResponse } from '@org/shared';
import { apiRequest } from '../lib/api';
import { GoodJobLogo } from '../components/ui/GoodJobLogo';
import { getUserFacingError } from '../lib/user-errors';

export function Login() {
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<
    AuthProvidersResponse['providers']
  >([]);
  const [loadingProvider, setLoadingProvider] = useState<
    'oidc' | 'google' | 'slack' | null
  >(null);

  useEffect(() => {
    void (async () => {
      const response = await apiRequest<AuthProvidersResponse>(
        '/auth/providers'
      );
      setProviders(response.providers);
    })().catch(() => {
      setProviders(['oidc', 'google', 'slack']);
    });
  }, []);

  const startOauth = async (provider: 'oidc' | 'google' | 'slack') => {
    setError(null);
    setLoadingProvider(provider);
    try {
      const data = await apiRequest<{ url: string }>(
        provider === 'oidc'
          ? '/auth/oidc/start'
          : `/auth/oauth/${provider}/start`
      );
      window.location.href = data.url;
    } catch (requestError) {
      setError(
        getUserFacingError(requestError, {
          context: 'auth-oauth',
          fallback: 'Unable to start sign-in right now. Please try again.',
        })
      );
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-low px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center">
        <section className="grid w-full gap-6 rounded-[2rem] bg-white/70 p-3 shadow-[0_20px_80px_rgba(56,42,78,0.14)] backdrop-blur-sm md:grid-cols-2">
          <div className="relative overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-primary to-primary-dim p-8 text-on-primary">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-sm" />
            <div className="absolute -bottom-14 -left-10 h-52 w-52 rounded-full bg-white/10" />
            <div className="relative z-10">
              <GoodJobLogo className="h-9" />
            </div>
            <h1 className="relative z-10 mt-5 text-4xl font-black tracking-tight">
              Sign In to GoodJob
            </h1>
            <p className="relative z-10 mt-3 max-w-sm text-sm text-primary-container">
              Keep celebrating your teammates. Continue with your work account
              to access the dashboard.
            </p>
          </div>

          <div className="rounded-[1.4rem] bg-surface-container-lowest p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Continue With
            </p>
            <div className="mt-5 space-y-3">
              {providers.includes('oidc') ? (
                <button
                  className="flex w-full items-center justify-between rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-dim hover:shadow disabled:opacity-60"
                  disabled={loadingProvider !== null}
                  onClick={() => void startOauth('oidc')}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold">
                      SSO
                    </span>
                    Continue with Work SSO
                  </span>
                  <span aria-hidden="true">→</span>
                </button>
              ) : null}
              {providers.includes('google') ? (
                <button
                  className="flex w-full items-center justify-between rounded-2xl border border-secondary-fixed/40 bg-secondary px-4 py-3 text-sm font-semibold text-on-secondary shadow-sm transition hover:-translate-y-0.5 hover:bg-secondary-fixed hover:shadow disabled:opacity-60"
                  disabled={loadingProvider !== null}
                  onClick={() => void startOauth('google')}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <img
                      alt=""
                      aria-hidden="true"
                      className="h-5 w-5"
                      src="/google-icon.svg"
                    />
                    Continue with Google
                  </span>
                  <span aria-hidden="true">→</span>
                </button>
              ) : null}
              {providers.includes('slack') ? (
                <button
                  className="flex w-full items-center justify-between rounded-2xl border border-secondary-fixed/40 bg-secondary px-4 py-3 text-sm font-semibold text-on-secondary shadow-sm transition hover:-translate-y-0.5 hover:bg-secondary-fixed hover:shadow disabled:opacity-60"
                  disabled={loadingProvider !== null}
                  onClick={() => void startOauth('slack')}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <img
                      alt=""
                      aria-hidden="true"
                      className="h-5 w-5"
                      src="/slack-icon.svg"
                    />
                    Continue with Slack
                  </span>
                  <span aria-hidden="true">→</span>
                </button>
              ) : null}
            </div>
            {loadingProvider ? (
              <p className="mt-3 text-xs text-on-surface-variant">
                Redirecting to {loadingProvider}...
              </p>
            ) : null}
            {error ? (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
