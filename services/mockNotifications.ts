export type MockNotificationKind = 'order' | 'assignment' | 'system';

export interface MockNotification {
  id: string;
  kind: MockNotificationKind;
  title: string;
  detail: string;
  timeAgo: string;
  href: string;
  unread: boolean;
}

export const mockNotifications: MockNotification[] = [
  {
    id: 'notice-order-1048',
    kind: 'order',
    title: 'Order is running late',
    detail: 'ORD-001234 · Downtown route',
    timeAgo: '8 min ago',
    href: '/orders',
    unread: true,
  },
  {
    id: 'notice-assignment-2037',
    kind: 'assignment',
    title: 'Assignment accepted',
    detail: 'EMP002 accepted a new delivery',
    timeAgo: '24 min ago',
    href: '/assignments',
    unread: true,
  },
  {
    id: 'notice-system-1',
    kind: 'system',
    title: 'Daily report is ready',
    detail: 'Operations summary for today',
    timeAgo: '1 hr ago',
    href: '/reports',
    unread: false,
  },
];