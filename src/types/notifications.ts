export interface BaseNotification {
  id: string;
  type: NotificationType;
  timestamp: number;
  read: boolean;
  title: string;
  message: string;
  data?: any;
}

export type NotificationType = 
  | 'server_pairing'
  | 'entity_pairing'
  | 'team_message'
  | 'player_death'
  | 'player_login'
  | 'smart_alarm'
  | 'entity_changed'
  | 'server_info'
  | 'error';

export interface ServerPairingNotification extends BaseNotification {
  type: 'server_pairing';
  data: {
    serverName: string;
    ip: string;
    port: string;
    playerId: string;
    playerToken: string;
    description?: string;
  };
}

export interface EntityPairingNotification extends BaseNotification {
  type: 'entity_pairing';
  data: {
    entityId: number;
    entityType: string;
    entityName?: string;
    description?: string;
  };
}

export interface TeamMessageNotification extends BaseNotification {
  type: 'team_message';
  data: {
    steamId: string;
    name: string;
    message: string;
    color: string;
  };
}

export interface PlayerDeathNotification extends BaseNotification {
  type: 'player_death';
  data: {
    steamId: string;
    name: string;
    killer?: string;
    weapon?: string;
  };
}

export interface PlayerLoginNotification extends BaseNotification {
  type: 'player_login';
  data: {
    steamId: string;
    name: string;
    isOnline: boolean;
  };
}

export interface SmartAlarmNotification extends BaseNotification {
  type: 'smart_alarm';
  data: {
    entityId: number;
    entityName?: string;
    alarmType: string;
    message: string;
  };
}

export interface EntityChangedNotification extends BaseNotification {
  type: 'entity_changed';
  data: {
    entityId: number;
    entityType: string;
    value: any;
    capacity?: number;
    hasProtection?: boolean;
  };
}

export type Notification = 
  | ServerPairingNotification
  | EntityPairingNotification
  | TeamMessageNotification
  | PlayerDeathNotification
  | PlayerLoginNotification
  | SmartAlarmNotification
  | EntityChangedNotification
  | BaseNotification;

export interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isVisible: boolean;
}