<template>
  <div class="notification-center">
    <button 
      @click="toggleNotifications" 
      class="notification-button"
      :class="{ 'has-unread': hasUnreadNotifications }"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
    </button>

    <div v-if="showNotifications" class="notification-panel">
      <div class="notification-header">
        <h3>Notifications</h3>
        <button @click="clearAllNotifications" class="clear-button">Clear All</button>
      </div>
      
      <div class="notification-list" ref="notificationList">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          class="notification-item"
          :class="{ 'unread': !notification.read }"
          @click="markAsRead(notification.id)"
        >
          <div class="notification-icon" :class="getNotificationIconClass(notification)">
            <!-- Pairing notification icon -->
            <svg v-if="notification.channel === 1001 || notification.type === 'pairing'" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <!-- Player logged in icon -->
            <svg v-else-if="notification.channel === 1002 || notification.type === 'player_login'" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
            </svg>
            <!-- Player died icon -->
            <svg v-else-if="notification.channel === 1003 || notification.type === 'player_death'" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="2"/>
              <path d="M9 9h6v6H9z" fill="currentColor"/>
            </svg>
            <!-- Smart alarm icon -->
            <svg v-else-if="notification.channel === 1004 || notification.type === 'smart_alarm'" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 6h12v12H6z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 1v6M15 1v6M1 9h22M1 15h22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <!-- Team message icon -->
            <svg v-else-if="notification.type === 'team_message'" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2"/>
            </svg>
            <!-- Team changed icon -->
            <svg v-else-if="notification.type === 'team_changed'" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="2"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2"/>
            </svg>
            <!-- Entity changed icon -->
            <svg v-else-if="notification.type === 'entity_changed'" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="2"/>
            </svg>
            <!-- Default notification icon -->
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>
              <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div v-if="notification.entityName" class="notification-entity">
              Entity: {{ notification.entityName }} ({{ notification.entityType }})
            </div>
            <div v-if="notification.playerName" class="notification-player">
              Player: {{ notification.playerName }}
            </div>
            <div class="notification-time">{{ formatTime(notification.timestamp) }}</div>
          </div>
        </div>
        
        <div v-if="notifications.length === 0" class="no-notifications">
          No notifications yet
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotificationCenter',
  props: {
    notifications: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      showNotifications: false
    }
  },
  mounted() {
    // Add click outside listener
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    // Remove click outside listener
    document.removeEventListener('click', this.handleClickOutside);
  },
  computed: {
    unreadCount() {
      return this.notifications.filter(n => !n.read).length;
    },
    hasUnreadNotifications() {
      return this.unreadCount > 0;
    }
  },
  methods: {
    toggleNotifications() {
      this.showNotifications = !this.showNotifications;
    },
    handleClickOutside(event) {
      // Check if the click is outside the notification center
      if (this.$el && !this.$el.contains(event.target)) {
        this.showNotifications = false;
      }
    },
    markAsRead(notificationId) {
      this.$emit('mark-as-read', notificationId);
    },
    clearAllNotifications() {
      this.$emit('clear-all');
      this.showNotifications = false;
    },
    getNotificationIconClass(notification) {
      const channelClasses = {
        1001: 'pairing-notification',
        1002: 'login-notification', 
        1003: 'death-notification',
        1004: 'alarm-notification'
      };
      
      const typeClasses = {
        'pairing': 'pairing-notification',
        'player_login': 'login-notification',
        'player_death': 'death-notification', 
        'smart_alarm': 'alarm-notification',
        'team_message': 'team-notification',
        'team_changed': 'team-notification',
        'entity_changed': 'entity-notification'
      };
      
      return channelClasses[notification.channel] || typeClasses[notification.type] || 'default-notification';
    },
    formatTime(timestamp) {
      const now = new Date();
      const notificationTime = new Date(timestamp);
      const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
      
      if (diffInMinutes < 1) {
        return 'Just now';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
      } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60);
        return `${hours}h ago`;
      } else {
        const days = Math.floor(diffInMinutes / 1440);
        return `${days}d ago`;
      }
    }
  },
  watch: {
    notifications: {
      handler() {
        // Auto-scroll to top when new notifications arrive
        this.$nextTick(() => {
          if (this.$refs.notificationList) {
            this.$refs.notificationList.scrollTop = 0;
          }
        });
      },
      deep: true
    }
  }
}
</script>

<style scoped>
.notification-center {
  position: relative;
  display: inline-block;
}

.notification-button {
  position: relative;
  background: #2d3748;
  border: 1px solid #4a5568;
  border-radius: 8px;
  padding: 8px 12px;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.notification-button:hover {
  background: #4a5568;
  border-color: #718096;
}

.notification-button.has-unread {
  border-color: #f56565;
  box-shadow: 0 0 0 1px rgba(245, 101, 101, 0.3);
}

.notification-badge {
  background: #f56565;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 12px;
  font-weight: bold;
  min-width: 18px;
  text-align: center;
  line-height: 1;
}

.notification-panel {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  width: 350px;
  max-height: 500px;
  background: #2d3748;
  border: 1px solid #4a5568;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #4a5568;
  background: #1a202c;
}

.notification-header h3 {
  margin: 0;
  color: #e2e8f0;
  font-size: 16px;
  font-weight: 600;
}

.clear-button {
  background: none;
  border: none;
  color: #f56565;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.clear-button:hover {
  background: rgba(245, 101, 101, 0.1);
}

.notification-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #4a5568;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.notification-item:hover {
  background: #374151;
}

.notification-item.unread {
  background: rgba(59, 130, 246, 0.1);
  border-left: 3px solid #3b82f6;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  background: #4a5568;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e2e8f0;
}

/* Notification type specific icon colors */
.notification-icon.pairing-notification {
  background: #f59e0b;
  color: #1f2937;
}

.notification-icon.login-notification {
  background: #10b981;
  color: #1f2937;
}

.notification-icon.death-notification {
  background: #ef4444;
  color: #ffffff;
}

.notification-icon.alarm-notification {
  background: #f59e0b;
  color: #1f2937;
}

.notification-icon.team-notification {
  background: #3b82f6;
  color: #ffffff;
}

.notification-icon.entity-notification {
  background: #8b5cf6;
  color: #ffffff;
}

.notification-icon.default-notification {
  background: #6b7280;
  color: #e2e8f0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  color: #e2e8f0;
  font-size: 14px;
  margin-bottom: 4px;
}

.notification-message {
  color: #a0aec0;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 4px;
  word-wrap: break-word;
}

.notification-entity,
.notification-player {
  color: #9ca3af;
  font-size: 12px;
  font-style: italic;
  margin-bottom: 2px;
}

.notification-time {
  color: #718096;
  font-size: 12px;
}

.no-notifications {
  padding: 32px 16px;
  text-align: center;
  color: #718096;
  font-style: italic;
}

/* Scrollbar styling */
.notification-list::-webkit-scrollbar {
  width: 6px;
}

.notification-list::-webkit-scrollbar-track {
  background: #2d3748;
}

.notification-list::-webkit-scrollbar-thumb {
  background: #4a5568;
  border-radius: 3px;
}

.notification-list::-webkit-scrollbar-thumb:hover {
  background: #718096;
}
</style>