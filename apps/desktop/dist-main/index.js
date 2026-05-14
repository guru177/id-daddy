"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const node_path_1 = __importDefault(require("node:path"));
const node_https_1 = __importDefault(require("node:https"));
const node_http_1 = __importDefault(require("node:http"));
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        show: false,
        width: 1280,
        height: 820,
        minWidth: 800,
        minHeight: 600,
        backgroundColor: "#fdfaf5",
        titleBarStyle: "hidden",
        icon: node_path_1.default.join(__dirname, "../resources/icon.ico"),
        titleBarOverlay: {
            color: "#fdfaf5",
            symbolColor: "#2c3e50",
            height: 32
        },
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
    mainWindow.once("ready-to-show", () => {
        mainWindow?.show();
    });
    const devUrl = process.env.VITE_DEV_SERVER_URL;
    if (devUrl) {
        void mainWindow.loadURL(devUrl);
        mainWindow.webContents.openDevTools({ mode: "detach" });
    }
    else {
        void mainWindow.loadFile(node_path_1.default.join(__dirname, "../dist-renderer/index.html"));
    }
}
electron_1.Menu.setApplicationMenu(null);
// ── Helpers ──────────────────────────────────────────────────────────────────
/** Fetch release metadata from the backend to get isMandatory flag */
function fetchReleaseMetadata(version) {
    return new Promise((resolve) => {
        // The update server URL from electron-builder publish config
        const updateUrl = "http://localhost:4000";
        const url = `${updateUrl}/updates/release-meta?version=${encodeURIComponent(version)}`;
        const mod = url.startsWith("https") ? node_https_1.default : node_http_1.default;
        const req = mod.get(url, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ isMandatory: !!json.isMandatory, releaseNotes: json.releaseNotes ?? "" });
                }
                catch {
                    resolve({ isMandatory: false, releaseNotes: "" });
                }
            });
        });
        req.on("error", () => resolve({ isMandatory: false, releaseNotes: "" }));
        req.setTimeout(5000, () => { req.destroy(); resolve({ isMandatory: false, releaseNotes: "" }); });
    });
}
// ── State ─────────────────────────────────────────────────────────────────────
/** Cached update info — kept so we can re-send to renderer if it mounts after download */
let pendingUpdateInfo = null;
// ── App lifecycle ─────────────────────────────────────────────────────────────
electron_1.app.whenReady().then(() => {
    createWindow();
    // ── IPC: version ───────────────────────────────────────────────────────────
    electron_1.ipcMain.handle("get-app-version", () => electron_1.app.getVersion());
    // ── IPC: renderer signals it is ready — re-send cached update if any ───────
    electron_1.ipcMain.handle("renderer-ready", (_event) => {
        if (pendingUpdateInfo) {
            // Small delay so the component has time to register its listener
            setTimeout(() => {
                mainWindow?.webContents.send("update-downloaded", pendingUpdateInfo);
            }, 800);
        }
    });
    // ── IPC: install / dismiss / check ─────────────────────────────────────────
    electron_1.ipcMain.handle("install-update", () => {
        electron_updater_1.autoUpdater.quitAndInstall();
    });
    electron_1.ipcMain.handle("dismiss-update", () => {
        if (pendingUpdateInfo?.mandatory)
            return; // cannot dismiss mandatory
        pendingUpdateInfo = null;
    });
    electron_1.ipcMain.handle("check-for-updates", () => {
        electron_updater_1.autoUpdater.checkForUpdates().catch(() => undefined);
    });
    // ── Auto-updater ───────────────────────────────────────────────────────────
    electron_updater_1.autoUpdater.autoDownload = true;
    electron_updater_1.autoUpdater.autoInstallOnAppQuit = false;
    electron_updater_1.autoUpdater.checkForUpdates().catch(() => undefined);
    electron_updater_1.autoUpdater.on("error", (err) => {
        console.error("[AutoUpdater] Error:", err.message);
    });
    electron_updater_1.autoUpdater.on("checking-for-update", () => {
        console.log("[AutoUpdater] Checking for update…");
    });
    electron_updater_1.autoUpdater.on("update-available", (info) => {
        console.log("[AutoUpdater] Update available:", info.version);
    });
    electron_updater_1.autoUpdater.on("update-not-available", () => {
        console.log("[AutoUpdater] Already up-to-date.");
    });
    electron_updater_1.autoUpdater.on("download-progress", (prog) => {
        console.log(`[AutoUpdater] Download progress: ${Math.round(prog.percent)}%`);
    });
    electron_updater_1.autoUpdater.on("update-downloaded", async (info) => {
        console.log("[AutoUpdater] Update downloaded:", info.version);
        // Normalise release notes (can be string | array)
        let notes = "";
        if (typeof info.releaseNotes === "string") {
            notes = info.releaseNotes;
        }
        else if (Array.isArray(info.releaseNotes)) {
            notes = info.releaseNotes
                .map((r) => r.note)
                .join("\n");
        }
        // Try to get the authoritative mandatory flag + release notes from the backend
        const meta = await fetchReleaseMetadata(info.version);
        const finalNotes = meta.releaseNotes || notes;
        const isMandatory = meta.isMandatory;
        pendingUpdateInfo = {
            version: info.version,
            releaseNotes: finalNotes,
            mandatory: isMandatory
        };
        console.log(`[AutoUpdater] Sending update-downloaded to renderer. mandatory=${isMandatory}`);
        mainWindow?.webContents.send("update-downloaded", pendingUpdateInfo);
    });
    electron_1.app.on("activate", () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
// Mandatory update: install on close instead of quitting
electron_1.app.on("before-quit", (event) => {
    if (pendingUpdateInfo?.mandatory) {
        event.preventDefault();
        electron_updater_1.autoUpdater.quitAndInstall();
    }
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
// ── Print helpers ─────────────────────────────────────────────────────────────
electron_1.ipcMain.handle("print-current", async (_event, options) => {
    if (!mainWindow)
        return { ok: false };
    const ok = await printWebContents(mainWindow, options);
    return { ok };
});
electron_1.ipcMain.handle("print-url", async (_event, url, options) => {
    const printWindow = new electron_1.BrowserWindow({ show: false, webPreferences: { sandbox: true } });
    await printWindow.loadURL(url);
    const ok = await printWebContents(printWindow, options);
    printWindow.close();
    return { ok };
});
function printWebContents(window, options) {
    return new Promise((resolve) => {
        window.webContents.print({ silent: options?.silent ?? false, deviceName: options?.deviceName, printBackground: true }, (success) => resolve(success));
    });
}
