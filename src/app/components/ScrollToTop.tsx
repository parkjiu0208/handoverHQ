import { useEffect } from 'react';
import { useLocation } from 'react-router';

export function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
  }, [location.pathname, location.search]);

  return null;
}
