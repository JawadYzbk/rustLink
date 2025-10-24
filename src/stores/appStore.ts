import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { rustPlusService } from '../services/RustPlusService';
import { serverService } from '../services/ServerService';
import { entityService } from '../services/EntityService';
import { notificationService } from '../services/NotificationService';
import { fcmService } from '../services/FCMService';
import { expoService } from '../services/ExpoService';

export interface Server {
  id: string;
  name: string;
  ip: string;
  port: number;
  playerToken: string;
  isConnected: boolean;
  lastSeen?: Date;
}

export interface Entity {
  id: string;
  entityId: number;
  name: string;
  customName?: string;
  type: 'switch' | 'alarm' | 'storage';
  isOnline: boolean;
  lastValue?: any;
  lastUpdated?: Date;
  serverId: string;
}

export interface GlobalNotification {
  id: string;
  type: string;
  channel?: number;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  serverId?: string;
  entityData?: any;
}

export interface AppState {
  // Authentication
  steamId: string | null;
  rustplusToken: string | null;
  isRustPlusConnected: boolean;

  // Servers
  servers: Server[];
  selectedServer: Server | null;

  // Entities
  entities: Entity[];
  selectedEntity: Entity | null;

  // Status
  fcmStatus: 'not_ready' | 'ready' | 'error';
  expoStatus: 'not_ready' | 'ready' | 'error';
  companionPushStatus: 'not_ready' | 'ready' | 'error';

  fcmStatusMessage: string;
  expoStatusMessage: string;
  companionPushStatusMessage: string;

  // Modals
  isShowingAboutModal: boolean;
  isShowingAddServerModal: boolean;
  isShowingPairServerModal: boolean;
  isShowingEntityPairingModal: boolean;
  isShowingLogoutModal: boolean;
  isShowingRemoveServerModal: boolean;
  isShowingFcmInfoModal: boolean;
  isShowingExpoInfoModal: boolean;
  isShowingCompanionPushInfoModal: boolean;
  isShowingDeviceControlModal: boolean;

  // Notifications
  globalNotifications: GlobalNotification[];
  isShowingGlobalNotificationCenter: boolean;

  // Actions
  setAuthentication: (steamId: string, rustplusToken: string) => void;
  logout: () => void;
  addServer: (server: Server) => void;
  removeServer: (serverId: string) => void;
  selectServer: (server: Server | null) => void;
  updateServerStatus: (serverId: string, isConnected: boolean) => void;
  connectToServer: (serverId: string) => Promise<void>;
  disconnectFromServer: (serverId: string) => Promise<void>;
  addEntity: (entity: Entity) => void;
  removeEntity: (entityId: string) => void;
  updateEntity: (entityId: string, updates: Partial<Entity>) => void;
  selectEntity: (entity: Entity | null) => void;
  controlEntity: (entityId: string, value: boolean) => Promise<void>;
  setModalState: (modal: string, isOpen: boolean) => void;
  addGlobalNotification: (notification: GlobalNotification) => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearAllNotifications: () => void;
  toggleNotificationCenter: () => void;
  loadGlobalNotifications: () => void;
  initializeServices: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      steamId: null,
      rustplusToken: null,
      isRustPlusConnected: false,

      servers: [],
      selectedServer: null,

      entities: [],
      selectedEntity: null,

      fcmStatus: 'not_ready',
      expoStatus: 'not_ready',
      companionPushStatus: 'not_ready',

      fcmStatusMessage: 'Not Ready',
      expoStatusMessage: 'Not Ready',
      companionPushStatusMessage: 'Not Ready',

      isShowingAboutModal: false,
      isShowingAddServerModal: false,
      isShowingPairServerModal: false,
      isShowingEntityPairingModal: false,
      isShowingLogoutModal: false,
      isShowingRemoveServerModal: false,
      isShowingFcmInfoModal: false,
      isShowingExpoInfoModal: false,
      isShowingCompanionPushInfoModal: false,
      isShowingDeviceControlModal: false,

      globalNotifications: [],
      isShowingGlobalNotificationCenter: false,

      // Actions
      setAuthentication: (steamId: string, rustplusToken: string) => {
        set({
          steamId,
          rustplusToken,
          isRustPlusConnected: true,
        });
      },

      logout: () => {
        // Disconnect from current server if connected
        const currentServer = serverService.getCurrentServer();
        if (currentServer) {
          serverService.disconnectFromServer();
        }
        
        // Disconnect from RustPlus service
        rustPlusService.disconnect();
        
        // Clear the persisted storage
        localStorage.removeItem('rustlink-storage');
        
        set({
          steamId: null,
          rustplusToken: null,
          isRustPlusConnected: false,
          selectedServer: null,
          selectedEntity: null,
          servers: [],
          entities: [],
          globalNotifications: [],
        });
      },

      addServer: (server: Server) => {
        set((state) => ({
          servers: [...state.servers, server],
        }));
        
        // Add server to ServerService
        serverService.addServer({
          id: server.id,
          name: server.name,
          ip: server.ip,
          port: server.port,
          playerToken: server.playerToken,
          playerId: get().steamId || '',
          isConnected: false,
          status: 'disconnected'
        });
      },

      removeServer: (serverId: string) => {
        const state = get();
        
        // Remove from ServerService
        serverService.removeServer(serverId);
        
        // Remove associated entities
        const serverEntities = state.entities.filter(e => e.serverId === serverId);
        serverEntities.forEach(entity => {
          entityService.removeEntity(entity.id);
        });
        
        set((state) => ({
          servers: state.servers.filter((s) => s.id !== serverId),
          entities: state.entities.filter((e) => e.serverId !== serverId),
          selectedServer: state.selectedServer?.id === serverId ? null : state.selectedServer,
          selectedEntity: state.selectedEntity?.serverId === serverId ? null : state.selectedEntity,
        }));
      },

      selectServer: (server: Server | null) => {
        set({ selectedServer: server });
      },

      updateServerStatus: (serverId: string, isConnected: boolean) => {
        set((state) => ({
          servers: state.servers.map((server) =>
            server.id === serverId
              ? { ...server, isConnected, lastSeen: new Date() }
              : server
          ),
        }));
      },

      connectToServer: async (serverId: string) => {
        const state = get();
        const server = state.servers.find(s => s.id === serverId);
        
        if (!server) {
          throw new Error('Server not found');
        }

        try {
          await serverService.connectToServer(serverId);
          
          set((state) => ({
            servers: state.servers.map((s) =>
              s.id === serverId ? { ...s, isConnected: true } : s
            ),
          }));
        } catch (error) {
          console.error('Failed to connect to server:', error);
          throw error;
        }
      },

      disconnectFromServer: async (serverId: string) => {
        try {
          await serverService.disconnectFromServer(serverId);
          
          set((state) => ({
            servers: state.servers.map((s) =>
              s.id === serverId ? { ...s, isConnected: false } : s
            ),
          }));
        } catch (error) {
          console.error('Failed to disconnect from server:', error);
          throw error;
        }
      },

      addEntity: (entity: Entity) => {
        set((state) => ({
          entities: [...state.entities, entity],
        }));
        
        // Add entity to EntityService
        entityService.addEntity({
          id: entity.id,
          entityId: entity.entityId,
          name: entity.name,
          customName: entity.customName,
          type: entity.type === 'switch' ? 1 : entity.type === 'alarm' ? 2 : 3,
          serverId: entity.serverId,
          isOnline: entity.isOnline,
          lastValue: entity.lastValue,
          lastUpdated: entity.lastUpdated
        });
      },

      removeEntity: (entityId: string) => {
        entityService.removeEntity(entityId);
        
        set((state) => ({
          entities: state.entities.filter((e) => e.id !== entityId),
          selectedEntity: state.selectedEntity?.id === entityId ? null : state.selectedEntity,
        }));
      },

      updateEntity: (entityId: string, updates: Partial<Entity>) => {
        set((state) => ({
          entities: state.entities.map((entity) =>
            entity.id === entityId ? { ...entity, ...updates } : entity
          ),
        }));
        
        // Update in EntityService
        entityService.updateEntity(entityId, updates);
      },

      selectEntity: (entity: Entity | null) => {
        set({ selectedEntity: entity });
      },

      controlEntity: async (entityId: string, value: boolean) => {
        try {
          await entityService.controlEntity(entityId, value);
          
          // Update local state
          set((state) => ({
            entities: state.entities.map((entity) =>
              entity.id === entityId 
                ? { ...entity, lastValue: value, lastUpdated: new Date() }
                : entity
            ),
          }));
        } catch (error) {
          console.error('Failed to control entity:', error);
          throw error;
        }
      },

      setModalState: (modal: string, isOpen: boolean) => {
        set((state) => ({
          ...state,
          [`isShowing${modal}Modal`]: isOpen,
        }));
      },

      addGlobalNotification: (notification: GlobalNotification) => {
        set((state) => {
          const updatedNotifications = [notification, ...state.globalNotifications];
          
          // Persist to localStorage using 'rustlink-notifications' key
          try {
            localStorage.setItem('rustlink-notifications', JSON.stringify(updatedNotifications));
          } catch (error) {
            console.warn('Could not save global notifications to localStorage:', error);
          }
          
          return {
            globalNotifications: updatedNotifications,
          };
        });
      },

      markNotificationAsRead: (notificationId: string) => {
        set((state) => ({
          globalNotifications: state.globalNotifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          ),
        }));
      },

      clearAllNotifications: () => {
        set({ globalNotifications: [] });
        // Also clear from localStorage
        try {
          localStorage.removeItem('rustlink-notifications');
        } catch (error) {
          console.warn('Could not clear notifications from localStorage:', error);
        }
      },

      loadGlobalNotifications: () => {
        try {
          const saved = localStorage.getItem('rustlink-notifications');
          if (saved) {
            const notifications = JSON.parse(saved);
            // Convert timestamp strings back to Date objects
            const parsedNotifications = notifications.map((n: any) => ({
              ...n,
              timestamp: new Date(n.timestamp)
            }));
            set({ globalNotifications: parsedNotifications });
            console.log('AppStore: Loaded', parsedNotifications.length, 'global notifications from localStorage');
          }
        } catch (error) {
          console.warn('Could not load global notifications from localStorage:', error);
          set({ globalNotifications: [] });
        }
      },

      toggleNotificationCenter: () => {
        set((state) => ({
          isShowingGlobalNotificationCenter: !state.isShowingGlobalNotificationCenter,
        }));
      },

      initializeServices: () => {
        // Load global notifications from localStorage first
        get().loadGlobalNotifications();
        
        // Setup service event listeners
        
        // Server service listeners
        serverService.on('serverConnected', (server) => {
          get().updateServerStatus(server.id, true);
          notificationService.showSuccess('Server Connected', `Connected to ${server.name}`);
        });

        serverService.on('serverDisconnected', (server) => {
          get().updateServerStatus(server.id, false);
          notificationService.showWarning('Server Disconnected', `Disconnected from ${server.name}`);
        });

        serverService.on('serverError', (server, error) => {
          get().updateServerStatus(server.id, false);
          notificationService.showError('Server Error', `Error with ${server.name}: ${error.message}`);
        });

        // Entity service listeners
        entityService.on('entityAdded', (entity) => {
          const appEntity: Entity = {
            id: entity.id,
            entityId: entity.entityId,
            name: entity.name,
            customName: entity.customName,
            type: entity.type === 1 ? 'switch' : entity.type === 2 ? 'alarm' : 'storage',
            isOnline: entity.isOnline,
            lastValue: entity.lastValue,
            lastUpdated: entity.lastUpdated,
            serverId: entity.serverId
          };
          
          set((state) => ({
            entities: [...state.entities, appEntity],
          }));
        });

        entityService.on('entityUpdated', (entity) => {
          const appEntity: Entity = {
            id: entity.id,
            entityId: entity.entityId,
            name: entity.name,
            customName: entity.customName,
            type: entity.type === 1 ? 'switch' : entity.type === 2 ? 'alarm' : 'storage',
            isOnline: entity.isOnline,
            lastValue: entity.lastValue,
            lastUpdated: entity.lastUpdated,
            serverId: entity.serverId
          };
          
          set((state) => ({
            entities: state.entities.map((e) =>
              e.id === entity.id ? appEntity : e
            ),
          }));
        });

        entityService.on('entityRemoved', (entityId) => {
          set((state) => ({
            entities: state.entities.filter((e) => e.id !== entityId),
            selectedEntity: state.selectedEntity?.id === entityId ? null : state.selectedEntity,
          }));
        });

        // Notification service listeners
        notificationService.on('notificationAdded', (notification) => {
          const globalNotification: GlobalNotification = {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            timestamp: notification.timestamp,
            read: false,
          };
          
          get().addGlobalNotification(globalNotification);
        });

        // FCM service listeners
        fcmService.on('ready', () => {
          console.log('AppStore: FCM service ready');
          set({ fcmStatus: 'ready', fcmStatusMessage: 'Ready' });
        });

        fcmService.on('error', (error) => {
          console.error('AppStore: FCM service error:', error);
          set({ fcmStatus: 'error', fcmStatusMessage: error.message });
        });

        // Expo service listeners
        expoService.on('ready', () => {
          console.log('AppStore: Expo service ready');
          set({ expoStatus: 'ready', expoStatusMessage: 'Ready' });
        });

        expoService.on('error', (error) => {
          console.error('AppStore: Expo service error:', error);
          set({ expoStatus: 'error', expoStatusMessage: error.message });
        });

        // RustPlusService listeners
        rustPlusService.on('protocolBuffersReady', () => {
          console.log('AppStore: RustPlusService protocol buffers ready');
          set((state) => ({
            companionPushStatus: 'ready',
            companionPushStatusMessage: 'Ready'
          }));
        });

        rustPlusService.on('connected', (server: any) => {
          console.log('AppStore: RustPlusService connected to server:', server);
          set((state) => ({
            companionPushStatus: 'connected',
            companionPushStatusMessage: 'Connected'
          }));
        });

        rustPlusService.on('disconnected', () => {
          console.log('AppStore: RustPlusService disconnected');
          set((state) => ({
            companionPushStatus: 'ready',
            companionPushStatusMessage: 'Ready'
          }));
        });

        rustPlusService.on('error', (error: Error) => {
          console.error('AppStore: RustPlusService error:', error);
          set((state) => ({
            companionPushStatus: 'error',
            companionPushStatusMessage: `Error: ${error.message}`
          }));
        });

        rustPlusService.on('statusChanged', (status: string) => {
          console.log('AppStore: RustPlusService status changed to:', status);
          let statusMessage = 'Unknown';
          let statusType = 'error';
          
          switch (status) {
            case 'disconnected':
              statusMessage = rustPlusService.isReady() ? 'Ready' : 'Not Ready';
              statusType = rustPlusService.isReady() ? 'ready' : 'error';
              break;
            case 'connecting':
              statusMessage = 'Connecting...';
              statusType = 'connecting';
              break;
            case 'connected':
              statusMessage = 'Connected';
              statusType = 'connected';
              break;
            case 'error':
              statusMessage = 'Connection Error';
              statusType = 'error';
              break;
          }
          
          set((state) => ({
            companionPushStatus: statusType,
            companionPushStatusMessage: statusMessage
          }));
        });
      },
    }),
    {
      name: 'rustlink-storage',
      partialize: (state) => ({
        steamId: state.steamId,
        rustplusToken: state.rustplusToken,
        isRustPlusConnected: state.isRustPlusConnected,
        servers: state.servers,
        entities: state.entities,
        globalNotifications: state.globalNotifications,
      }),
    }
  )
);