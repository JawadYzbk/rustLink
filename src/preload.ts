// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  connectWithRustPlus: () => ipcRenderer.send('connect-with-rustplus'),
  onRustPlusConnected: (callback: (data: { steamId: string; token: string }) => void) => 
    ipcRenderer.on('connect-with-rustplus.success', (_, data) => callback(data)),
  onRustPlusConnectionCancelled: (callback: () => void) => 
    ipcRenderer.on('connect-with-rustplus.cancelled', () => callback()),
  removeRustPlusListener: () => {
    ipcRenderer.removeAllListeners('connect-with-rustplus.success');
    ipcRenderer.removeAllListeners('connect-with-rustplus.cancelled');
  },
  
  // FCM notification methods
  send: (channel: string, data?: any) => ipcRenderer.send(channel, data),
  on: (channel: string, callback: (event: any, data: any) => void) => 
    ipcRenderer.on(channel, callback),
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
});

/**
 * Rust+ recently changed the login flow, which no longer sends auth data in the URL callback.
 *
 * Auth data is now sent to a ReactNativeWebView.postMessage handler on the main window object,
 * which is available to the Rust+ app since it is a ReactNative app.
 *
 * We can emulate this functionality by modifying the window object ourselves. Which allows us to forward
 * the auth data to background.js via our ipc calls.
 */
contextBridge.exposeInMainWorld('ReactNativeWebView', {
  postMessage: (message: string) => {
    try {
      // Parse auth data, converting BigInteger steam id to string
      const auth = JSON.parse(message);

      // Send auth data back to main process
      ipcRenderer.send('connect-with-rustplus.react-native-callback', {
        steamId: auth.SteamId,
        token: auth.Token,
      });
    } catch (error) {
      console.error('Failed to parse ReactNativeWebView message:', error);
    }
  },
});
