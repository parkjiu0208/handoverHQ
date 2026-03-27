import { Suspense } from 'react';
import { RouterProvider } from 'react-router';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { router } from './routes';

export default function App() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
