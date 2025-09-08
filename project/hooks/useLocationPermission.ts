import { useState, useEffect } from 'react';
// import Geolocation from 'react-native-geolocation-service';

interface LocationPermissionReturn {
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
  checkPermission: () => Promise<void>;
  requestPermission: () => Promise<void>;
  getCurrentLocation: () => Promise<any | null>;
}

export const useLocationPermission = (): LocationPermissionReturn => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPermission = async (): Promise<void> => {
    try {
      // Placeholder: treat as denied until native module is wired
      const status = 'denied' as const;
      setHasPermission(false);
    } catch (err) {
      console.error('Error checking location permission:', err);
      setError('Failed to check location permission');
    }
  };

  const requestPermission = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Placeholder: request flow not implemented; keep denied
      const status = 'denied' as const;
      setHasPermission(false);
      
      // keep error for UI purposes
      setError('Location permission denied');
    } catch (err) {
      console.error('Error requesting location permission:', err);
      setError('Failed to request location permission');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async (): Promise<any | null> => {
    if (!hasPermission) {
      setError('Location permission not granted');
      return null;
    }

    try {
      // TODO: Implement with react-native-geolocation-service
      console.log('Location service would be implemented here');
      return null;
    } catch (err) {
      console.error('Error getting current location:', err);
      setError('Failed to get current location');
      return null;
    }
  };

  useEffect(() => {
    checkPermission();
  }, []);

  return {
    hasPermission,
    isLoading,
    error,
    checkPermission,
    requestPermission,
    getCurrentLocation,
  };
}; 