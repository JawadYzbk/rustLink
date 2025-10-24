// Type definitions for Electron API exposed through preload script

export interface ElectronAPI {
  connectWithRustPlus: () => void;
  onRustPlusConnected: (callback: (data: { steamId: string; token: string }) => void) => void;
  onRustPlusConnectionCancelled: (callback: () => void) => void;
  removeRustPlusListener: () => void;
  
  // FCM notification methods
  send: (channel: string, data?: any) => void;
  on: (channel: string, callback: (event: any, data: any) => void) => void;
  removeAllListeners: (channel: string) => void;
}

export interface ReactNativeWebView {
  postMessage: (message: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    ReactNativeWebView: ReactNativeWebView;
  }
}