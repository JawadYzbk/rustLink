module.exports = {
    pluginOptions: {
        electronBuilder: {
            preload: 'src/preload.js',
            builderOptions: {
                productName: "RustLink",
                copyright: "Copyright © 2023 Jawad Yazbek",
                appId: 'com.jawadyzbk.rustlink',
                artifactName: 'RustLink-${version}-${os}-${arch}.${ext}',
                "mac": {
                    "icon": "./public/images/icon.png",
                },
                "win": {
                    "icon": "./public/images/icon.png",
                },
            },
            externals: [
                'push-receiver',
                '@liamcottle/push-receiver',
            ],
        },
    },
}