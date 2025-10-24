import React, { useState, useEffect } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from './ui/sheet';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Bell, 
  Filter, 
  Trash2, 
  CheckCircle, 
  Circle, 
  Server, 
  Zap, 
  MessageSquare, 
  Skull, 
  AlertTriangle,
  Settings,
  X
} from 'lucide-react';
import { notificationService } from '../services/NotificationService';
import type { Notification } from '../types/notifications';

interface NotificationSheetProps {
  children: React.ReactNode;
}

const NotificationSheet: React.FC<NotificationSheetProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Load notifications on component mount and when sheet opens
  useEffect(() => {
    const loadNotifications = () => {
      const allNotifications = notificationService.getNotifications();
      console.log('NotificationSheet: Loading notifications, got', allNotifications.length, 'notifications');
      setNotifications(allNotifications);
      setUnreadCount(notificationService.getUnreadCount());
    };

    loadNotifications();

    // Listen for notification changes
    const handleNotificationAdded = () => loadNotifications();
    const handleNotificationUpdated = () => loadNotifications();
    const handleNotificationRemoved = () => loadNotifications();
    const handleNotificationsCleared = () => loadNotifications();
    const handleNotificationRead = () => loadNotifications();
    const handleAllNotificationsRead = () => loadNotifications();

    notificationService.on('notificationAdded', handleNotificationAdded);
    notificationService.on('notificationUpdated', handleNotificationUpdated);
    notificationService.on('notificationRemoved', handleNotificationRemoved);
    notificationService.on('notificationsCleared', handleNotificationsCleared);
    notificationService.on('notificationRead', handleNotificationRead);
    notificationService.on('allNotificationsRead', handleAllNotificationsRead);

    return () => {
      notificationService.off('notificationAdded', handleNotificationAdded);
      notificationService.off('notificationUpdated', handleNotificationUpdated);
      notificationService.off('notificationRemoved', handleNotificationRemoved);
      notificationService.off('notificationsCleared', handleNotificationsCleared);
      notificationService.off('notificationRead', handleNotificationRead);
      notificationService.off('allNotificationsRead', handleAllNotificationsRead);
    };
  }, []);

  // Filter notifications based on selected filter
  useEffect(() => {
    console.log('NotificationSheet: Filtering notifications, total:', notifications.length, 'filter:', selectedFilter);
    let filtered = notifications;

    switch (selectedFilter) {
      case 'unread':
        filtered = notifications.filter(n => !n.read);
        break;
      case 'server_pairing':
        filtered = notifications.filter(n => n.type === 'server_pairing');
        break;
      case 'entity_pairing':
        filtered = notifications.filter(n => n.type === 'entity_pairing');
        break;
      case 'team_message':
        filtered = notifications.filter(n => n.type === 'team_message');
        break;
      case 'player_death':
        filtered = notifications.filter(n => n.type === 'player_death');
        break;
      case 'smart_alarm':
        filtered = notifications.filter(n => n.type === 'smart_alarm');
        break;
      case 'entity_changed':
        filtered = notifications.filter(n => n.type === 'entity_changed');
        break;
      default:
        filtered = notifications;
    }

    console.log('NotificationSheet: Filtered notifications:', filtered.length, 'notifications');
    setFilteredNotifications(filtered);
  }, [notifications, selectedFilter]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'server_pairing':
        return <Server className="h-5 w-5 text-blue-400" />;
      case 'entity_pairing':
        return <Zap className="h-5 w-5 text-yellow-400" />;
      case 'team_message':
        return <MessageSquare className="h-5 w-5 text-purple-400" />;
      case 'player_death':
        return <Skull className="h-5 w-5 text-red-400" />;
      case 'smart_alarm':
        return <AlertTriangle className="h-5 w-5 text-orange-400" />;
      case 'entity_changed':
        return <Settings className="h-5 w-5 text-green-400" />;
      default:
        return <Bell className="h-5 w-5 text-gray-400" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'server_pairing':
        return 'Server Pairing';
      case 'entity_pairing':
        return 'Device Pairing';
      case 'team_message':
        return 'Team Message';
      case 'player_death':
        return 'Player Death';
      case 'smart_alarm':
        return 'Smart Alarm';
      case 'entity_changed':
        return 'Device Update';
      default:
        return 'Notification';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleMarkAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleRemoveNotification = (notificationId: string) => {
    notificationService.removeNotification(notificationId);
  };

  const handleClearAll = () => {
    notificationService.clearAllNotifications();
  };

  const filterOptions = [
    { value: 'all', label: 'All', count: notifications.length },
    { value: 'unread', label: 'Unread', count: notifications.filter(n => !n.read).length },
    { value: 'server_pairing', label: 'Server Pairing', count: notifications.filter(n => n.type === 'server_pairing').length },
    { value: 'entity_pairing', label: 'Device Pairing', count: notifications.filter(n => n.type === 'entity_pairing').length },
    { value: 'team_message', label: 'Team Messages', count: notifications.filter(n => n.type === 'team_message').length },
    { value: 'player_death', label: 'Player Deaths', count: notifications.filter(n => n.type === 'player_death').length },
    { value: 'smart_alarm', label: 'Smart Alarms', count: notifications.filter(n => n.type === 'smart_alarm').length },
    { value: 'entity_changed', label: 'Device Updates', count: notifications.filter(n => n.type === 'entity_changed').length },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className="w-[500px] bg-gray-900 border-gray-700">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-white">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription className="text-gray-400">
            Manage your Rust+ notifications and alerts
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Filter Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Filter by type</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedFilter === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(option.value)}
                  className={`justify-between text-xs ${
                    selectedFilter === option.value 
                      ? "bg-orange-600 hover:bg-orange-700 text-white" 
                      : "border-gray-600 text-gray-300 hover:bg-gray-700"
                  }`}
                  disabled={option.count === 0}
                >
                  <span>{option.label}</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {option.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          {notifications.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                disabled={unreadCount === 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          )}

          {/* Notifications List */}
          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  {selectedFilter === 'all' ? 'No notifications' : `No ${selectedFilter.replace('_', ' ')} notifications`}
                </p>
                <p className="text-xs mt-1">You're all caught up!</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    !notification.read 
                      ? 'bg-gray-800 border-gray-600' 
                      : 'bg-gray-850 border-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-white truncate">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <Circle className="h-2 w-2 text-blue-400 fill-current" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveNotification(notification.id)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-300 mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {getNotificationTypeLabel(notification.type)}
                        </Badge>
                        
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs text-gray-400 hover:text-white h-6 px-2"
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationSheet;