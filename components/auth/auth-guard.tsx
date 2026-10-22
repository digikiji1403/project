
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

const TOKEN_KEY = 'studymate_access_token';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem(TOKEN_KEY);
          router.replace('/login');
          return;
        }

        if (!cancelled) {
          setAuthorized(true);
        }
      } catch {
        // Don't remove a potentially valid token just because
        // the backend is temporarily unreachable.
        if (!cancelled) {
          router.replace('/login');
        }
      }
    }

    verifySession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Verifying your session...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
