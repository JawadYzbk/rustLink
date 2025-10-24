import { EventEmitter } from 'events';

/**
 * This class is responsible for communicating with the FCMNotificationManager running
 * in the main process.
 *
 * Events are sent from here in the renderer process via ipc to the main process,
 * and results are then sent back to the renderer process via ipc.
 */
export class FCMNotificationReceiver extends EventEmitter {
    private ipcRenderer: any;

    constructor(electronAPI?: any) {
        super();
        
        // Check if we're in Electron environment
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
            this.ipcRenderer = (window as any).electronAPI;
        } else if (electronAPI) {
            this.ipcRenderer = electronAPI;
        } else {
            console.warn('FCMNotificationReceiver: electronAPI not available - running in development mode');
            return;
        }
        
        if (!this.ipcRenderer) {
            console.error('FCMNotificationReceiver: electronAPI not available in renderer process');
            return;
        }

        // register ipc channel handlers
        this.ipcRenderer.on('push-receiver.register.success', (event: any, data: any) => this.onRegisterSuccess(event, data));
        this.ipcRenderer.on('push-receiver.register.error', (event: any, data: any) => this.onRegisterError(event, data));
        this.ipcRenderer.on('push-receiver.notifications.listen.started', (event: any, data: any) => this.onNotificationListenStarted(event, data));
        this.ipcRenderer.on('push-receiver.notifications.listen.stopped', (event: any, data: any) => this.onNotificationListenStopped(event, data));
        this.ipcRenderer.on('push-receiver.notifications.received', (event: any, data: any) => this.onNotificationReceived(event, data));
        this.ipcRenderer.on('push-receiver.notifications.error', (event: any, data: any) => this.onNotificationError(event, data));
    }

    private onRegisterSuccess(event: any, data: any) {
        this.emit('register.success', data);
    }

    private onRegisterError(event: any, data: any) {
        this.emit('register.error', data);
    }

    private onNotificationListenStarted(event: any) {
        this.emit('notifications.listen.started');
    }

    private onNotificationListenStopped(event: any) {
        this.emit('notifications.listen.stopped');
    }

    private onNotificationReceived(event: any, data: any) {
        this.emit('notifications.received', data);
    }

    private onNotificationError(event: any, data: any) {
        this.emit('notifications.error', data);
    }

    /**
     * Ask the main process to register a new android device to receive fcm notifications.
     *
     * Events Emitted:
     * - register.success
     * - register.error
     */
    register() {
        if (!this.ipcRenderer) {
            console.warn('Cannot register FCM: electronAPI not available - running in development mode');
            return;
        }

        console.log('Registering FCM...');

        // hardcoded fcm credentials (using the same as Vue repo)
        const apiKey = "AIzaSyB5y2y-Tzqb4-I4Qnlsh_9naYv_TD8pCvY";
        const projectId = "rust-companion-app";
        const gcmSenderId = "976529667804";
        const gmsAppId = "1:976529667804:android:d6f1ddeb4403b338fea619";
        const androidPackageName = "com.facepunch.rust.companion";
        const androidPackageCert = "E28D05345FB78A7A1A63D70F4A302DBF426CA5AD";

        // send register request to main process
        this.ipcRenderer.send('push-receiver.register', {
            apiKey,
            projectId,
            gcmSenderId,
            gmsAppId,
            androidPackageName,
            androidPackageCert,
        });
    }

    /**
     * Ask the main process to start listening for notification via fcm.
     * When notifications are received, the notifications.received event is emitted.
     *
     * Events Emitted:
     * - notifications.listen.started
     * - notifications.received
     * - notifications.error
     */
    startListeningForNotifications(credentials: any, persistentIds: string[]) {
        this.ipcRenderer.send('push-receiver.notifications.listen.start', {
            credentials: credentials,
            persistentIds: persistentIds,
        });
    }

    /**
     * Ask the main process to stop listening for notifications via fcm.
     *
     * Events Emitted:
     * - notifications.listen.stopped
     */
    stopListeningForNotifications() {
        this.ipcRenderer.send('push-receiver.notifications.listen.stop');
    }
}