const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:4000'
    : 'https://api.gurulink.app');

async function handle(res) {
  if (!res.ok) {
    let data;
    try {
      data = await res.json();
    } catch {
      /* ignore */
    }
    const message = data?.error || data?.message || res.statusText || 'Request failed';
    throw new Error(message);
  }
  return res.json();
}

function getAuthHeaders() {
  const token = localStorage.getItem('crm_admin_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function adminLogin(username, password) {
  const res = await fetch(`${API_BASE}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    credentials: 'include'
  });
  return handle(res);
}

export async function verifyAdminToken() {
  const res = await fetch(`${API_BASE}/api/admin/auth/me`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  return handle(res);
}

export async function fetchCustomers() {
  const res = await fetch(`${API_BASE}/api/admin/customers`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  return handle(res);
}

export async function adminCancelSubscription(email) {
  const res = await fetch(`${API_BASE}/api/admin/customers/cancel-subscription`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ email }),
    credentials: 'include'
  });
  return handle(res);
}

export async function adminRestoreSubscription(email) {
  const res = await fetch(`${API_BASE}/api/admin/customers/restore-subscription`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ email }),
    credentials: 'include'
  });
  return handle(res);
}

export async function adminDeactivateAccount(email) {
  const res = await fetch(`${API_BASE}/api/admin/customers/deactivate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ email }),
    credentials: 'include'
  });
  return handle(res);
}

export async function adminActivateAccount(email) {
  const res = await fetch(`${API_BASE}/api/admin/customers/activate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ email }),
    credentials: 'include'
  });
  return handle(res);
}

export async function fetchCustomerDetail(email) {
  const encoded = encodeURIComponent(email);
  const res = await fetch(`${API_BASE}/api/admin/customers/${encoded}`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  return handle(res);
}

export async function listAdminUsers() {
  const res = await fetch(`${API_BASE}/api/admin/auth/users`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  return handle(res);
}

export async function createAdminUser(username, password, role = 'admin') {
  const res = await fetch(`${API_BASE}/api/admin/auth/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ username, password, role }),
    credentials: 'include'
  });
  return handle(res);
}

export async function getNotifications({ limit = 50, unreadOnly = false } = {}) {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit);
  if (unreadOnly) params.append('unreadOnly', 'true');
  
  const res = await fetch(`${API_BASE}/api/admin/notifications?${params}`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  return handle(res);
}

export async function getUnreadNotificationCount() {
  const res = await fetch(`${API_BASE}/api/admin/notifications/unread-count`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  return handle(res);
}

export async function markNotificationAsRead(notificationId) {
  const res = await fetch(`${API_BASE}/api/admin/notifications/${notificationId}/read`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  return handle(res);
}

export async function markAllNotificationsAsRead() {
  const res = await fetch(`${API_BASE}/api/admin/notifications/mark-all-read`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  return handle(res);
}

