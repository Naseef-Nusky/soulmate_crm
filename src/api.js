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

export async function fetchCustomers() {
  const res = await fetch(`${API_BASE}/api/admin/customers`, {
    credentials: 'include'
  });
  return handle(res);
}

export async function adminCancelSubscription(email) {
  const res = await fetch(`${API_BASE}/api/admin/customers/cancel-subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    credentials: 'include'
  });
  return handle(res);
}

export async function adminDeactivateAccount(email) {
  const res = await fetch(`${API_BASE}/api/admin/customers/deactivate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    credentials: 'include'
  });
  return handle(res);
}

export async function fetchCustomerDetail(email) {
  const encoded = encodeURIComponent(email);
  const res = await fetch(`${API_BASE}/api/admin/customers/${encoded}`, {
    credentials: 'include'
  });
  return handle(res);
}


