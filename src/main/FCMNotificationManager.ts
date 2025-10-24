import { IpcMain, IpcMainEvent } from 'electron';

const {
    AndroidFCM,
    Client: PushReceiverClient,
} = require('@liamcottle/push-receiver');

/**
 * This class is responsible for registering a new android device with fcm
 * as well as being able to listen for notifications after registering.
 *
 * Events are received via ipc from the renderer process, executed here in the main
 * process, and results are then sent back to the renderer process via ipc.
 */
export class FCMNotificationManager {
    private ipcMain: IpcMain;
    private notificationClient: any = null;

    constructor(ipcMain: IpcMain) {
        // global vars
        this.ipcMain = ipcMain;
        this.notificationClient = null;

        // register ipc channel handlers
        ipcMain.on('push-receiver.register', (event, data) => this.onRegister(event, data));
        ipcMain.on('push-receiver.notifications.listen.start', (event, data) => this.onStartListeningForNotifications(event, data));
        ipcMain.on('push-receiver.notifications.listen.stop', (event, data) => this.onStopListeningForNotifications(event, data));
    }

    private onRegisterSuccess(event: IpcMainEvent, credentials: any) {
        event.sender.send('push-receiver.register.success', {
            'credentials': credentials,
        });
    }

    private onRegisterError(event: IpcMainEvent, error: any) {
        event.sender.send('push-receiver.register.error', {
            'error': error,
        });
    }

    private onNotificationListenStart(event: IpcMainEvent) {
        event.sender.send('push-receiver.notifications.listen.started');
    }

    private onNotificationListenStopped(event: IpcMainEvent) {
        event.sender.send('push-receiver.notifications.listen.stopped');
    }

    private onNotificationReceived(event: IpcMainEvent, data: any) {
        event.sender.send('push-receiver.notifications.received', data);
    }

    private onNotificationError(event: IpcMainEvent, error: any) {
        event.sender.send('push-receiver.notifications.error', {
            'error': error,
        });
    }

    /**
     * Register with FCM to obtain credentials
     */
    private async onRegister(event: IpcMainEvent, data: any) {
        try {
            // register with gcm/fcm
            const credentials = await AndroidFCM.register(
                data.apiKey, 
                data.projectId, 
                data.gcmSenderId, 
                data.gmsAppId, 
                data.androidPackageName, 
                data.androidPackageCert
            );

            // registering was successful
            this.onRegisterSuccess(event, credentials);

        } catch (error) {
            // registering failed with error
            this.onRegisterError(event, error);
        }
    }

    /**
     * Listen for notifications from FCM with existing credentials
     */
    private async onStartListeningForNotifications(event: IpcMainEvent, data: any) {
        try {
            // get data
            const credentials = data.credentials;
            const persistentIds = data.persistentIds || [];

            // start listening for notifications
            const androidId = credentials.gcm.androidId;
            const securityToken = credentials.gcm.securityToken;
            const client = new PushReceiverClient(androidId, securityToken, persistentIds);
            
            client.on('ON_DATA_RECEIVED', (data: any) => {
                // notification was received
                this.onNotificationReceived(event, data);
            });

            client.connect();

            // store client reference for cleanup
            this.notificationClient = client;

            // listening for notifications
            this.onNotificationListenStart(event);

        } catch (error) {
            // listening for notifications failed with error
            this.onNotificationError(event, error);
        }
    }

    /**
     * Stop listening for notification from FCM
     */
    private async onStopListeningForNotifications(event: IpcMainEvent, data: any) {
        // stop listening for notifications
        if (this.notificationClient) {
            this.notificationClient.destroy();
            this.notificationClient = null;
        }

        // stopped listening for notifications
        this.onNotificationListenStopped(event);
    }
}