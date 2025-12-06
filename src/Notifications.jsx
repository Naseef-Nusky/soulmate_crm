import { useState, useEffect } from 'react';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './api.js';

export default function Notifications({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    // Refresh every 10 seconds for real-time updates
    const interval = setInterval(() => {
      loadNotifications();
      loadUnreadCount();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications({ limit: 50 });
      if (data.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const data = await getUnreadNotificationCount();
      if (data.ok) {
        setUnreadCount(data.count || 0);
      }
    } catch (err) {
      // Silently fail for unread count
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_signup':
        return '👤';
      case 'subscription_cancelled':
        return '❌';
      case 'subscription_reactivated':
        return '✅';
      case 'account_deactivated':
        return '🔒';
      case 'account_activated':
        return '🔓';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new_signup':
        return 'bg-green-50 border-green-200';
      case 'subscription_cancelled':
        return 'bg-red-50 border-red-200';
      case 'subscription_reactivated':
        return 'bg-green-50 border-green-200';
      case 'account_deactivated':
        return 'bg-orange-50 border-orange-200';
      case 'account_activated':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gurulink-border px-6 py-4 bg-gurulink-bgSoft flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gurulink-primary">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-sm text-gurulink-textSecondary">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-gurulink-primary hover:text-gurulink-accent transition-colors"
              >
                Mark all as read
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gurulink-textSecondary hover:text-gurulink-primary transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="text-center py-8 text-gurulink-textSecondary">Loading notifications...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gurulink-textMuted">
              No notifications yet
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-lg border p-4 transition-colors cursor-pointer ${
                    notification.is_read
                      ? 'bg-white border-gurulink-border'
                      : `${getNotificationColor(notification.type)} border-2 font-semibold`
                  }`}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-semibold text-gurulink-primary">
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span className="h-2 w-2 rounded-full bg-gurulink-accent flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                      <p className="text-sm text-gurulink-text mt-1">{notification.message}</p>
                      <p className="text-xs text-gurulink-textMuted mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

