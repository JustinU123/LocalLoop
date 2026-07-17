import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  NOTIFICATION_GROUP_ORDER,
  NOTIFICATION_GROUP_LABELS,
  PLACEHOLDER_NOTIFICATIONS,
  type AppNotification,
  type NotificationGroup,
} from '@/data/notifications';

export type NotificationSection = {
  title: string;
  group: NotificationGroup;
  data: AppNotification[];
};

type NotificationsContextValue = {
  notifications: AppNotification[];
  sections: NotificationSection[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(
    () => PLACEHOLDER_NOTIFICATIONS.map((notification) => ({ ...notification })),
  );

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const sections = useMemo(() => {
    return NOTIFICATION_GROUP_ORDER.map((group) => ({
      title: NOTIFICATION_GROUP_LABELS[group],
      group,
      data: notifications.filter((notification) => notification.group === group),
    })).filter((section) => section.data.length > 0);
  }, [notifications]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      sections,
      unreadCount,
      markAsRead,
      markAllAsRead,
    }),
    [notifications, sections, unreadCount, markAsRead, markAllAsRead],
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
}
