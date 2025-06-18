'use client';

import { useAuth } from '@/contexts/auth-context';
import { PokerSessionProvider } from '@/contexts/poker-session-context';
import { useRouter } from 'next/navigation';
import type { ReactNode} from 'react';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PokerLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Skeleton className="h-3/4 w-3/4 rounded-lg" />
      </div>
    );
  }

  return (
    <PokerSessionProvider>
      <div className="flex h-screen flex-col bg-background text-foreground">
        <header className="border-b border-border p-4 shadow-sm">
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-headline font-semibold text-primary">ScrumPoint</h1>
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Logged in as <strong className="text-foreground">{user.username}</strong> ({user.role.toLowerCase()})
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-primary hover:underline"
                  aria-label="Logout"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="flex-grow overflow-auto">
          {children}
        </main>
      </div>
    </PokerSessionProvider>
  );
}
