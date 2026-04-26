// frontend/src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import SpinnerMorph from '@/components/ui/spinner-morph';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = ['ADMIN'] 
}) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check multiple authentication sources
    const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
    const user = localStorage.getItem('user');
    const role = localStorage.getItem('role');
    
    // Check if user object exists and has admin role
    let hasUserObject = false;
    if (user) {
      try {
        const userObj = JSON.parse(user);
        hasUserObject = userObj.role === 'ADMIN';
      } catch (e) {
        // Invalid JSON
      }
    }
    
    const authenticated = isAdminLoggedIn || (hasUserObject && role === 'ADMIN');
    
    setIsAuthenticated(authenticated);
    setUserRole(role);
    setLoading(false);
    
    // Debug logging
    console.log('ProtectedRoute Check:', {
      isAdminLoggedIn,
      role,
      authenticated,
      path: location.pathname
    });
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <SpinnerMorph size={72} fill="#002147" rotateDur="4s" morphDur="4s" className="mx-auto" />
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to admin login with return path
  if (!isAuthenticated) {
    console.log('Redirecting to login from:', location.pathname);
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(userRole || '')) {
    console.log('Role not allowed:', userRole);
    return <Navigate to="/admin/unauthorized" replace />;
  }

  // If authenticated, render the protected page
  return <>{children}</>;
};

export default ProtectedRoute;
