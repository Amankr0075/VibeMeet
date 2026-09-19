import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Megaphone, CheckCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../config/api';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'BROADCAST' | 'SYSTEM' | 'ACCOUNT';
  isRead: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  socket?: { on: (event: string, cb: () => void) => void; off: (event: string) => void } | null;
}

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const NotificationBell: React.FC<NotificationBellProps> = ({ socket }) => {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/notifications'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen for real-time broadcast events
  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      fetchNotifications();
    };
    socket.on('new_notification', handler);
    return () => {
      socket.off('new_notification');
    };
  }, [socket, fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      await fetch(apiUrl('/api/notifications/all/read'), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const markOneAsRead = async (id: string) => {
    if (!token) return;
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    try {
      await fetch(apiUrl(`/api/notifications/${id}/read`), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
        className="relative p-2 rounded-xl transition-all duration-200"
        style={{ background: open ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-300" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white animate-pulse"
            style={{ background: 'linear-gradient(135deg,#ec4899,#8b5cf6)', boxShadow: '0 0 10px rgba(236,72,153,0.6)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden shadow-2xl z-50"
          style={{
            background: 'linear-gradient(180deg, rgba(15,18,35,0.98), rgba(10,12,22,0.99))',
            border: '1px solid rgba(139,92,246,0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(139,92,246,0.1)',
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.07]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-bold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black text-white" style={{ background: 'linear-gradient(135deg,#ec4899,#8b5cf6)' }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} title="Mark all as read"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors" >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-8 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => (
                <button
                  key={notif._id}
                  onClick={() => markOneAsRead(notif._id)}
                  className="w-full text-left px-4 py-3.5 flex items-start gap-3 transition-all hover:bg-white/[0.03] border-b border-white/[0.04] last:border-b-0"
                >
                  {/* Icon */}
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: notif.type === 'BROADCAST'
                        ? 'linear-gradient(135deg,#0ea5e9,#6366f1)'
                        : 'linear-gradient(135deg,#ec4899,#8b5cf6)',
                      opacity: notif.isRead ? 0.5 : 1
                    }}
                  >
                    <Megaphone className="w-4 h-4 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${notif.isRead ? 'text-slate-400' : 'text-white'}`}>
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-slate-600 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>

                  {/* Unread dot */}
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: '#ec4899', boxShadow: '0 0 6px #ec4899' }} />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
