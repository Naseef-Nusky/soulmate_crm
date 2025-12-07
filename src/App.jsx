import React, { useEffect, useState } from 'react';
import {
  fetchCustomers,
  adminCancelSubscription,
  adminRestoreSubscription,
  adminDeactivateAccount,
  adminActivateAccount,
  fetchCustomerDetail,
  verifyAdminToken,
} from './api.js';
import { isAuthenticated, getAdminUser, removeAuthToken, setAdminUser } from './auth.js';
import Login from './Login.jsx';
import Profile from './Profile.jsx';
import CreateUser from './CreateUser.jsx';
import Notifications from './Notifications.jsx';
import { getUnreadNotificationCount } from './api.js';

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold ${
        active
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-red-50 text-red-700 border border-red-200'
      }`}
    >
      <span
        className={`mr-1 h-1.5 w-1.5 rounded-full ${
          active ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      {active ? 'Active' : 'Deactivated'}
    </span>
  );
}

function ActionButton({ children, onClick, variant = 'primary', disabled, type, className = '' }) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';
  const styles =
    variant === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-500'
      : variant === 'secondary'
      ? 'border border-gurulink-primary text-gurulink-primary hover:bg-gurulink-bgSoft'
      : 'bg-gurulink-accent text-gurulink-primary hover:bg-gurulink-accentHover';

  return (
    <button
      type={type || 'button'}
      className={`${base} ${styles} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState('customers'); // 'customers', 'profile', 'create-user'
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workingEmail, setWorkingEmail] = useState('');
  const [cancelledEmails, setCancelledEmails] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [filterUid, setFilterUid] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const PAGE_SIZE = 10;
  const showDetail = !!selectedEmail;
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Check user roles
  const isViewer = admin?.role === 'viewer';
  const isSuperAdmin = admin?.role === 'super_admin' || !admin?.role; // Default role is super_admin
  const isAdmin = admin?.role === 'admin';
  // Super admin and admin can perform customer actions (cancel subscription, deactivate, activate)
  const canPerformCustomerActions = isSuperAdmin || isAdmin;

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        setAuthLoading(false);
        return;
      }

      try {
        const data = await verifyAdminToken();
        if (data.ok && data.admin) {
          setAdminUser(data.admin);
          setAdmin(data.admin);
          setAuthenticated(true);
        } else {
          removeAuthToken();
        }
      } catch {
        removeAuthToken();
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (adminUser) => {
    setAdmin(adminUser);
    setAuthenticated(true);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      removeAuthToken();
      setAuthenticated(false);
      setAdmin(null);
      setCustomers([]);
    }
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCustomers();
      const list = data.customers || [];
      setCustomers(list);

      // Recompute which customers have cancellation scheduled or already canceled,
      // so the cancel button state persists after refresh.
      try {
        const details = await Promise.all(
          list.map((c) =>
            fetchCustomerDetail(c.email).catch(() => null)
          )
        );
        const cancelled = details
          .filter((d) => {
            if (!d || !d.subscription) return false;
            const subInfo = d.subscription.subscription;
            const hasSub = d.subscription.hasSubscription;
            if (!hasSub || !subInfo) return false;
            return subInfo.cancelAtPeriodEnd || subInfo.status === 'canceled';
          })
          .map((d) => d.customer?.email)
          .filter(Boolean);
        setCancelledEmails(Array.from(new Set(cancelled)));
      } catch (innerErr) {
        console.warn('[CRM] Failed to load subscription details for all customers', innerErr);
      }
    } catch (err) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      load();
      // Load unread notification count on mount
      refreshNotificationCount();
      // Auto-refresh notification count every 10 seconds
      const notificationInterval = setInterval(() => {
        refreshNotificationCount();
      }, 10000); // Refresh every 10 seconds
      return () => clearInterval(notificationInterval);
    }
  }, [authenticated]);

  const refreshNotificationCount = async () => {
    try {
      const data = await getUnreadNotificationCount();
      if (data.ok) {
        setUnreadNotificationCount(data.count || 0);
      }
    } catch (err) {
      // Silently fail for notification count
    }
  };

  const loadDetail = async (email) => {
    setSelectedEmail(email);
    setDetail(null);
    setDetailLoading(true);
    setError('');
    try {
      const data = await fetchCustomerDetail(email);
      setDetail(data);
      // If backend reports no active subscription or already cancel_at_period_end,
      // mark this email as effectively cancelled so the button is disabled.
      const subInfo = data.subscription?.subscription;
      const hasSub = data.subscription?.hasSubscription;
      const isCancelledOrEnding =
        !hasSub ||
        subInfo?.cancelAtPeriodEnd ||
        subInfo?.status === 'canceled';
      if (isCancelledOrEnding && data.customer?.email) {
        setCancelledEmails((prev) =>
          prev.includes(data.customer.email) ? prev : [...prev, data.customer.email]
        );
      }
    } catch (err) {
      setError(err.message || 'Failed to load customer detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCancelSubscription = async (email) => {
    if (!window.confirm(`Cancel subscription for ${email}?`)) return;
    setWorkingEmail(email);
    setError('');
    try {
      await adminCancelSubscription(email);
      setCancelledEmails((prev) =>
        prev.includes(email) ? prev : [...prev, email]
      );
      await load();
      // Refresh notifications after action
      refreshNotificationCount();
      // Reload detail if popup is open for this customer
      if (selectedEmail === email) {
        await loadDetail(email);
      }
    } catch (err) {
      const msg = err.message || '';
      // If API says there's no active subscription, treat it as already cancelled
      if (
        msg.includes('No active subscription found') ||
        msg.includes('No subscription found')
      ) {
        setCancelledEmails((prev) =>
          prev.includes(email) ? prev : [...prev, email]
        );
        // Reload detail if popup is open for this customer
        if (selectedEmail === email) {
          await loadDetail(email);
        }
      } else {
        setError(msg || 'Failed to cancel subscription');
      }
    } finally {
      setWorkingEmail('');
    }
  };

  const handleDeactivate = async (email) => {
    if (!window.confirm(`Deactivate account for ${email}? They will not be able to log in.`)) {
      return;
    }
    setWorkingEmail(email);
    setError('');
    try {
      await adminDeactivateAccount(email);
      await load();
      // Refresh notifications after action
      refreshNotificationCount();
      // Reload detail if popup is open for this customer
      if (selectedEmail === email) {
        await loadDetail(email);
      }
    } catch (err) {
      setError(err.message || 'Failed to deactivate account');
    } finally {
      setWorkingEmail('');
    }
  };

  const handleRestoreSubscription = async (email) => {
    if (!window.confirm(`Reactivate subscription for ${email}?`)) return;
    setWorkingEmail(email);
    setError('');
    try {
      await adminRestoreSubscription(email);
      setCancelledEmails((prev) => prev.filter((e) => e !== email));
      await load();
      // Refresh notifications after action
      refreshNotificationCount();
      // Reload detail if it's open
      if (selectedEmail === email) {
        await loadDetail(email);
      }
    } catch (err) {
      setError(err.message || 'Failed to reactivate subscription');
    } finally {
      setWorkingEmail('');
    }
  };

  const handleActivate = async (email) => {
    if (!window.confirm(`Activate account for ${email}? They will be able to log in again.`)) {
      return;
    }
    setWorkingEmail(email);
    setError('');
    try {
      await adminActivateAccount(email);
      await load();
      // Refresh notifications after action
      refreshNotificationCount();
      // Reload detail if popup is open for this customer
      if (selectedEmail === email) {
        await loadDetail(email);
      }
    } catch (err) {
      setError(err.message || 'Failed to activate account');
    } finally {
      setWorkingEmail('');
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesText =
      !filterText ||
      c.email.toLowerCase().includes(filterText.toLowerCase()) ||
      (c.name || '').toLowerCase().includes(filterText.toLowerCase());

    const matchesUid =
      !filterUid ||
      String(c.id || '')
        .toLowerCase()
        .includes(filterUid.toLowerCase());

    const matchesActive = !showOnlyActive || c.is_active !== false;
    return matchesText && matchesUid && matchesActive;
  });

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const visibleCustomers = filteredCustomers.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gurulink-bgLight flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mb-4" style={{ borderColor: '#D4A34B' }} />
          <p className="text-sm text-gurulink-textSecondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gurulink-bgLight">
      <header className="border-b border-gurulink-border bg-gurulink-bg shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/logoicon.png"
              alt="GuruLink"
              className="h-10 w-10 rounded-lg object-cover"
              loading="lazy"
              decoding="async"
            />
            <div>
              <div className="text-lg font-bold tracking-wide text-gurulink-primary">
                GuruLink CRM
              </div>
              <div className="text-sm text-gurulink-textSecondary">Customer & Subscription Management</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {admin && (
              <div className="hidden sm:flex items-center gap-2 text-gurulink-textSecondary">
                <span className="text-gurulink-textMuted">Logged in as:</span>
                <span className="font-semibold text-gurulink-primary">{admin.username}</span>
                {admin.role && (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gurulink-accent/20 text-gurulink-accent border border-gurulink-accent/30">
                    {admin.role}
                  </span>
                )}
              </div>
            )}
            {/* Notifications Button */}
            <button
              onClick={() => {
                setShowNotifications(true);
                refreshNotificationCount();
              }}
              className="relative inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors border border-gurulink-primary text-gurulink-primary hover:bg-gurulink-bgSoft"
              title="Notifications"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </button>
            <ActionButton variant="secondary" onClick={load} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </ActionButton>
            <ActionButton variant="danger" onClick={handleLogout}>
              Logout
            </ActionButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-gurulink-border">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'customers'
                ? 'border-gurulink-accent text-gurulink-primary'
                : 'border-transparent text-gurulink-textSecondary hover:text-gurulink-primary'
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'profile'
                ? 'border-gurulink-accent text-gurulink-primary'
                : 'border-transparent text-gurulink-textSecondary hover:text-gurulink-primary'
            }`}
          >
            Profile
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('create-user')}
              className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === 'create-user'
                  ? 'border-gurulink-accent text-gurulink-primary'
                  : 'border-transparent text-gurulink-textSecondary hover:text-gurulink-primary'
              }`}
            >
              Create User
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && <Profile admin={admin} />}
        {activeTab === 'create-user' && (
          <CreateUser
            currentUserRole={admin?.role}
            onUserCreated={() => {
              // Optionally refresh profile if needed
            }}
          />
        )}
        {activeTab === 'customers' && (
          <>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <section className="rounded-lg border border-gurulink-border bg-gurulink-bg shadow-lg">
          <div className="flex items-center justify-between border-b border-gurulink-border px-4 py-3 bg-gurulink-bgSoft">
            <div>
              <h2 className="text-lg font-bold text-gurulink-primary">Customers</h2>
            </div>
            <div className="flex items-center gap-3 text-sm text-gurulink-textSecondary">
              <div className="hidden sm:flex items-center gap-2">
                <span>Total:</span>
                <span className="font-semibold text-gurulink-accent">{filteredCustomers.length}</span>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-md border border-gurulink-border bg-white px-1 py-0.5 text-xs text-gurulink-text focus:outline-none focus:ring-1 focus:ring-gurulink-accent"
                >
                  {[10, 20, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}/page
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter by UID"
                  value={filterUid}
                  onChange={(e) => setFilterUid(e.target.value)}
                  className="hidden sm:block rounded-md border border-gurulink-border bg-white px-2 py-1 text-xs text-gurulink-text placeholder:text-gurulink-textMuted focus:outline-none focus:ring-1 focus:ring-gurulink-accent"
                />
                <input
                  type="text"
                  placeholder="Filter by email or name"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="hidden sm:block rounded-md border border-gurulink-border bg-white px-2 py-1 text-xs text-gurulink-text placeholder:text-gurulink-textMuted focus:outline-none focus:ring-1 focus:ring-gurulink-accent"
                />
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-gurulink-border text-gurulink-accent focus:ring-gurulink-accent"
                    checked={showOnlyActive}
                    onChange={(e) => setShowOnlyActive(e.target.checked)}
                  />
                  <span>Active only</span>
                </label>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gurulink-border text-sm">
              <thead className="bg-gurulink-bgSoft">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gurulink-primary">UID</th>
                  <th className="px-3 py-2 text-left font-semibold text-gurulink-primary">Email</th>
                  <th className="px-3 py-2 text-left font-semibold text-gurulink-primary">Name</th>
                  <th className="px-3 py-2 text-left font-semibold text-gurulink-primary">Date of Birth</th>
                  <th className="px-3 py-2 text-left font-semibold text-gurulink-primary">Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-gurulink-primary">
                    Created / Deactivated
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-gurulink-primary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gurulink-border bg-gurulink-bg">
                {loading && filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-gurulink-textSecondary">
                      Loading customers…
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-gurulink-textMuted">
                      No customers found yet.
                    </td>
                  </tr>
                ) : (
                  visibleCustomers.map((c) => (
                    <tr
                      key={c.id}
                      className={`hover:bg-gurulink-bgSoft transition-colors cursor-pointer ${
                        selectedEmail === c.email ? 'bg-gurulink-bgSoft' : ''
                      }`}
                      onClick={() => loadDetail(c.email)}
                    >
                      <td className="px-3 py-2 align-top">
                        <div className="font-medium text-gurulink-primary">{c.id || '—'}</div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="font-medium text-gurulink-primary">{c.email}</div>
                      </td>
                      <td className="px-3 py-2 align-top text-gurulink-text">
                        {c.name || <span className="text-gurulink-textMuted">—</span>}
                      </td>
                      <td className="px-3 py-2 align-top text-gurulink-textSecondary">
                        {c.birth_date
                          ? new Date(c.birth_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : <span className="text-gurulink-textMuted">—</span>}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex flex-col gap-1">
                          <StatusBadge active={c.is_active !== false} />
                          {c.is_test && (
                            <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
                              TEST CUSTOMER
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top text-gurulink-textSecondary">
                        <div>
                          <span className="text-gurulink-textMuted">Created:</span>{' '}
                          {c.created_at
                            ? new Date(c.created_at).toLocaleString()
                            : 'Unknown'}
                        </div>
                        {c.deactivated_at && (
                          <div>
                            <span className="text-gurulink-textMuted">Deactivated:</span>{' '}
                            {new Date(c.deactivated_at).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {canPerformCustomerActions ? (
                          <div className="flex justify-end gap-2">
                            {cancelledEmails.includes(c.email) ? (
                              <ActionButton
                                variant="primary"
                                onClick={() => handleRestoreSubscription(c.email)}
                                disabled={workingEmail === c.email}
                              >
                                Reactivate Subscription
                              </ActionButton>
                            ) : (
                              <ActionButton
                                variant="secondary"
                                onClick={() => handleCancelSubscription(c.email)}
                                disabled={workingEmail === c.email}
                              >
                                Cancel Subscription
                              </ActionButton>
                            )}
                            {c.is_active === false ? (
                              <ActionButton
                                variant="primary"
                                onClick={() => handleActivate(c.email)}
                                disabled={workingEmail === c.email}
                              >
                                Activate
                              </ActionButton>
                            ) : (
                              <ActionButton
                                variant="danger"
                                onClick={() => handleDeactivate(c.email)}
                                disabled={workingEmail === c.email}
                              >
                                Deactivate
                              </ActionButton>
                            )}
                          </div>
                        ) : (
                          <div className="text-right text-sm text-gurulink-textMuted italic">
                            View only
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {filteredCustomers.length > perPage && (
            <div className="flex items-center justify-between border-t border-gurulink-border px-4 py-3 text-sm text-gurulink-textSecondary">
              <div>
                Showing{' '}
                <span className="font-semibold text-gurulink-primary">
                  {(currentPage - 1) * perPage + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-gurulink-primary">
                  {Math.min(currentPage * perPage, filteredCustomers.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-gurulink-primary">
                  {filteredCustomers.length}
                </span>{' '}
                customers
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-md border border-gurulink-border px-2 py-1 text-sm font-semibold text-gurulink-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <div className="text-gurulink-primary text-sm font-semibold">
                  Page {currentPage} / {totalPages}
                </div>
                <button
                  className="rounded-md border border-gurulink-border px-2 py-1 text-sm font-semibold text-gurulink-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
          </>
        )}
      </main>
      {showNotifications && (
        <Notifications
          onClose={() => {
            setShowNotifications(false);
            refreshNotificationCount();
          }}
        />
      )}
      {showDetail && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-4">
          <div className="w-full max-w-6xl rounded-xl bg-white shadow-2xl p-4 sm:p-5 text-sm text-gurulink-text relative">
            <button
              onClick={() => {
                setSelectedEmail('');
                setDetail(null);
              }}
              className="absolute right-3 top-3 text-xl text-gurulink-textMuted hover:text-gurulink-text transition-colors"
              style={{ fontSize: '20px', lineHeight: '1' }}
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-gurulink-primary mb-3">Customer Detail</h3>
            {detailLoading && (
              <p className="text-base text-gurulink-textSecondary">Loading…</p>
            )}
            {!detailLoading && !detail && (
              <p className="text-base text-gurulink-textMuted">Unable to load customer details.</p>
            )}
            {!detailLoading && detail && (
              <div className="space-y-3">
                {/* Customer Info Section */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-base font-bold text-gurulink-primary">Customer Information</h4>
                    <div className="flex items-center gap-2">
                      <StatusBadge active={detail.customer?.is_active !== false} />
                      {detail.customer?.is_test && (
                        <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
                          TEST
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                        User ID
                      </div>
                      <div className="text-sm font-semibold text-gurulink-primary">
                        {detail.customer?.id || '—'}
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                        Email
                      </div>
                      <div className="text-sm font-semibold text-gurulink-primary break-all">
                        {detail.customer?.email}
                      </div>
                    </div>
                    {detail.customer?.name && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                          Name
                        </div>
                        <div className="text-sm text-gurulink-textSecondary">
                          {detail.customer.name}
                        </div>
                      </div>
                    )}
                    {detail.customer?.birth_date && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                          Date of Birth
                        </div>
                        <div className="text-sm text-gurulink-textSecondary">
                          {new Date(detail.customer.birth_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    )}
                    {detail.customer?.gender && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                          Gender
                        </div>
                        <div className="text-sm text-gurulink-textSecondary capitalize">
                          {detail.customer.gender}
                        </div>
                      </div>
                    )}
                    {detail.customer?.place_of_birth && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                          Place of Birth
                        </div>
                        <div className="text-sm text-gurulink-textSecondary">
                          {detail.customer.place_of_birth}
                        </div>
                      </div>
                    )}
                    {detail.customer?.created_at && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                          Account Created
                        </div>
                        <div className="text-sm text-gurulink-textSecondary">
                          {new Date(detail.customer.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    )}
                    {detail.customer?.deactivated_at && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                          Deactivated At
                        </div>
                        <div className="text-sm text-red-600">
                          {new Date(detail.customer.deactivated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subscription Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                  <h4 className="text-base font-bold text-gurulink-primary mb-2">Subscription Details</h4>
                  {!detail.subscription?.hasSubscription ? (
                    <div className="text-sm text-gurulink-textMuted bg-white rounded-lg p-2 border border-gray-200">
                      No active subscription found.
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                            Status
                          </div>
                          <div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              detail.subscription.subscription?.status === 'active'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : detail.subscription.subscription?.status === 'canceled'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            }`}>
                              {detail.subscription.subscription?.status?.toUpperCase() || '—'}
                            </span>
                          </div>
                        </div>
                        {detail.subscription.paymentMethod?.card && (
                          <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                              Payment Method
                            </div>
                            <div className="text-sm font-semibold text-gurulink-textSecondary">
                              {detail.subscription.paymentMethod.card.brand.toUpperCase()} •••• {detail.subscription.paymentMethod.card.last4}
                            </div>
                            {detail.subscription.paymentMethod.card.expMonth && detail.subscription.paymentMethod.card.expYear && (
                              <div className="text-xs text-gurulink-textMuted">
                                Exp {detail.subscription.paymentMethod.card.expMonth}/{detail.subscription.paymentMethod.card.expYear}
                              </div>
                            )}
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                            Period Start
                          </div>
                          <div className="text-sm text-gurulink-textSecondary">
                            {detail.subscription.subscription?.currentPeriodStart
                              ? new Date(
                                  detail.subscription.subscription.currentPeriodStart
                                ).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                            Period End
                          </div>
                          <div className="text-sm text-gurulink-textSecondary">
                            {detail.subscription.subscription?.currentPeriodEnd
                              ? new Date(
                                  detail.subscription.subscription.currentPeriodEnd
                                ).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : '—'}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                            Cancellation
                          </div>
                          <div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              detail.subscription.subscription?.cancelAtPeriodEnd
                                ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                : 'bg-green-50 text-green-700 border border-green-200'
                            }`}>
                              {detail.subscription.subscription?.cancelAtPeriodEnd ? 'Scheduled' : 'Active'}
                            </span>
                          </div>
                        </div>
                        {detail.subscription.subscription?.items && detail.subscription.subscription.items.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                              Plan
                            </div>
                            <div className="text-sm text-gurulink-textSecondary">
                              {detail.subscription.subscription.items.map((item, idx) => (
                                <div key={idx}>
                                  {item.intervalCount} {item.interval} - {item.amount} {item.currency.toUpperCase()}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent Invoices Section */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                  <h4 className="text-base font-bold text-gurulink-primary mb-2">Recent Invoices</h4>
                  {detail.subscription?.invoices?.length ? (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                            <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                            <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {detail.subscription.invoices.slice(0, 5).map((inv) => (
                            <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-2 py-2 text-gurulink-textSecondary">
                                {new Date(inv.created).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: '2-digit'
                                })}
                              </td>
                              <td className="px-2 py-2">
                                <span className="font-semibold text-gurulink-primary">
                                  {inv.amount.toFixed(2)} {inv.currency.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-2 py-2">
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                                    inv.status === 'paid'
                                      ? 'bg-green-50 text-green-700 border border-green-200'
                                      : inv.status === 'open'
                                      ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                      : inv.status === 'draft'
                                      ? 'bg-gray-50 text-gray-700 border border-gray-200'
                                      : 'bg-red-50 text-red-700 border border-red-200'
                                  }`}
                                >
                                  {inv.status.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {detail.subscription.invoices.length > 5 && (
                        <div className="px-2 py-1.5 text-xs text-gurulink-textMuted text-center bg-gray-50 border-t border-gray-200">
                          +{detail.subscription.invoices.length - 5} more invoices
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg p-2 border border-gray-200 text-sm text-gurulink-textMuted">
                      No invoices found.
                    </div>
                  )}
                </div>

                {/* Popup actions footer */}
                {canPerformCustomerActions ? (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-end gap-2">
                      {cancelledEmails.includes(detail.customer?.email) ? (
                        <ActionButton
                          variant="primary"
                          onClick={() => handleRestoreSubscription(detail.customer?.email)}
                          disabled={workingEmail === detail.customer?.email}
                        >
                          Reactivate Subscription
                        </ActionButton>
                      ) : (
                        <ActionButton
                          variant="secondary"
                          onClick={() => handleCancelSubscription(detail.customer?.email)}
                          disabled={workingEmail === detail.customer?.email}
                        >
                          Cancel Subscription
                        </ActionButton>
                      )}
                      {detail.customer?.is_active === false ? (
                        <ActionButton
                          variant="primary"
                          onClick={() => handleActivate(detail.customer?.email)}
                          disabled={workingEmail === detail.customer?.email}
                        >
                          Activate
                        </ActionButton>
                      ) : (
                        <ActionButton
                          variant="danger"
                          onClick={() => handleDeactivate(detail.customer?.email)}
                          disabled={workingEmail === detail.customer?.email}
                        >
                          Deactivate
                        </ActionButton>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-center text-gurulink-textMuted italic">
                      View only - Actions are not available for viewers
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



