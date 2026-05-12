"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const node_path_1 = __importDefault(require("node:path"));
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 820,
        minWidth: 1024,
        minHeight: 720,
        backgroundColor: "#f7f7f4",
        autoHideMenuBar: true,
        webPreferences: {
            preload: node_path_1.default.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });
    mainWindow.removeMenu();
    mainWindow.setMenuBarVisibility(false);
    const devUrl = process.env.VITE_DEV_SERVER_URL;
    if (devUrl) {
        void mainWindow.loadURL(devUrl);
        mainWindow.webContents.openDevTools({ mode: "detach" });
    }
    else {
        void mainWindow.loadFile(node_path_1.default.join(__dirname, "../../dist-renderer/index.html"));
    }
}
electron_1.Menu.setApplicationMenu(null);
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_updater_1.autoUpdater.checkForUpdatesAndNotify().catch(() => undefined);
    electron_1.app.on("activate", () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
electron_1.ipcMain.handle("print-current", async (_event, options) => {
    if (!mainWindow) {
        return { ok: false };
    }
    const ok = await printWebContents(mainWindow, options);
    return { ok };
});
electron_1.ipcMain.handle("print-url", async (_event, url, options) => {
    const printWindow = new electron_1.BrowserWindow({
        show: false,
        webPreferences: {
            sandbox: true
        }
    });
    await printWindow.loadURL(url);
    const ok = await printWebContents(printWindow, options);
    printWindow.close();
    return { ok };
});
function printWebContents(window, options) {
    return new Promise((resolve) => {
        window.webContents.print({
            silent: options?.silent ?? false,
            deviceName: options?.deviceName,
            printBackground: true
        }, (success) => resolve(success));
    });
}
