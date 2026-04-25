import axios from "axios";

const API = "http://localhost:8081/api/notifications";

export interface NotificationItem {
  id: number;
  userId: number;
  message: string;
  type: "BOOKING" | "TICKET" | "COMMENT" | string;
  referenceId: number | null;
  read: boolean;
  createdAt: string;
}

interface NotificationApiModel {
  id: number;
  userId?: number;
  user_id?: number;
  message: string;
  type: string;
  referenceId?: number | null;
  reference_id?: number | null;
  read?: boolean;
  isRead?: boolean;
  createdAt?: string;
  created_at?: string;
}

const normalizeNotification = (raw: NotificationApiModel): NotificationItem => ({
  id: raw.id,
  userId: raw.userId ?? raw.user_id ?? 0,
  message: raw.message,
  type: raw.type,
  referenceId: raw.referenceId ?? raw.reference_id ?? null,
  read: Boolean(raw.read ?? raw.isRead ?? false),
  createdAt: raw.createdAt ?? raw.created_at ?? "",
});

export const getNotifications = async (userId: number): Promise<NotificationItem[]> => {
  const response = await axios.get<NotificationApiModel[]>(`${API}/${userId}`);
  return (response.data || [])
    .map(normalizeNotification)
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
};

export const markAsRead = async (notificationId: number): Promise<NotificationItem> => {
  const response = await axios.put<NotificationApiModel>(`${API}/${notificationId}/read`);
  return normalizeNotification(response.data);
};
