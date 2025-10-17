const axios = require('axios');

/**
 * This class is responsible for registering with the Rust Companion API.
 *
 * Events are received via ipc from the renderer process, executed here in the main
 * process, and results are then sent back to the renderer process via ipc.
 */
class RustCompanionManager {

    constructor(ipcMain) {

        // global vars
        this.ipcMain = ipcMain;

        // register ipc channel handlers
        ipcMain.on('rust-companion-api.register', (event, data) => this.onRegister(event, data));

    }

    onRegisterSuccess(event) {
        event.sender.send('rust-companion-api.register.success');
    }

    onRegisterError(event, error, responseCode) {
        event.sender.send('rust-companion-api.register.error', {
            'error': error,
            'response_code': responseCode,
        });
    }

    /**
     * Register with Rust Companion API
     * @param event
     * @param data
     */
    async onRegister(event, data) {

        console.log("=== Rust Companion API Registration ===");
        console.log("Registration data:", {
            deviceId: data.deviceId,
            token: data.token ? data.token.substring(0, 20) + "..." : "null",
            expoPushToken: data.expoPushToken ? data.expoPushToken.substring(0, 20) + "..." : "null"
        });

        const requestPayload = {
            AuthToken: data.token,
            DeviceId: data.deviceId,
            PushKind: 3,
            PushToken: data.expoPushToken,
        };

        console.log("Request payload:", {
            AuthToken: requestPayload.AuthToken ? requestPayload.AuthToken.substring(0, 20) + "..." : "null",
            DeviceId: requestPayload.DeviceId,
            PushKind: requestPayload.PushKind,
            PushToken: requestPayload.PushToken ? requestPayload.PushToken.substring(0, 20) + "..." : "null"
        });

        // register with rust companion api
        axios.post('https://companion-rust.facepunch.com:443/api/push/register', requestPayload).then((response) => {

            console.log("Registration successful:", response.status);
            // success
            this.onRegisterSuccess(event);

        }).catch((error) => {

            console.log("Registration failed:");
            console.log("Error message:", error.message);
            console.log("Response status:", error.response ? error.response.status : "No response");
            console.log("Response data:", error.response ? error.response.data : "No response data");
            console.log("Request config:", error.config ? {
                url: error.config.url,
                method: error.config.method,
                data: error.config.data
            } : "No config");

            // get response status code
            var responseCode = error.response ? error.response.status : 0;

            // return error
            this.onRegisterError(event, error, responseCode);

        });

    }

}

module.exports = RustCompanionManager;