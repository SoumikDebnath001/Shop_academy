"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GOOGLE_LOGIN_URL } from '../../services/api';
import { useAuth } from '../../components/AuthProvider';

export default function AuthPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Backend redirects here with ?error=... when Google login fails
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      setError('Google sign in failed. Please try again.');
    }
  }, []);

  // Already signed in, no need to stay on the login page
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleGoogleLogin = () => {
    setError('');
    setLoading(true);
    // Redirect to backend Google OAuth route
    window.location.href = GOOGLE_LOGIN_URL;
  };

  return (
    <div className="bg-surface min-h-full flex flex-col antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(23,29,24,0.04)] pt-safe">
        <div className="h-16 px-margin-mobile flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <button
              aria-label="Go back"
              className="w-11 h-11 -ml-space-2xs flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high transition-colors"
              onClick={() => router.push('/')}
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight hidden xs:inline">Obuya GrassRoots</span>
          </div>
          <div className="flex items-center gap-space-sm">
            <h1 className="font-title-md text-title-md text-on-surface truncate max-w-[140px]">
              Login
            </h1>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 bg-surface">
        <div className="flex flex-col w-full relative overflow-hidden pb-12">
          {/* Subtle Ambient Breathing Glow */}
          <div className="absolute -top-12 -right-16 w-80 h-80 rounded-full bg-primary-fixed/25 blur-3xl pointer-events-none animate-pulse"></div>
          <div className="absolute top-1/2 -left-20 w-72 h-72 rounded-full bg-secondary-container/30 blur-3xl pointer-events-none"></div>

          <div className="w-full max-w-md mx-auto px-margin-mobile mt-8">
            <div className="text-center pt-space-md pb-space-sm relative z-10">
              <h2 className="font-display-mobile text-display-mobile text-on-surface mb-space-3xs leading-tight">
                Welcome Back
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-[280px] mx-auto">
                Sign in to access your wishlist and orders.
              </p>
            </div>

            <div className="flex flex-col gap-space-sm relative z-10 bg-surface-container-lowest/60 backdrop-blur-md p-space-md rounded-2xl shadow-[0_8px_32px_-4px_rgba(23,29,24,0.08)] border border-outline-variant/30">
              {error && (
                <div className="p-3 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <button
                className="w-full h-14 bg-surface hover:bg-surface-container-low text-on-surface font-title-md text-title-md rounded-xl border border-outline-variant/50 shadow-[0_4px_12px_rgba(23,29,24,0.06)] transition-all active:scale-[0.98] flex items-center justify-center gap-space-sm disabled:opacity-50"
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                  </g>
                </svg>
                {loading ? 'Please wait...' : 'Continue with Google'}
              </button>

              <p className="font-label-sm text-label-sm text-on-surface-variant text-center">
                New here? Your account is created automatically on first sign in.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
