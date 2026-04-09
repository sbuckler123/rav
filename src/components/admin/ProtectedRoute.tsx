import { useUser } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const location = useLocation();

  // Wait for Clerk to finish loading session
  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
