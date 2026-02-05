import { useState, useEffect } from 'react';

/**
 * Auto-detect user location down to pincode.
 * Uses geolocation + BigDataCloud reverse geocode first; falls back to IP-based (ip-api) if denied or unavailable.
 */
export function useLocationDetection() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fromBigDataCloud = (data) => {
      const city = data.city || data.locality || '';
      const state = data.principalSubdivision || '';
      const pincode = data.postcode || '';
      const parts = [city, state].filter(Boolean);
      const display = pincode ? `${parts.join(', ')} - ${pincode}` : parts.join(', ') || 'Location';
      return { city, state, pincode, display };
    };

    const fromIpApi = (data) => {
      const city = data.city || '';
      const state = data.regionName || '';
      const pincode = data.zip || '';
      const parts = [city, state].filter(Boolean);
      const display = pincode ? `${parts.join(', ')} - ${pincode}` : parts.join(', ') || 'Location';
      return { city, state, pincode, display };
    };

    const tryGeolocation = () => {
      if (!navigator.geolocation) return Promise.reject(new Error('Geolocation not supported'));

      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            )
              .then((res) => res.json())
              .then((data) => {
                if (data && (data.locality || data.city || data.postcode)) {
                  resolve(fromBigDataCloud(data));
                } else {
                  reject(new Error('No address from reverse geocode'));
                }
              })
              .catch(reject);
          },
          (err) => reject(err),
          { timeout: 8000, maximumAge: 300000 }
        );
      });
    };

    const tryIpApi = () => {
      return fetch('https://ip-api.com/json/?fields=city,regionName,zip,country')
        .then((res) => res.json())
        .then((data) => {
          if (data && (data.city || data.zip)) {
            return fromIpApi(data);
          }
          throw new Error('No location from IP');
        });
    };

    (async () => {
      try {
        const loc = await tryGeolocation();
        if (!cancelled) {
          setLocation(loc);
          setError(null);
        }
      } catch (e) {
        try {
          const loc = await tryIpApi();
          if (!cancelled) {
            setLocation(loc);
            setError(null);
          }
        } catch (fallbackErr) {
          if (!cancelled) {
            setLocation({ display: 'Location', city: '', state: '', pincode: '' });
            setError(fallbackErr.message);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { location, loading, error };
}
