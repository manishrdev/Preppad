import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getState, subscribe, replaceState, mergeStates } from './store.js';
import * as cloud from './cloud.js';

const Ctx = createContext({ configured: false, user: null, status: 'local' });
export const useSync = () => useContext(Ctx);

export function SyncProvider({ children }) {
  const [configured, setConfigured] = useState(cloud.cloudConfigured());
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(configured ? 'signed-out' : 'local');
  const [error, setError] = useState('');
  const timer = useRef();
  const uidRef = useRef(null);
  const pulled = useRef(false);

  // watch auth
  useEffect(() => {
    if (!configured) return undefined;
    let off;
    let dead = false;
    cloud.watchUser(async (u) => {
      if (dead) return;
      setUser(u);
      uidRef.current = u?.uid || null;
      pulled.current = false;
      if (!u) { setStatus('signed-out'); return; }
      try {
        setStatus('syncing');
        const remote = await cloud.pull(u.uid);
        const merged = mergeStates(getState(), remote);
        pulled.current = true;
        replaceState(merged);
        await cloud.push(u.uid, merged);
        setStatus('synced'); setError('');
      } catch (e) { setStatus('error'); setError(e.message); }
    }).then((o) => { off = o; }).catch((e) => { setStatus('error'); setError(e.message); });
    return () => { dead = true; off && off(); };
  }, [configured]);

  // debounce pushes on local changes
  useEffect(() => subscribe(() => {
    if (!uidRef.current || !pulled.current) return;
    clearTimeout(timer.current);
    setStatus('syncing');
    timer.current = setTimeout(async () => {
      try { await cloud.push(uidRef.current, getState()); setStatus('synced'); setError(''); }
      catch (e) { setStatus('error'); setError(e.message); }
    }, 1500);
  }), []);

  const value = { configured, user, status, error, reconfigure: () => { setConfigured(cloud.cloudConfigured()); setStatus(cloud.cloudConfigured() ? 'signed-out' : 'local'); } };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
