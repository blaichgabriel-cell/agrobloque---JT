import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabaseConfigUrl = supabaseUrl || 'https://example.supabase.co';
const supabaseConfigAnonKey = supabaseAnonKey || 'configurar-anon-key-jt';

if ((!supabaseUrl || !supabaseAnonKey) && typeof window !== 'undefined') {
  console.error('Faltan las variables REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY para AgroBloque - JT.');
}

const getGuestTokenFromPath = () => {
  if (typeof window === 'undefined') return '';
  const match = window.location.pathname.match(/^\/invitado\/([^/]+)/);
  return match?.[1] || '';
};

const auth = {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  storageKey: 'agrobloque-jt-session',
};

if (typeof window !== 'undefined') {
  auth.storage = window.localStorage;
}

export const guestToken = getGuestTokenFromPath();

const supabaseAuth = createClient(supabaseConfigUrl, supabaseConfigAnonKey, { auth });
const supabaseGuestClient = createClient(supabaseConfigUrl, supabaseConfigAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: guestToken ? { 'x-guest-token': guestToken } : {},
  },
});

export const supabase = guestToken ? supabaseGuestClient : supabaseAuth;

export const clearLocalAuth = () => {
  if (typeof window === 'undefined') return;

  const limpiarStorage = (storage) => {
    if (!storage) return;
    Object.keys(storage).forEach((key) => {
      const debeLimpiar =
        key === 'agrobloque-jt-session' ||
        key === 'agrobloque-jt-campo-activo' ||
        key.startsWith('sb-') ||
        key.toLowerCase().includes('supabase');

      if (debeLimpiar) storage.removeItem(key);
    });
  };

  limpiarStorage(window.localStorage);
  limpiarStorage(window.sessionStorage);
};

export const forceLocalSignOut = async (reload = true) => {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (error) {
    console.warn('No se pudo cerrar sesion contra Supabase, se limpia localmente.', error);
  }

  clearLocalAuth();

  if (reload && typeof window !== 'undefined') {
    window.location.assign('/');
  }
};
