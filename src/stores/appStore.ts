import { create } from 'zustand';

export interface Server {
  id: string;
  name: string;
  ip: string;
  port: number;
  playerToken: string;
  isConnected: boolean;
  lastSeen?: Date;
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
  setModalState: (modal: string, isOpen: boolean) => void;
  addGlobalNotification: (notification: GlobalNotification) => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearAllNotifications: () => void;
  toggleNotificationCenter: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  steamId: null,
  rustplusToken: null,
  isRustPlusConnected: false,

  servers: [],
  selectedServer: null,

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
    set({
      steamId: null,
      rustplusToken: null,
      isRustPlusConnected: false,
      selectedServer: null,
      servers: [],
      globalNotifications: [],
    });
  },

  addServer: (server: Server) => {
    set((state) => ({
      servers: [...state.servers, server],
    }));
  },

  removeServer: (serverId: string) => {
    set((state) => ({
      servers: state.servers.filter((s) => s.id !== serverId),
      selectedServer: state.selectedServer?.id === serverId ? null : state.selectedServer,
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

  setModalState: (modal: string, isOpen: boolean) => {
    set((state) => ({
      ...state,
      [`isShowing${modal}Modal`]: isOpen,
    }));
  },

  addGlobalNotification: (notification: GlobalNotification) => {
    set((state) => ({
      globalNotifications: [notification, ...state.globalNotifications],
    }));
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
  },

  toggleNotificationCenter: () => {
    set((state) => ({
      isShowingGlobalNotificationCenter: !state.isShowingGlobalNotificationCenter,
    }));
  },
}));