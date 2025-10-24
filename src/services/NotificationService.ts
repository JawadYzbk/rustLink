import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '../hooks/use-toast';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'server_pairing' | 'entity_pairing' | 'team_message' | 'player_death' | 'player_login' | 'smart_alarm' | 'entity_changed' | 'server_info';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number; // Auto-dismiss after this many milliseconds
  persistent?: boolean; // Don't auto-dismiss
  actions?: NotificationAction[];
  data?: any; // Additional data for the notification
  read?: boolean; // Track read status for Rust+ notifications
}

export interface NotificationAction {
  id: string;
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface NotificationSettings {
  enabled: boolean;
  showTeamMessages: boolean;
  showEntityChanges: boolean;
  showServerEvents: boolean;
  showConnectionStatus: boolean;
  playSound: boolean;
  soundVolume: number;
}

export class NotificationService extends EventEmitter {
  private notifications: Notification[] = [];
  private settings: NotificationSettings = {
    enabled: true,
    showTeamMessages: true,
    showEntityChanges: true,
    showServerEvents: true,
    showConnectionStatus: true,
    playSound: true,
    soundVolume: 0.5
  };

  constructor() {
    super();
    this.loadSettings();
    this.loadNotifications();
  }

  /**
   * Add a new notification
   */
  addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): string {
    if (!this.settings.enabled) {
      return '';
    }

    const id = uuidv4();
    const newNotification: Notification = {
      id,
      timestamp: new Date(),
      duration: notification.persistent ? undefined : (notification.duration || 5000),
      ...notification
    };

    this.notifications.unshift(newNotification);
    console.log('NotificationService: Added notification:', newNotification);
    console.log('NotificationService: Total notifications now:', this.notifications.length);
    this.emit('notificationAdded', newNotification);

    // Show toast notification
    this.showToastNotification(newNotification);

    // Save notifications to localStorage
    this.saveNotifications();

    // Auto-dismiss if duration is set
    if (newNotification.duration) {
      setTimeout(() => {
        this.removeNotification(id);
      }, newNotification.duration);
    }

    // Play sound if enabled
    if (this.settings.playSound) {
      this.playNotificationSound();
    }

    return id;
  }

  /**
   * Remove a notification by ID
   */
  removeNotification(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      const notification = this.notifications.splice(index, 1)[0];
      this.emit('notificationRemoved', notification);
      this.saveNotifications();
    }
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    const removed = [...this.notifications];
    this.notifications = [];
    this.emit('notificationsCleared', removed);
    this.saveNotifications();
  }

  /**
   * Get all notifications
   */
  getNotifications(): Notification[] {
    console.log('NotificationService: getNotifications called, returning', this.notifications.length, 'notifications');
    return [...this.notifications];
  }

  /**
   * Get notification by ID
   */
  getNotification(id: string): Notification | undefined {
    return this.notifications.find(n => n.id === id);
  }

  /**
   * Update notification settings
   */
  updateSettings(settings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.saveSettings();
    this.emit('settingsUpdated', this.settings);
  }

  /**
   * Get current settings
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Show team message notification
   */
  showTeamMessage(sender: string, message: string, steamId?: string): void {
    if (!this.settings.showTeamMessages) return;

    this.addNotification({
      type: 'info',
      title: 'Team Message',
      message: `${sender}: ${message}`,
      duration: 8000,
      data: { sender, message, steamId, type: 'teamMessage' }
    });
  }

  /**
   * Show entity change notification
   */
  showEntityChange(entityId: number, entityType: string, newValue: any, oldValue?: any): void {
    if (!this.settings.showEntityChanges) return;

    let message = '';
    let type: Notification['type'] = 'info';

    switch (entityType.toLowerCase()) {
      case 'smart switch':
        message = `Smart Switch ${entityId} turned ${newValue ? 'ON' : 'OFF'}`;
        type = newValue ? 'success' : 'warning';
        break;
      case 'smart alarm':
        message = `Smart Alarm ${entityId} ${newValue ? 'triggered' : 'reset'}`;
        type = newValue ? 'warning' : 'success';
        break;
      case 'storage monitor':
        if (typeof newValue === 'number') {
          message = `Storage Monitor ${entityId}: ${newValue} items`;
        } else {
          message = `Storage Monitor ${entityId} updated`;
        }
        break;
      default:
        message = `Entity ${entityId} (${entityType}) changed`;
    }

    this.addNotification({
      type,
      title: 'Entity Update',
      message,
      duration: 6000,
      data: { entityId, entityType, newValue, oldValue, type: 'entityChange' }
    });
  }

  /**
   * Show server connection notification
   */
  showConnectionStatus(status: 'connected' | 'disconnected' | 'error', serverName?: string): void {
    if (!this.settings.showConnectionStatus) return;

    let message = '';
    let type: Notification['type'] = 'info';

    switch (status) {
      case 'connected':
        message = `Connected to ${serverName || 'server'}`;
        type = 'success';
        break;
      case 'disconnected':
        message = `Disconnected from ${serverName || 'server'}`;
        type = 'warning';
        break;
      case 'error':
        message = `Connection error with ${serverName || 'server'}`;
        type = 'error';
        break;
    }

    this.addNotification({
      type,
      title: 'Connection Status',
      message,
      duration: status === 'error' ? 10000 : 5000,
      persistent: status === 'error',
      data: { status, serverName, type: 'connectionStatus' }
    });
  }

  /**
   * Show server event notification
   */
  showServerEvent(event: string, details?: string): void {
    if (!this.settings.showServerEvents) return;

    this.addNotification({
      type: 'info',
      title: 'Server Event',
      message: details ? `${event}: ${details}` : event,
      duration: 7000,
      data: { event, details, type: 'serverEvent' }
    });
  }

  /**
   * Show error notification
   */
  showError(title: string, message: string, persistent = false): void {
    this.addNotification({
      type: 'error',
      title,
      message,
      persistent,
      duration: persistent ? undefined : 10000,
      data: { type: 'error' }
    });
  }

  /**
   * Show success notification
   */
  showSuccess(title: string, message: string): void {
    this.addNotification({
      type: 'success',
      title,
      message,
      duration: 4000,
      data: { type: 'success' }
    });
  }

  /**
   * Show warning notification
   */
  showWarning(title: string, message: string): void {
    this.addNotification({
      type: 'warning',
      title,
      message,
      duration: 6000,
      data: { type: 'warning' }
    });
  }

  /**
   * Show info notification
   */
  showInfo(title: string, message: string): void {
    this.addNotification({
      type: 'info',
      title,
      message,
      duration: 5000,
      data: { type: 'info' }
    });
  }

  /**
   * Create notification with custom actions
   */
  showActionNotification(
    title: string,
    message: string,
    actions: NotificationAction[],
    type: Notification['type'] = 'info'
  ): string {
    return this.addNotification({
      type,
      title,
      message,
      actions,
      persistent: true,
      data: { type: 'action' }
    });
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.settings.soundVolume * 0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      // Silently fail if audio is not supported
      console.warn('Could not play notification sound:', error);
    }
  }

  /**
   * Create a server pairing notification
   */
  createServerPairingNotification(data: {
    serverName: string;
    ip: string;
    port: string;
    playerId: string;
    playerToken: string;
    description?: string;
  }): Notification {
    return this.addNotification({
      type: 'server_pairing',
      title: 'Server Pairing Request',
      message: `Pair with server: ${data.serverName}`,
      persistent: true,
      data,
      read: false
    });
  }

  /**
   * Create an entity pairing notification
   */
  createEntityPairingNotification(data: {
    entityId: number;
    entityType: string;
    entityName?: string;
    description?: string;
  }): Notification {
    return this.addNotification({
      type: 'entity_pairing',
      title: 'Smart Device Pairing',
      message: `Pair with ${data.entityType}: ${data.entityName || `ID ${data.entityId}`}`,
      persistent: true,
      data,
      read: false
    });
  }

  /**
   * Create a team message notification
   */
  createTeamMessageNotification(data: {
    steamId: string;
    name: string;
    message: string;
    color: string;
  }): Notification {
    if (!this.settings.showTeamMessages) return null;
    
    return this.addNotification({
      type: 'team_message',
      title: 'Team Message',
      message: `${data.name}: ${data.message}`,
      duration: 5000,
      data,
      read: false
    });
  }

  /**
   * Create a player death notification
   */
  createPlayerDeathNotification(data: {
    steamId: string;
    name: string;
    killer?: string;
    weapon?: string;
  }): Notification {
    const killerText = data.killer ? ` by ${data.killer}` : '';
    const weaponText = data.weapon ? ` with ${data.weapon}` : '';
    
    return this.addNotification({
      type: 'player_death',
      title: 'Player Death',
      message: `${data.name} died${killerText}${weaponText}`,
      duration: 8000,
      data,
      read: false
    });
  }

  /**
   * Create a player login/logout notification
   */
  createPlayerLoginNotification(data: {
    steamId: string;
    name: string;
    isOnline: boolean;
  }): Notification {
    return this.addNotification({
      type: 'player_login',
      title: data.isOnline ? 'Player Online' : 'Player Offline',
      message: `${data.name} ${data.isOnline ? 'came online' : 'went offline'}`,
      duration: 5000,
      data,
      read: false
    });
  }

  /**
   * Create a smart alarm notification
   */
  createSmartAlarmNotification(data: {
    entityId: number;
    entityName?: string;
    alarmType: string;
    message: string;
  }): Notification {
    return this.addNotification({
      type: 'smart_alarm',
      title: 'Smart Alarm',
      message: `${data.entityName || `Device ${data.entityId}`}: ${data.message}`,
      duration: 10000,
      data,
      read: false
    });
  }

  /**
   * Create an entity changed notification
   */
  createEntityChangedNotification(data: {
    entityId: number;
    entityType: string;
    value: any;
    capacity?: number;
    hasProtection?: boolean;
  }): Notification {
    if (!this.settings.showEntityChanges) return null;
    
    return this.addNotification({
      type: 'entity_changed',
      title: 'Device Status Changed',
      message: `${data.entityType} ${data.entityId} updated`,
      duration: 3000,
      data,
      read: false
    });
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && notification.read === false) {
      notification.read = true;
      this.emit('notificationRead', notification);
      this.saveNotifications();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      if (notification.read === false) {
        notification.read = true;
      }
    });
    this.emit('allNotificationsRead');
    this.saveNotifications();
  }

  /**
   * Get unread notifications count
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => n.read === false).length;
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('rustlink-notification-settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Could not load notification settings:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('rustlink-notification-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Could not save notification settings:', error);
    }
  }

  /**
   * Load notifications from localStorage
   */
  private loadNotifications(): void {
    try {
      const saved = localStorage.getItem('rustlink-notifications');
      console.log('NotificationService: Loading notifications from localStorage:', saved);
      if (saved) {
        const notifications = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        this.notifications = notifications.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        console.log('NotificationService: Loaded', this.notifications.length, 'notifications:', this.notifications);
      } else {
        console.log('NotificationService: No saved notifications found');
      }
    } catch (error) {
      console.warn('Could not load notifications:', error);
      this.notifications = [];
    }
  }

  /**
   * Save notifications to localStorage
   */
  private saveNotifications(): void {
    try {
      // Only save persistent notifications and recent non-persistent ones (last 50)
      const toSave = this.notifications
        .filter(n => n.persistent || this.notifications.indexOf(n) < 50)
        .slice(0, 100); // Limit to 100 notifications max
      
      localStorage.setItem('rustlink-notifications', JSON.stringify(toSave));
    } catch (error) {
      console.warn('Could not save notifications:', error);
    }
  }

  /**
   * Show toast notification for new notifications
   */
  private showToastNotification(notification: Notification): void {
    // Get appropriate icon based on notification type
    const getToastIcon = (type: string) => {
      switch (type) {
        case 'alarm': return '🚨';
        case 'cargo': return '🚢';
        case 'chinook': return '🚁';
        case 'patrol': return '🚁';
        case 'bradley': return '🤖';
        case 'team': return '👥';
        case 'smart': return '💡';
        case 'storage': return '📦';
        case 'player': return '👤';
        case 'server': return '🖥️';
        default: return '🔔';
      }
    };

    const icon = getToastIcon(notification.type);
    
    toast({
      title: `${icon} ${notification.title}`,
      description: notification.message,
      duration: notification.persistent ? undefined : (notification.duration || 5000),
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Make notificationService available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).notificationService = notificationService;
}