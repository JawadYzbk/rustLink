import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import started from 'electron-squirrel-startup';
import { FCMNotificationManager } from './main/FCMNotificationManager';
import { ExpoPushTokenManager } from './services/ExpoPushTokenManager';
import { RustCompanionManager } from './services/RustCompanionManager';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    autoHideMenuBar: false, // show menu bar only in development
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools in development
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
  }
}

// Steam authentication IPC handler - based on Vue implementation
ipcMain.on('connect-with-rustplus', (ipcEvent) => {
  const authWindow = new BrowserWindow({
    width: 800,
    height: 600,
    // frame: true,
    // autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, 'preload.js')
    },
  });

  // Listen for IPC callback from ReactNativeWebView.postMessage injected into the rust+ login website
  ipcMain.once('connect-with-rustplus.react-native-callback', (_, data) => {
    // Forward auth data to original IPC caller of 'connect-with-rustplus'
    ipcEvent.sender.send('connect-with-rustplus.success', {
      steamId: data.steamId,
      token: data.token,
    });

    // Close auth window
    authWindow.destroy();
  });

  // Handle window close event to reset connection state
  authWindow.on('closed', () => {
    // Send cancellation event to renderer process
    ipcEvent.sender.send('connect-with-rustplus.cancelled');
  });

  // Load rust+ companion login page
  authWindow.loadURL("https://companion-rust.facepunch.com/login");
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();
  
  // Initialize FCM notification manager
  new FCMNotificationManager(ipcMain);
  
  // Initialize Expo push token manager
  new ExpoPushTokenManager(ipcMain);
  
  // Initialize Rust companion manager
  new RustCompanionManager(ipcMain);
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
