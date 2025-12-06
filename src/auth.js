const AUTH_TOKEN_KEY = 'crm_admin_token';
const AUTH_ADMIN_KEY = 'crm_admin_user';

export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function removeAuthToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_ADMIN_KEY);
}

export function getAdminUser() {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(AUTH_ADMIN_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function setAdminUser(admin) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_ADMIN_KEY, JSON.stringify(admin));
}

export function isAuthenticated() {
  return !!getAuthToken();
}


