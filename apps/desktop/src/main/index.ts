import { app, BrowserWindow, ipcMain, Menu } from "electron";
import { autoUpdater } from "electron-updater";
import path from "node:path";
import https from "node:https";
import http from "node:http";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: "#fdfaf5",
    titleBarStyle: "hidden",
    icon: path.join(__dirname, "../resources/icon.png"),
    titleBarOverlay: {
      color: "#fdfaf5",
      symbolColor: "#2c3e50",
      height: 32
    },
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
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
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../dist-renderer/index.html"));
  }
}

Menu.setApplicationMenu(null);

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Fetch release metadata from the backend to get isMandatory flag */
function fetchReleaseMetadata(version: string): Promise<{ isMandatory: boolean; releaseNotes: string }> {
  return new Promise((resolve) => {
    // The update server URL from electron-builder publish config
    const updateUrl = "http://localhost:4000";
    const url = `${updateUrl}/updates/release-meta?version=${encodeURIComponent(version)}`;
    const mod = url.startsWith("https") ? https : http;

    const req = mod.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve({ isMandatory: !!json.isMandatory, releaseNotes: json.releaseNotes ?? "" });
        } catch {
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
let pendingUpdateInfo: { version: string; releaseNotes: string; mandatory: boolean } | null = null;

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();

  // ── IPC: version ───────────────────────────────────────────────────────────
  ipcMain.handle("get-app-version", () => app.getVersion());

  // ── IPC: renderer signals it is ready — re-send cached update if any ───────
  ipcMain.handle("renderer-ready", (_event) => {
    if (pendingUpdateInfo) {
      // Small delay so the component has time to register its listener
      setTimeout(() => {
        mainWindow?.webContents.send("update-downloaded", pendingUpdateInfo);
      }, 800);
    }
  });

  // ── IPC: install / dismiss / check ─────────────────────────────────────────
  ipcMain.handle("install-update", () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.handle("dismiss-update", () => {
    if (pendingUpdateInfo?.mandatory) return; // cannot dismiss mandatory
    pendingUpdateInfo = null;
  });

  ipcMain.handle("check-for-updates", () => {
    autoUpdater.checkForUpdates().catch(() => undefined);
  });

  // ── Auto-updater ───────────────────────────────────────────────────────────
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.checkForUpdates().catch(() => undefined);

  autoUpdater.on("error", (err) => {
    console.error("[AutoUpdater] Error:", err.message);
  });

  autoUpdater.on("checking-for-update", () => {
    console.log("[AutoUpdater] Checking for update…");
  });

  autoUpdater.on("update-available", (info) => {
    console.log("[AutoUpdater] Update available:", info.version);
  });

  autoUpdater.on("update-not-available", () => {
    console.log("[AutoUpdater] Already up-to-date.");
  });

  autoUpdater.on("download-progress", (prog) => {
    console.log(`[AutoUpdater] Download progress: ${Math.round(prog.percent)}%`);
  });

  autoUpdater.on("update-downloaded", async (info) => {
    console.log("[AutoUpdater] Update downloaded:", info.version);

    // Normalise release notes (can be string | array)
    let notes = "";
    if (typeof info.releaseNotes === "string") {
      notes = info.releaseNotes;
    } else if (Array.isArray(info.releaseNotes)) {
      notes = (info.releaseNotes as Array<{ version: string; note: string }>)
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

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Mandatory update: install on close instead of quitting
app.on("before-quit", (event) => {
  if (pendingUpdateInfo?.mandatory) {
    event.preventDefault();
    autoUpdater.quitAndInstall();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// ── Print helpers ─────────────────────────────────────────────────────────────

ipcMain.handle("print-current", async (_event, options?: { silent?: boolean; deviceName?: string }) => {
  if (!mainWindow) return { ok: false };
  const ok = await printWebContents(mainWindow, options);
  return { ok };
});

ipcMain.handle("print-url", async (_event, url: string, options?: { silent?: boolean; deviceName?: string }) => {
  const printWindow = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  await printWindow.loadURL(url);
  const ok = await printWebContents(printWindow, options);
  printWindow.close();
  return { ok };
});

function printWebContents(window: BrowserWindow, options?: { silent?: boolean; deviceName?: string }) {
  return new Promise<boolean>((resolve) => {
    window.webContents.print(
      { silent: options?.silent ?? false, deviceName: options?.deviceName, printBackground: true },
      (success) => resolve(success)
    );
  });
}
