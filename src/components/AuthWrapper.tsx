import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { expireDemoModeIfNeeded, isDemoModeActive } from "@/utils/demoMode";

const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    expireDemoModeIfNeeded();
    const userProfile = localStorage.getItem('userProfile');
    let parsedProfile: { demoMode?: boolean } | null = null;
    try {
      parsedProfile = userProfile ? (JSON.parse(userProfile) as { demoMode?: boolean }) : null;
    } catch {
      parsedProfile = null;
    }

    if (parsedProfile?.demoMode && !isDemoModeActive()) {
      localStorage.removeItem("userProfile");
      if (location.pathname.startsWith('/app')) {
        navigate('/', { replace: true });
      }
      return;
    }

    if (userProfile) {
      // User is logged in
      if (location.pathname === '/') {
        navigate('/app', { replace: true });
      }
    } else {
      // User is not logged in
      if (location.pathname.startsWith('/app')) {
        navigate('/', { replace: true });
      }
    }
  }, [navigate, location.pathname]);

  return <>{children}</>;
};

export default AuthWrapper;
