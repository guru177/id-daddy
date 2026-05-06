import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("idDaddy", {
  printUrl: (url: string, options?: { silent?: boolean; deviceName?: string }) =>
    ipcRenderer.invoke("print-url", url, options),
  printCurrent: (options?: { silent?: boolean; deviceName?: string }) =>
    ipcRenderer.invoke("print-current", options),
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  }
});
