import React, { useEffect, useState } from 'react';
import {
  fetchCustomers,
  adminCancelSubscription,
  adminDeactivateAccount,
  fetchCustomerDetail,
} from './api.js';

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
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

function ActionButton({ children, onClick, variant = 'primary', disabled }) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';
  const styles =
    variant === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-500'
      : variant === 'secondary'
      ? 'border border-gurulink-primary text-gurulink-primary hover:bg-gurulink-bgSoft'
      : 'bg-gurulink-accent text-gurulink-primary hover:bg-gurulink-accentHover';

  return (
    <button className={`${base} ${styles}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export default function App() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workingEmail, setWorkingEmail] = useState('');
  const [filterText, setFilterText] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const showDetail = !!selectedEmail;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCustomers();
      setCustomers(data.customers || []);
    } catch (err) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const loadDetail = async (email) => {
    setSelectedEmail(email);
    setDetail(null);
    setDetailLoading(true);
    setError('');
    try {
      const data = await fetchCustomerDetail(email);
      setDetail(data);
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
      await load();
    } catch (err) {
      setError(err.message || 'Failed to cancel subscription');
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
    } catch (err) {
      setError(err.message || 'Failed to deactivate account');
    } finally {
      setWorkingEmail('');
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesText =
      !filterText ||
      c.email.toLowerCase().includes(filterText.toLowerCase()) ||
      (c.name || '').toLowerCase().includes(filterText.toLowerCase());
    const matchesActive = !showOnlyActive || c.is_active !== false;
    return matchesText && matchesActive;
  });

  return (
    <div className="min-h-screen bg-gurulink-bgLight">
      <header className="border-b border-gurulink-border bg-gurulink-bg shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gurulink-accent text-gurulink-primary flex items-center justify-center font-black text-lg">
              G
            </div>
            <div>
              <div className="text-base font-bold tracking-wide text-gurulink-primary">
                GuruLink CRM
              </div>
              <div className="text-xs text-gurulink-textSecondary">Customer & Subscription Management</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-gurulink-textSecondary">
            <span className="hidden sm:inline">Backend: /api/admin</span>
            <ActionButton variant="secondary" onClick={load} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </ActionButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        <section className="rounded-lg border border-gurulink-border bg-gurulink-bg shadow-lg">
          <div className="flex items-center justify-between border-b border-gurulink-border px-4 py-3 bg-gurulink-bgSoft">
            <div>
              <h2 className="text-base font-bold text-gurulink-primary">Customers</h2>
              <p className="text-xs text-gurulink-textSecondary">
                All signups from the shared GuruLink backend (signups table).
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gurulink-textSecondary">
              <div className="hidden sm:block">
                Total:{' '}
                <span className="font-semibold text-gurulink-accent">{customers.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter by email or name"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="hidden sm:block rounded-md border border-gurulink-border bg-white px-2 py-1 text-[11px] text-gurulink-text placeholder:text-gurulink-textMuted focus:outline-none focus:ring-1 focus:ring-gurulink-accent"
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
            <table className="min-w-full divide-y divide-gurulink-border text-xs">
              <thead className="bg-gurulink-bgSoft">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gurulink-primary">Email</th>
                  <th className="px-3 py-2 text-left font-semibold text-gurulink-primary">Name</th>
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
                    <td colSpan={5} className="px-3 py-6 text-center text-gurulink-textSecondary">
                      Loading customers…
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-gurulink-textMuted">
                      No customers found yet.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr
                      key={c.id}
                      className={`hover:bg-gurulink-bgSoft transition-colors cursor-pointer ${
                        selectedEmail === c.email ? 'bg-gurulink-bgSoft' : ''
                      }`}
                      onClick={() => loadDetail(c.email)}
                    >
                      <td className="px-3 py-2 align-top">
                        <div className="font-medium text-gurulink-primary">{c.email}</div>
                      </td>
                      <td className="px-3 py-2 align-top text-gurulink-text">
                        {c.name || <span className="text-gurulink-textMuted">—</span>}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <StatusBadge active={c.is_active !== false} />
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
                        <div className="flex justify-end gap-2">
                          <ActionButton
                            variant="secondary"
                            onClick={() => handleCancelSubscription(c.email)}
                            disabled={workingEmail === c.email}
                          >
                            Cancel Subscription
                          </ActionButton>
                          <ActionButton
                            variant="danger"
                            onClick={() => handleDeactivate(c.email)}
                            disabled={workingEmail === c.email || c.is_active === false}
                          >
                            Deactivate
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      {showDetail && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl p-4 sm:p-6 text-xs text-gurulink-text relative">
            <button
              onClick={() => {
                setSelectedEmail('');
                setDetail(null);
              }}
              className="absolute right-3 top-3 text-gurulink-textMuted hover:text-gurulink-text"
            >
              ✕
            </button>
            <h3 className="text-sm font-bold text-gurulink-primary mb-2">Customer Detail</h3>
            {detailLoading && <p className="text-gurulink-textSecondary">Loading…</p>}
            {!detailLoading && !detail && (
              <p className="text-gurulink-textMuted">Unable to load customer details.</p>
            )}
            {!detailLoading && detail && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="font-semibold text-gurulink-primary">
                    {detail.customer?.email}
                  </div>
                  {detail.customer?.name && (
                    <div className="text-gurulink-textSecondary">
                      Name: <span className="font-medium">{detail.customer.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gurulink-textSecondary">
                    <span>Status:</span>
                    <StatusBadge active={detail.customer?.is_active !== false} />
                  </div>
                </div>

                <div className="border-t border-gurulink-border pt-2 space-y-1">
                  <div className="text-[11px] font-semibold text-gurulink-primary">
                    Subscription
                  </div>
                  {!detail.subscription?.hasSubscription ? (
                    <div className="text-gurulink-textMuted">No subscription found.</div>
                  ) : (
                    <>
                      <div className="text-gurulink-textSecondary">
                        Status:{' '}
                        <span className="font-medium">
                          {detail.subscription.subscription?.status}
                        </span>
                      </div>
                      <div className="text-gurulink-textSecondary">
                        Current period:{' '}
                        {detail.subscription.subscription?.currentPeriodStart
                          ? new Date(
                              detail.subscription.subscription.currentPeriodStart
                            ).toLocaleDateString()
                          : '—'}{' '}
                        →{' '}
                        {detail.subscription.subscription?.currentPeriodEnd
                          ? new Date(
                              detail.subscription.subscription.currentPeriodEnd
                            ).toLocaleDateString()
                          : '—'}
                      </div>
                      <div className="text-gurulink-textSecondary">
                        Cancel at period end:{' '}
                        <span className="font-medium">
                          {detail.subscription.subscription?.cancelAtPeriodEnd ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {detail.subscription.paymentMethod?.card && (
                        <div className="text-gurulink-textSecondary">
                          Card:{' '}
                          <span className="font-medium">
                            {detail.subscription.paymentMethod.card.brand.toUpperCase()} ••••
                            {detail.subscription.paymentMethod.card.last4}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="border-t border-gurulink-border pt-2 space-y-1">
                  <div className="text-[11px] font-semibold text-gurulink-primary">
                    Recent invoices
                  </div>
                  {detail.subscription?.invoices?.length ? (
                    <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
                      {detail.subscription.invoices.map((inv) => (
                        <li key={inv.id} className="text-gurulink-textSecondary">
                          <span className="font-medium">
                            {inv.amount.toFixed(2)} {inv.currency.toUpperCase()}
                          </span>{' '}
                          • {inv.status}{' '}
                          <span className="text-gurulink-textMuted">
                            ({new Date(inv.created).toLocaleDateString()})
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gurulink-textMuted">No invoices found.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



