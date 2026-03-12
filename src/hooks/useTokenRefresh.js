import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { refreshToken } from '@/app/store/slices/authSlice';

// Client-side token validation function
const isTokenExpiringSoon = (token) => {
  try {
    if (!token) return true;
    
    // Decode JWT token (client-side safe)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const decoded = JSON.parse(jsonPayload);
    if (!decoded || !decoded.exp) return true;
    
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    
    // Return true if token expires within 5 minutes (300 seconds)
    return timeUntilExpiry < 300;
  } catch (err) {
    //console.error('Token validation error:', err);
    return true;
  }
};

const useTokenRefresh = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const refreshTokenIfNeeded = useCallback(async () => {
    if (!isAuthenticated) return;
    
    const accessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');

    if (!accessToken || !storedRefreshToken) {
      return;
    }

    // Check if token is expiring soon (within 5 minutes)
    if (isTokenExpiringSoon(accessToken)) {
      try {
        //console.log('Access token expiring soon, refreshing...');
        await dispatch(refreshToken()).unwrap();
        //console.log('Tokens refreshed successfully');
      } catch (error) {
        //console.error('Token refresh failed:', error);
        
        // Redirect to login on refresh failure
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname + window.location.search;
          router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        }
      }
    }
  }, [dispatch, router, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Check token immediately on mount
    refreshTokenIfNeeded();

    // Set up interval to check token every 5 minutes
   // const interval = setInterval(refreshTokenIfNeeded, 5 * 60 * 1000);

    return () => {}; // clearInterval(interval);
  }, [refreshTokenIfNeeded, isAuthenticated]);

  // Also check token on focus/visibility change
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshTokenIfNeeded();
      }
    };

    const handleFocus = () => {
      refreshTokenIfNeeded();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshTokenIfNeeded, isAuthenticated]);

  return { refreshTokenIfNeeded };
};

export default useTokenRefresh;
