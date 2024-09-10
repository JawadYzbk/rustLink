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

        // register with rust companion api
        axios.post('https://companion-rust.facepunch.com:443/api/push/register', {
            AuthToken: data.token,
            DeviceId: data.deviceId,
            PushKind: 3,
            PushToken: data.expoPushToken,
        }).then((response) => {

            // success
            this.onRegisterSuccess(event);

        }).catch((error) => {

            // get response status code
            var responseCode = error.response ? error.response.status : 0;

            // return error
            this.onRegisterError(event, error, responseCode);

        });

    }

}

module.exports = RustCompanionManager;