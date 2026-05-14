import { contextBridge, ipcRenderer } from "electron";
// NOTE: `app` is NOT available in sandboxed preload — version comes via IPC from main

contextBridge.exposeInMainWorld("idDaddy", {
  printUrl: (url: string, options?: { silent?: boolean; deviceName?: string }) =>
    ipcRenderer.invoke("print-url", url, options),
  printCurrent: (options?: { silent?: boolean; deviceName?: string }) =>
    ipcRenderer.invoke("print-current", options),
  // Version is fetched synchronously from main via a dedicated handler
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  },
  // Update APIs
  onUpdateDownloaded: (
    callback: (info: { version: string; releaseNotes: string; mandatory: boolean }) => void
  ) => {
    ipcRenderer.on("update-downloaded", (_event, info) => callback(info));
    // Return cleanup function
    return () => ipcRenderer.removeAllListeners("update-downloaded");
  },
  // Signal to main that renderer is ready (in case update already downloaded)
  rendererReady: () => ipcRenderer.invoke("renderer-ready"),
  installUpdate: () => ipcRenderer.invoke("install-update"),
  dismissUpdate: () => ipcRenderer.invoke("dismiss-update"),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates")
});
