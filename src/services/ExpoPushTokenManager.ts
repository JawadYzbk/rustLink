import axios from 'axios';
import https from 'https';
import { IpcMainEvent } from 'electron';

/**
 * This class is responsible for obtaining an Expo Push Token.
 *
 * Events are received via ipc from the renderer process, executed here in the main
 * process, and results are then sent back to the renderer process via ipc.
 */
export class ExpoPushTokenManager {
  private ipcMain: any;

  constructor(ipcMain: any) {
    // global vars
    this.ipcMain = ipcMain;

    // register ipc channel handlers
    ipcMain.on('expo-push-token.register', (event: IpcMainEvent, data: any) => this.onRegister(event, data));
  }

  private onRegisterSuccess(event: IpcMainEvent, expoPushToken: string) {
    event.sender.send('expo-push-token.register.success', {
      expoPushToken: expoPushToken,
    });
  }

  private onRegisterError(event: IpcMainEvent, error: any) {
    // Send error message directly like the old Vue implementation
    const errorMessage = error.message || error.toString() || 'Unknown error';
    
    event.sender.send('expo-push-token.register.error', {
      error: errorMessage,
    });
  }

  /**
   * Get an Expo Push Token
   */
  private async onRegister(event: IpcMainEvent, data: any) {
    try {
      // register with expo
      const response = await axios.post('https://exp.host/--/api/v2/push/getExpoPushToken', {
        type: data.type,
        deviceId: data.deviceId,
        development: data.development,
        appId: data.appId,
        deviceToken: data.deviceToken,
        projectId: data.projectId,
      }, {
        /**
         * Note: this is insecure and should not be used in production
         * ignores invalid ssl certificates when registering for expo push token
         * temporary fix for SSL certificate issues
         */
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        }),
      });

      // return expo push token
      this.onRegisterSuccess(event, response.data.data.expoPushToken);

    } catch (error) {
      // return error
      this.onRegisterError(event, error);
    }
  }
}