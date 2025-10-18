const ElectronStore = new (require('electron-store'))();

const KEY_NOTIFICATIONS = 'notifications';
const KEY_SERVER_NOTIFICATIONS = 'server_notifications'; // New key for server-specific notifications
const KEY_LAST_NOTIFICATION_TIMESTAMP = 'last_notification_timestamp';

class NotificationDataStore {

    static getNotifications() {
        return ElectronStore.get(KEY_NOTIFICATIONS, []);
    }

    static setNotifications(notifications) {
        ElectronStore.set(KEY_NOTIFICATIONS, notifications);
    }

    // New method to get notifications for a specific server
    static getServerNotifications(serverId) {
        if (!serverId) return [];
        const serverNotifications = ElectronStore.get(KEY_SERVER_NOTIFICATIONS, {});
        return serverNotifications[serverId] || [];
    }

    // New method to set notifications for a specific server
    static setServerNotifications(serverId, notifications) {
        if (!serverId) return;
        const serverNotifications = ElectronStore.get(KEY_SERVER_NOTIFICATIONS, {});
        serverNotifications[serverId] = notifications;
        ElectronStore.set(KEY_SERVER_NOTIFICATIONS, serverNotifications);
    }

    // New method to add notification to a specific server
    static addServerNotification(serverId, notification) {
        if (!serverId) {
            // Fallback to global notifications if no server ID
            return this.addNotification(notification);
        }
        
        // get existing server notifications
        var notifications = this.getServerNotifications(serverId);
        
        // add timestamp if not present
        if (!notification.timestamp) {
            notification.timestamp = new Date().toISOString();
        }
        
        // add server ID to notification
        notification.serverId = serverId;
        
        // add new notification to beginning (newest first)
        notifications.unshift(notification);
        
        // keep only last 50 notifications per server
        if (notifications.length > 50) {
            notifications = notifications.slice(0, 50);
        }
        
        // save updated server notifications
        this.setServerNotifications(serverId, notifications);
        
        // update last notification timestamp
        this.setLastNotificationTimestamp(notification.timestamp);
        
        return notifications;
    }

    static addNotification(notification) {
        // get existing notifications
        var notifications = this.getNotifications();
        
        // add timestamp if not present
        if (!notification.timestamp) {
            notification.timestamp = new Date().toISOString();
        }
        
        // add new notification to beginning (newest first)
        notifications.unshift(notification);
        
        // keep only last 50 notifications
        if (notifications.length > 50) {
            notifications = notifications.slice(0, 50);
        }
        
        // save updated notifications
        this.setNotifications(notifications);
        
        // update last notification timestamp
        this.setLastNotificationTimestamp(notification.timestamp);
        
        return notifications;
    }

    static markNotificationAsRead(notificationId, serverId = null) {
        if (serverId) {
            // Mark notification as read in server-specific storage
            var notifications = this.getServerNotifications(serverId);
            const notification = notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.read = true;
                this.setServerNotifications(serverId, notifications);
            }
            return notifications;
        } else {
            // Mark notification as read in global storage
            var notifications = this.getNotifications();
            const notification = notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.read = true;
                this.setNotifications(notifications);
            }
            return notifications;
        }
    }

    static clearAllNotifications() {
        ElectronStore.delete(KEY_NOTIFICATIONS);
        return [];
    }

    // New method to clear notifications for a specific server
    static clearServerNotifications(serverId) {
        if (!serverId) return [];
        const serverNotifications = ElectronStore.get(KEY_SERVER_NOTIFICATIONS, {});
        delete serverNotifications[serverId];
        ElectronStore.set(KEY_SERVER_NOTIFICATIONS, serverNotifications);
        return [];
    }

    // New method to clear all server notifications
    static clearAllServerNotifications() {
        ElectronStore.delete(KEY_SERVER_NOTIFICATIONS);
        return {};
    }

    // Migration method to move global notifications to server-specific storage
    static migrateGlobalNotificationsToServerStorage() {
        const globalNotifications = this.getNotifications();
        
        if (!globalNotifications || globalNotifications.length === 0) {
            return; // No notifications to migrate
        }

        const serverNotifications = ElectronStore.get(KEY_SERVER_NOTIFICATIONS, {});
        let migrationCount = 0;

        // Group notifications by serverId
        globalNotifications.forEach(notification => {
            if (notification.serverId) {
                if (!serverNotifications[notification.serverId]) {
                    serverNotifications[notification.serverId] = [];
                }
                serverNotifications[notification.serverId].push(notification);
                migrationCount++;
            }
        });

        // Save the server-specific notifications
        if (migrationCount > 0) {
            ElectronStore.set(KEY_SERVER_NOTIFICATIONS, serverNotifications);
            console.log(`Migrated ${migrationCount} notifications to server-specific storage`);
            
            // Clear global notifications after successful migration
            this.setNotifications([]);
        }
    }

    static removeOldNotifications(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
        var notifications = this.getNotifications();
        const now = new Date();
        
        // filter out notifications older than maxAge
        notifications = notifications.filter(notification => {
            const notificationTime = new Date(notification.timestamp);
            return (now - notificationTime) < maxAge;
        });
        
        this.setNotifications(notifications);
        return notifications;
    }

    /**
     * Get the timestamp of the last received notification
     * @returns {string|null} ISO timestamp string or null if no notifications
     */
    static getLastNotificationTimestamp() {
        return ElectronStore.get(KEY_LAST_NOTIFICATION_TIMESTAMP, null);
    }

    /**
     * Set the timestamp of the last received notification
     * @param {string} timestamp ISO timestamp string
     */
    static setLastNotificationTimestamp(timestamp) {
        ElectronStore.set(KEY_LAST_NOTIFICATION_TIMESTAMP, timestamp);
    }

    /**
     * Check if a notification is newer than the last stored timestamp
     * @param {string} notificationTimestamp ISO timestamp string
     * @returns {boolean} true if notification is newer
     */
    static isNotificationNew(notificationTimestamp) {
        const lastTimestamp = this.getLastNotificationTimestamp();
        if (!lastTimestamp) {
            return true; // No previous notifications, so this is new
        }
        
        const lastTime = new Date(lastTimestamp);
        const notificationTime = new Date(notificationTimestamp);
        
        return notificationTime > lastTime;
    }

    /**
     * Get notifications that are newer than the last stored timestamp
     * @param {Array} notifications Array of notification objects
     * @returns {Array} Array of new notifications
     */
    static filterNewNotifications(notifications) {
        const lastTimestamp = this.getLastNotificationTimestamp();
        if (!lastTimestamp) {
            return notifications; // No previous notifications, all are new
        }
        
        const lastTime = new Date(lastTimestamp);
        
        return notifications.filter(notification => {
            const notificationTime = new Date(notification.timestamp);
            return notificationTime > lastTime;
        });
    }

}

module.exports = NotificationDataStore;