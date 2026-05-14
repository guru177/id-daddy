"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// NOTE: `app` is NOT available in sandboxed preload — version comes via IPC from main
electron_1.contextBridge.exposeInMainWorld("idDaddy", {
    printUrl: (url, options) => electron_1.ipcRenderer.invoke("print-url", url, options),
    printCurrent: (options) => electron_1.ipcRenderer.invoke("print-current", options),
    // Version is fetched synchronously from main via a dedicated handler
    getAppVersion: () => electron_1.ipcRenderer.invoke("get-app-version"),
    versions: {
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node
    },
    // Update APIs
    onUpdateDownloaded: (callback) => {
        electron_1.ipcRenderer.on("update-downloaded", (_event, info) => callback(info));
        // Return cleanup function
        return () => electron_1.ipcRenderer.removeAllListeners("update-downloaded");
    },
    // Signal to main that renderer is ready (in case update already downloaded)
    rendererReady: () => electron_1.ipcRenderer.invoke("renderer-ready"),
    installUpdate: () => electron_1.ipcRenderer.invoke("install-update"),
    dismissUpdate: () => electron_1.ipcRenderer.invoke("dismiss-update"),
    checkForUpdates: () => electron_1.ipcRenderer.invoke("check-for-updates")
});
