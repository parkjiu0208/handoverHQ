import type { PropsWithChildren } from 'react';
import { Toaster } from 'sonner';
import { AppProvider } from './AppProvider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppProvider>
      {children}
      <Toaster richColors closeButton position="top-right" />
    </AppProvider>
  );
}
