'use client';

import { useEffect, useState } from 'react';
import { api, BACKEND_ORIGIN } from '@/services/api';

type Status =
  | { state: 'checking' }
  | { state: 'connected'; detail: string }
  | { state: 'failed'; detail: string };

/**
 * Placeholder home page. It exists only to prove the app is wired to the backend -
 * replace it with the real admin dashboard.
 */
export default function Home() {
  const [status, setStatus] = useState<Status>({ state: 'checking' });

  useEffect(() => {
    // /me answers without a session too, so it is a safe connectivity probe.
    api
      .me()
      .then(() => setStatus({ state: 'connected', detail: 'signed in' }))
      .catch((error: Error) =>
        setStatus(
          /failed|NetworkError|fetch/i.test(error.message)
            ? { state: 'failed', detail: error.message }
            : { state: 'connected', detail: `reachable (${error.message})` },
        ),
      );
  }, []);

  return (
    <main className="min-h-screen p-10 font-mono text-sm">
      <h1 className="text-lg font-semibold">adminvendorfrontend</h1>
      <p className="mt-1 opacity-70">Admin / vendor panel. No UI yet.</p>
      <dl className="mt-6 space-y-1">
        <div>
          <dt className="inline opacity-70">backend: </dt>
          <dd className="inline">{BACKEND_ORIGIN}</dd>
        </div>
        <div>
          <dt className="inline opacity-70">status: </dt>
          <dd className="inline">
            {status.state === 'checking' ? 'checking…' : `${status.state} — ${status.detail}`}
          </dd>
        </div>
      </dl>
    </main>
  );
}
