module.exports = { contents: "\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nconst electron_1 = require(\"electron\");\r\nconst path_1 = require(\"path\");\r\nconst os_1 = require(\"os\");\r\nclass AppWindow extends electron_1.BrowserWindow {\r\n    constructor() {\r\n        super({\r\n            frame: process.env.ENV === 'dev' || os_1.platform() === 'darwin',\r\n            minWidth: 400,\r\n            minHeight: 450,\r\n            width: 900,\r\n            height: 700,\r\n            show: false,\r\n            titleBarStyle: 'hiddenInset',\r\n            webPreferences: {\r\n                plugins: true,\r\n                nodeIntegration: true,\r\n            },\r\n            icon: path_1.resolve(electron_1.app.getAppPath(), 'static/app-icons/icon.png'),\r\n        });\r\n        process.on('uncaughtException', error => {\r\n            console.error(error);\r\n        });\r\n        if (process.env.ENV === 'dev') {\r\n            this.webContents.openDevTools({ mode: 'detach' });\r\n            this.loadURL('http://localhost:4444/app.html');\r\n        }\r\n        else {\r\n            this.loadURL(path_1.join('file://', electron_1.app.getAppPath(), 'build/app.html'));\r\n        }\r\n        this.once('ready-to-show', () => {\r\n            this.show();\r\n        });\r\n    }\r\n}\r\nexports.AppWindow = AppWindow;\r\n",
dependencies: ["electron","path","os"],
sourceMap: {},
headerContent: undefined,
mtime: 1550866424712,
devLibsRequired : undefined,
ac : undefined,
_ : {}
}
