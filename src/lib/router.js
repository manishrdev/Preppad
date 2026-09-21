import { useEffect, useState } from 'react';

const parse = () => (window.location.hash.replace(/^#\/?/, '') || 'home').split('?')[0];

export function useRoute() {
  const [route, setRoute] = useState(parse());
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
export const go = (r) => { window.location.hash = `/${r}`; };
