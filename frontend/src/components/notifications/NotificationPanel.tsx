import React from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { NotificationItem } from "../../services/notificationService";

interface NotificationPanelProps {
  notifications: NotificationItem[];
  loading: boolean;
  onMarkAsRead: (notificationId: number) => Promise<void>;
  onClose: () => void;
}

const formatDateTime = (value: string): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  loading,
  onMarkAsRead,
  onClose,
}) => {
  const navigate = useNavigate();

  const getNotificationPath = (notification: NotificationItem): string | null => {
    if (notification.referenceId == null) {
      return null;
    }

    if (notification.type === "TICKET" || notification.type === "COMMENT") {
      return `/ticket/${notification.referenceId}`;
    }

    if (notification.type === "BOOKING") {
      // Current app has booking list route but no dedicated booking details route yet.
      return `/my-bookings?bookingId=${notification.referenceId}`;
    }

    return null;
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    try {
      await onMarkAsRead(notification.id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }

    onClose();

    const targetPath = getNotificationPath(notification);
    if (!targetPath) {
      return;
    }

    window.setTimeout(() => {
      navigate(targetPath);
    }, 150);
  };

  return (
    <div className="absolute right-0 mt-3 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-xl z-50">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Notifications</h3>
        <span className="text-xs text-slate-500">{notifications.length} total</span>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {loading ? (
          <div className="p-4 text-sm text-slate-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => void handleNotificationClick(notification)}
              className={`w-full text-left px-4 py-3 border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                notification.read ? "bg-white" : "bg-blue-50/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`text-sm ${notification.read ? "text-slate-700" : "text-slate-900 font-medium"}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDateTime(notification.createdAt) || "Just now"}
                  </p>
                </div>
                {!notification.read && (
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
