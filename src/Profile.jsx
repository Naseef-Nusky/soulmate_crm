import { useState, useEffect } from 'react';
import { getAdminUser } from './auth.js';
import { listAdminUsers } from './api.js';

export default function Profile({ admin }) {
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listAdminUsers();
      if (data.ok) {
        setAdminUsers(data.users || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const currentUser = adminUsers.find((u) => u.id === admin?.id) || admin;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gurulink-border bg-gurulink-bg shadow-lg">
        <div className="border-b border-gurulink-border px-6 py-4 bg-gurulink-bgSoft">
          <h2 className="text-lg font-bold text-gurulink-primary">My Profile</h2>
          <p className="text-sm text-gurulink-textSecondary">Your account information</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gurulink-textSecondary mb-1">
                User ID
              </label>
              <div className="text-base font-mono text-gurulink-primary bg-gurulink-bgSoft px-3 py-2 rounded border border-gurulink-border">
                {currentUser?.id || '—'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gurulink-textSecondary mb-1">
                Username
              </label>
              <div className="text-base font-semibold text-gurulink-primary bg-gurulink-bgSoft px-3 py-2 rounded border border-gurulink-border">
                {currentUser?.username || '—'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gurulink-textSecondary mb-1">
                Role
              </label>
              <div className="text-base">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gurulink-accent/20 text-gurulink-accent border border-gurulink-accent/30">
                  {currentUser?.role || 'admin'}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gurulink-textSecondary mb-1">
                Account Created
              </label>
              <div className="text-base text-gurulink-text bg-gurulink-bgSoft px-3 py-2 rounded border border-gurulink-border">
                {currentUser?.created_at
                  ? new Date(currentUser.created_at).toLocaleString()
                  : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {(admin?.role === 'admin' || !admin?.role) && (
        <div className="rounded-lg border border-gurulink-border bg-gurulink-bg shadow-lg">
          <div className="border-b border-gurulink-border px-6 py-4 bg-gurulink-bgSoft">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gurulink-primary">All Admin Users</h2>
                <p className="text-sm text-gurulink-textSecondary">List of all admin accounts</p>
              </div>
              <button
                onClick={loadUsers}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed border border-gurulink-primary text-gurulink-primary hover:bg-gurulink-bgSoft"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          {loading ? (
            <div className="text-center py-8 text-gurulink-textSecondary">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gurulink-border text-sm">
                <thead className="bg-gurulink-bgSoft">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gurulink-primary">ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-gurulink-primary">
                      Username
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gurulink-primary">Role</th>
                    <th className="px-4 py-3 text-left font-semibold text-gurulink-primary">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gurulink-primary">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gurulink-border bg-gurulink-bg">
                  {adminUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gurulink-textMuted">
                        No admin users found
                      </td>
                    </tr>
                  ) : (
                    adminUsers.map((user) => (
                      <tr
                        key={user.id}
                        className={user.id === admin?.id ? 'bg-gurulink-accent/5' : ''}
                      >
                        <td className="px-4 py-3 font-mono text-gurulink-primary">{user.id}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gurulink-primary">
                              {user.username}
                            </span>
                            {user.id === admin?.id && (
                              <span className="text-xs px-2 py-0.5 rounded bg-gurulink-accent/20 text-gurulink-accent border border-gurulink-accent/30">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-gurulink-accent/20 text-gurulink-accent border border-gurulink-accent/30">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold ${
                              user.is_active !== false
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {user.is_active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gurulink-textSecondary">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString()
                            : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

