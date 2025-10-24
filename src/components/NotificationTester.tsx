import React from 'react';
import { notificationService } from '../services/NotificationService';
import { fcmService } from '../services/FCMService';

const NotificationTester: React.FC = () => {
  const createTestNotifications = () => {
    // Test death notification (persistent)
    notificationService.addNotification({
      type: 'player_death',
      title: 'Player Death',
      message: 'TestPlayer died by EnemyPlayer with AK47',
      persistent: true,
      read: false,
      data: {
        steamId: '76561198123456789',
        name: 'TestPlayer',
        killer: 'EnemyPlayer',
        weapon: 'AK47'
      }
    });

    // Test alarm notification (persistent)
    notificationService.addNotification({
      type: 'smart_alarm',
      title: 'Smart Alarm',
      message: 'Front Door: Motion detected at front entrance',
      persistent: true,
      read: false,
      data: {
        entityId: 12345,
        entityName: 'Front Door',
        alarmType: 'smart_alarm',
        message: 'Motion detected at front entrance'
      }
    });

    // Test player login notification (persistent)
    notificationService.addNotification({
      type: 'player_login',
      title: 'Player Online',
      message: 'FriendPlayer came online',
      persistent: true,
      read: false,
      data: {
        steamId: '76561198987654321',
        name: 'FriendPlayer',
        isOnline: true
      }
    });

    // Test entity pairing notification (persistent)
    notificationService.addNotification({
      type: 'entity_pairing',
      title: 'Entity Pairing',
      message: 'Garage Light: New smart switch available for pairing',
      persistent: true,
      read: false,
      data: {
        entityId: 54321,
        entityType: 'switch',
        entityName: 'Garage Light',
        description: 'New smart switch available for pairing'
      }
    });

    // Test server pairing notification (persistent)
    notificationService.addNotification({
      type: 'server_pairing',
      title: 'Server Pairing',
      message: 'Test Server: Server pairing request received',
      persistent: true,
      read: false,
      data: {
        serverName: 'Test Server',
        ip: '192.168.1.100',
        port: '28082',
        playerId: '76561198111111111',
        playerToken: 'test-token-123',
        description: 'Server pairing request received'
      }
    });

    // Test team message notification (persistent)
    notificationService.addNotification({
      type: 'team_message',
      title: 'Team Message',
      message: 'TeamMate: Enemy spotted near base!',
      persistent: true,
      read: false,
      data: {
        steamId: '76561198222222222',
        name: 'TeamMate',
        message: 'Enemy spotted near base!',
        time: Date.now()
      }
    });

    console.log('Test notifications created!');
  };

  const testFCMNotification = () => {
    // Test FCM alarm notification
    const mockFCMData = {
      persistentId: 'test-persistent-id-' + Date.now(),
      sent: Date.now().toString(),
      appData: [
        { key: 'body', value: JSON.stringify({ 
          title: 'Smart Alarm Triggered',
          body: 'Motion detected at your base',
          entityId: 98765,
          type: 'alarm'
        })},
        { key: 'channel', value: '1004' },
        { key: 'title', value: 'Base Security Alert' },
        { key: 'message', value: 'Intruder detected near your sleeping bag' }
      ]
    };

    fcmService.processNotification(mockFCMData);

    // Test FCM death notification
    const mockDeathFCMData = {
      persistentId: 'test-death-id-' + Date.now(),
      sent: (Date.now() + 1000).toString(),
      appData: [
        { key: 'body', value: JSON.stringify({ 
          title: 'Player Death',
          body: 'TestPlayer was killed by EnemyPlayer with Bolt Action Rifle',
          steamId: '76561198333333333',
          type: 'player_death'
        })},
        { key: 'channel', value: '1003' }
      ]
    };

    fcmService.processNotification(mockDeathFCMData);

    console.log('Test FCM notifications processed!');
  };

  const clearAllNotifications = () => {
    // Get all notifications and mark them as read
    const notifications = notificationService.getNotifications();
    notifications.forEach(notification => {
      notificationService.markAsRead(notification.id);
    });
    console.log('All notifications cleared!');
  };

  return (
    <div className="p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-white">Notification System Tester</h3>
      <div className="space-y-2">
        <button
          onClick={createTestNotifications}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
        >
          Create Test Notifications
        </button>
        <button
          onClick={testFCMNotification}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mr-2"
        >
          Test FCM Notifications
        </button>
        <button
          onClick={clearAllNotifications}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear All Notifications
        </button>
      </div>
      <div className="mt-4 text-sm text-gray-300">
        <p>• Click "Create Test Notifications" to generate various notification types</p>
        <p>• Click "Test FCM Notifications" to simulate FCM push notifications</p>
        <p>• Click "Clear All Notifications" to mark all notifications as read</p>
        <p>• Check the notification bell icon to see the generated notifications</p>
      </div>
    </div>
  );
};

export default NotificationTester;