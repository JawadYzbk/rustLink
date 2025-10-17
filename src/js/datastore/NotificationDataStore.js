const ElectronStore = new (require('electron-store'))();

const KEY_NOTIFICATIONS = 'notifications';

class NotificationDataStore {

    static getNotifications() {
        return ElectronStore.get(KEY_NOTIFICATIONS, []);
    }

    static setNotifications(notifications) {
        ElectronStore.set(KEY_NOTIFICATIONS, notifications);
    }

    static addNotification(notification) {
        // get existing notifications
        var notifications = this.getNotifications();
        
        // add new notification to beginning (newest first)
        notifications.unshift(notification);
        
        // keep only last 50 notifications
        if (notifications.length > 50) {
            notifications = notifications.slice(0, 50);
        }
        
        // save updated notifications
        this.setNotifications(notifications);
        
        return notifications;
    }

    static markNotificationAsRead(notificationId) {
        var notifications = this.getNotifications();
        
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.setNotifications(notifications);
        }
        
        return notifications;
    }

    static clearAllNotifications() {
        ElectronStore.delete(KEY_NOTIFICATIONS);
        return [];
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

}

module.exports = NotificationDataStore;