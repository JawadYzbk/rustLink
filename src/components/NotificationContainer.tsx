import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { notificationService, Notification } from '../services/NotificationService';
import { Button } from './ui/button';

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRemove }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'info':
      default:
        return 'border-l-blue-500';
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-900/20';
    }
  };

  return (
    <div
      className={`
        relative p-4 mb-3 rounded-lg border-l-4 shadow-sm transition-all duration-300 ease-in-out
        ${getBorderColor()} ${getBackgroundColor()}
        animate-in slide-in-from-right-full duration-300
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {notification.title}
          </h4>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            {notification.message}
          </p>
          
          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {notification.actions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.style === 'danger' ? 'destructive' : action.style === 'primary' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    action.action();
                    if (!notification.persistent) {
                      onRemove(notification.id);
                    }
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={() => onRemove(notification.id)}
          className="flex-shrink-0 ml-3 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
      
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {notification.timestamp.toLocaleTimeString()}
      </div>
    </div>
  );
};

export const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Load initial notifications
    setNotifications(notificationService.getNotifications());

    // Listen for notification events
    const handleNotificationAdded = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setIsVisible(true);
    };

    const handleNotificationRemoved = (notification: Notification) => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    };

    const handleNotificationsCleared = () => {
      setNotifications([]);
    };

    notificationService.on('notificationAdded', handleNotificationAdded);
    notificationService.on('notificationRemoved', handleNotificationRemoved);
    notificationService.on('notificationsCleared', handleNotificationsCleared);

    return () => {
      notificationService.off('notificationAdded', handleNotificationAdded);
      notificationService.off('notificationRemoved', handleNotificationRemoved);
      notificationService.off('notificationsCleared', handleNotificationsCleared);
    };
  }, []);

  useEffect(() => {
    // Auto-hide container when no notifications
    if (notifications.length === 0) {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [notifications.length]);

  const handleRemoveNotification = (id: string) => {
    notificationService.removeNotification(id);
  };

  const handleClearAll = () => {
    notificationService.clearAllNotifications();
  };

  if (!isVisible && notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      {notifications.length > 0 && (
        <div className="mb-3 flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Notifications ({notifications.length})
          </h3>
          {notifications.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
      )}
      
      <div className="max-h-[80vh] overflow-y-auto space-y-0">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={handleRemoveNotification}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationContainer;