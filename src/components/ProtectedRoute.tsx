import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../services/auth';

export default function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="mx-auto max-w-md py-16 text-center" role="status">Vérification de votre session…</div>;
  }

  if (!session) {
    return <Navigate to="/connexion" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
