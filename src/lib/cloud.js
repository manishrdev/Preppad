// Optional free cloud sync using Firebase Auth + Firestore (Spark plan).
// Firebase is imported lazily so local-only users never download it.
const CFG_KEY = 'preppad_firebase_cfg';

export function getFirebaseConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(CFG_KEY));
    if (saved?.apiKey && saved?.projectId) return saved;
  } catch { /* ignore */ }
  const e = import.meta.env;
  if (e.VITE_FIREBASE_API_KEY && e.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: e.VITE_FIREBASE_API_KEY,
      authDomain: e.VITE_FIREBASE_AUTH_DOMAIN || `${e.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: e.VITE_FIREBASE_PROJECT_ID,
      appId: e.VITE_FIREBASE_APP_ID,
    };
  }
  return null;
}
export const cloudConfigured = () => !!getFirebaseConfig();

export function saveFirebaseConfig(text) {
  // accepts JSON or the JS object literal Firebase shows in the console
  const body = text.trim().replace(/^const\s+\w+\s*=\s*/, '').replace(/;$/, '');
  const json = body.replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g, '$1"$2":').replace(/'/g, '"').replace(/,\s*}/g, '}');
  const cfg = JSON.parse(json);
  if (!cfg.apiKey || !cfg.projectId) throw new Error('Config needs apiKey and projectId');
  localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
}
export const clearFirebaseConfig = () => localStorage.removeItem(CFG_KEY);

let ctx;
async function init() {
  if (ctx) return ctx;
  const cfg = getFirebaseConfig();
  if (!cfg) throw new Error('Cloud sync is not configured');
  const [{ initializeApp }, auth, fs] = await Promise.all([
    import('firebase/app'), import('firebase/auth'), import('firebase/firestore'),
  ]);
  const app = initializeApp(cfg);
  ctx = { auth: auth.getAuth(app), db: fs.getFirestore(app), A: auth, F: fs };
  return ctx;
}

export async function watchUser(cb) {
  const { auth, A } = await init();
  return A.onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, email: u.email, name: u.displayName } : null));
}
export async function signInGoogle() {
  const { auth, A } = await init();
  await A.signInWithPopup(auth, new A.GoogleAuthProvider());
}
export async function signInEmail(email, password, create) {
  const { auth, A } = await init();
  if (create) await A.createUserWithEmailAndPassword(auth, email, password);
  else await A.signInWithEmailAndPassword(auth, email, password);
}
export async function signOutUser() {
  const { auth, A } = await init();
  await A.signOut(auth);
}
export async function pull(uid) {
  const { db, F } = await init();
  const snap = await F.getDoc(F.doc(db, 'users', uid));
  return snap.exists() ? JSON.parse(snap.data().blob) : null;
}
export async function push(uid, state) {
  const { db, F } = await init();
  await F.setDoc(F.doc(db, 'users', uid), { blob: JSON.stringify(state), updatedAt: Date.now() });
}
