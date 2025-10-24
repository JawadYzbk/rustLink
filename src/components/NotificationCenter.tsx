import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/NotificationService';
import NotificationSheet from './NotificationSheet';
import { Button } from './ui/button';
import { Bell } from 'lucide-react';

const NotificationCenter: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateUnreadCount = () => {
      setUnreadCount(notificationService.getUnreadCount());
    };

    // Initial load
    updateUnreadCount();

    // Listen for notification changes
    const handleNotificationAdded = () => updateUnreadCount();
    const handleNotificationRemoved = () => updateUnreadCount();
    const handleNotificationsCleared = () => updateUnreadCount();
    const handleNotificationRead = () => updateUnreadCount();
    const handleAllNotificationsRead = () => updateUnreadCount();

    notificationService.on('notificationAdded', handleNotificationAdded);
    notificationService.on('notificationRemoved', handleNotificationRemoved);
    notificationService.on('notificationsCleared', handleNotificationsCleared);
    notificationService.on('notificationRead', handleNotificationRead);
    notificationService.on('allNotificationsRead', handleAllNotificationsRead);

    return () => {
      notificationService.off('notificationAdded', handleNotificationAdded);
      notificationService.off('notificationRemoved', handleNotificationRemoved);
      notificationService.off('notificationsCleared', handleNotificationsCleared);
      notificationService.off('notificationRead', handleNotificationRead);
      notificationService.off('allNotificationsRead', handleAllNotificationsRead);
    };
  }, []);

  return (
    <NotificationSheet>
      <Button
        variant="ghost"
        size="sm"
        className="relative text-gray-400 hover:text-white transition-colors"
      >
        <Bell className="h-5 w-5" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
    </NotificationSheet>
  );
};

export default NotificationCenter;