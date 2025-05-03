import { Navigate } from 'react-router-dom';
import { AuthService } from '../services/auth';

export default function PrivateRoute({ children }) {
    const isAuthenticated = AuthService.isAuthenticated();

    if (!isAuthenticated) {
        // Rediriger vers la page de connexion si non authentifié
        return <Navigate to="/login" replace />;
    }

    return children;
}