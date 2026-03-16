import { create } from "zustand";
import api from "@/lib/api";
import { Notification } from "@/lib/types";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/notifications");
      set({
        notifications: data.notifications,
        unreadCount: data.unreadCount,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    await api.patch(`/notifications/${id}/read`);
    const { notifications } = get();
    set({
      notifications: notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, get().unreadCount - 1),
    });
  },

  markAllAsRead: async () => {
    await api.patch("/notifications/read-all");
    const { notifications } = get();
    set({
      notifications: notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    });
  },

  deleteNotification: async (id) => {
    await api.delete(`/notifications/${id}`);
    const { notifications } = get();
    const deleted = notifications.find((n) => n._id === id);
    set({
      notifications: notifications.filter((n) => n._id !== id),
      unreadCount: deleted && !deleted.isRead ? get().unreadCount - 1 : get().unreadCount,
    });
  },
}));
