"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("idDaddy", {
    printUrl: (url, options) => electron_1.ipcRenderer.invoke("print-url", url, options),
    printCurrent: (options) => electron_1.ipcRenderer.invoke("print-current", options),
    versions: {
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node
    }
});
